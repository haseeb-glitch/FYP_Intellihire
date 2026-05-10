"""
Company Question Scraper
========================
Scrapes real interview questions from the internet for 20+ tech companies.
Uses SerpAPI for search, BeautifulSoup for HTML parsing, and Groq LLM
ONLY for cleaning/categorizing scraped text (not generating questions).

Usage:
    python backend/utils/company_question_scraper.py                          # All companies
    python backend/utils/company_question_scraper.py --company Google         # Single company
    python backend/utils/company_question_scraper.py --company Meta --role "Frontend Engineer"
"""

import os
import sys
import json
import time
import argparse
import re
import requests
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing beautifulsoup4...")
    os.system(f"{sys.executable} -m pip install beautifulsoup4 lxml")
    from bs4 import BeautifulSoup

import mongoengine as db
from backend.config import Config
from backend.models.interview import QuestionBank, CompanyQuestionBank
from backend.agents.llm_client import call_llm, safe_parse_json
from backend.utils.constants import COMPANY_REGISTRY, SUPPORTED_DOMAINS


# --- SerpAPI Search ---------------------------------------------

def search_interview_questions(company, role, api_key):
    """
    Uses SerpAPI to search for real interview questions for a company/role.
    Returns a list of result snippets and URLs.
    """
    queries = [
        f"{company} {role} interview questions",
        f"{company} {role} interview experience 2024",
        f"glassdoor {company} {role} interview questions asked",
    ]

    all_snippets = []
    all_urls = []

    for query in queries:
        try:
            params = {
                "q": query,
                "api_key": api_key,
                "engine": "google",
                "num": 8
            }
            response = requests.get("https://serpapi.com/search", params=params, timeout=15)
            data = response.json()

            if 'error' in data:
                print(f"  SerpAPI error: {data['error']}")
                continue

            for result in data.get('organic_results', []):
                snippet = result.get('snippet', '')
                url = result.get('link', '')
                title = result.get('title', '')

                if snippet:
                    all_snippets.append(f"[{title}] {snippet}")
                if url and url not in all_urls:
                    all_urls.append(url)

            # Rate limit - be respectful
            time.sleep(1)

        except Exception as e:
            print(f"  Search error for '{query}': {e}")

    return all_snippets, all_urls[:5]  # Limit URLs to scrape


# --- Web Page Scraper -------------------------------------------

def scrape_questions_from_url(url):
    """
    Fetches a URL and extracts question-like text using BeautifulSoup.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return []

        soup = BeautifulSoup(response.text, 'lxml')

        # Remove script, style, nav, footer elements
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            tag.decompose()

        questions = []
        text_content = soup.get_text(separator='\n', strip=True)

        # Extract lines that look like questions
        for line in text_content.split('\n'):
            line = line.strip()
            # Must end with ? or start with common question patterns
            if len(line) > 20 and len(line) < 500:
                if line.endswith('?'):
                    questions.append(line)
                elif any(line.lower().startswith(p) for p in [
                    'how ', 'what ', 'why ', 'when ', 'where ', 'which ',
                    'can you ', 'could you ', 'tell me ', 'describe ',
                    'explain ', 'design ', 'implement ', 'write ',
                    'given ', 'suppose ', 'imagine ', 'walk me '
                ]):
                    questions.append(line)

        # Also look for list items (ol/ul > li) that contain questions
        for li in soup.find_all('li'):
            text = li.get_text(strip=True)
            if len(text) > 20 and len(text) < 500 and '?' in text:
                if text not in questions:
                    questions.append(text)

        return questions

    except Exception as e:
        print(f"  Scrape error for {url[:50]}...: {e}")
        return []


# --- LLM Cleaner (NOT generator) --------------------------------

def clean_and_categorize(company, role, raw_questions, snippets):
    """
    Uses Groq LLM ONLY to clean and categorize scraped questions.
    Does NOT generate new questions - only structures what was scraped.
    """
    combined_text = "\n".join([f"- {q}" for q in raw_questions[:50]])
    snippet_text = "\n".join(snippets[:15])

    system_prompt = f"""You are a data cleaning assistant. I will give you RAW scraped interview data 
from the internet about {company} {role} interviews.

Your job is to:
1. EXTRACT only the actual interview questions from the raw data
2. REMOVE duplicates, noise, and non-question text
3. CATEGORIZE each question as 'technical', 'hr', or 'stress'
4. RATE difficulty as 'easy', 'medium', or 'hard'
5. IDENTIFY the subtype (e.g., 'coding', 'system_design', 'behavioral', 'situational', 'leadership')

CRITICAL RULES:
- Do NOT invent or generate new questions
- Only extract questions that appear in the provided data
- If the data is poor quality, return fewer questions rather than making them up
- Clean up formatting but keep the original meaning

Return STRICT JSON:
{{
    "questions": [
        {{
            "text": "The cleaned question text",
            "category": "technical|hr|stress",
            "difficulty": "easy|medium|hard",
            "subtype": "coding|system_design|behavioral|situational|leadership|conceptual|problem_solving"
        }}
    ]
}}"""

    user_message = f"""Here is RAW scraped data about {company} {role} interviews:

--- SCRAPED QUESTIONS ---
{combined_text}

--- SEARCH SNIPPETS ---
{snippet_text}

Extract and clean the actual interview questions from above. Do NOT invent new questions."""

    try:
        raw = call_llm(system_prompt, user_message)
        data = safe_parse_json(raw)
        return data.get('questions', [])
    except Exception as e:
        print(f"  LLM cleaning error: {e}")
        return []


# --- Database Saver ---------------------------------------------

def save_questions(company, domain, role, questions):
    """
    Saves cleaned questions to MongoDB CompanyQuestionBank, skipping duplicates.
    """
    saved = 0
    skipped = 0
    domain_key = domain.lower().replace(" ", "_").replace("&", "and")

    for q in questions:
        text = q.get('text', '').strip()
        if not text or len(text) < 15:
            continue

        # Check for duplicates (exact match in the NEW table)
        existing = CompanyQuestionBank.objects(
            question_text=text,
            company_name=company
        ).first()

        if existing:
            skipped += 1
            continue

        new_q = CompanyQuestionBank(
            company_name=company,
            role=role,
            domain=domain_key,
            category=q.get('category', 'technical'),
            difficulty=q.get('difficulty', 'medium'),
            question_text=text,
            subtype=q.get('subtype', 'general'),
            created_at=datetime.utcnow()
        )
        new_q.save()
        saved += 1

    return saved, skipped


# --- Main Scraper Pipeline -------------------------------------

def scrape_company(company, roles=None, api_key=None):
    """
    Full pipeline for one company: Search -> Scrape -> Clean -> Save
    """
    if not api_key:
        print(f"ERROR: SERPAPI_KEY not found. Cannot scrape.")
        return

    company_info = COMPANY_REGISTRY.get(company)
    if not company_info:
        print(f"WARNING: {company} not in COMPANY_REGISTRY. Using default domains.")
        company_info = {"domains": ["Software Engineering"], "roles": ["Software Engineer"]}

    target_roles = roles or company_info.get('roles', ['Software Engineer'])
    target_domains = company_info.get('domains', ['Software Engineering'])

    print(f"\n{'='*60}")
    print(f"  Scraping: {company}")
    print(f"  Roles: {', '.join(target_roles)}")
    print(f"  Domains: {', '.join(target_domains)}")
    print(f"{'='*60}")

    total_saved = 0
    total_skipped = 0

    for role in target_roles:
        print(f"\n  [{company}] Role: {role}")
        print(f"  {'-'*40}")

        # 1. Search
        print(f"    Searching the internet...")
        snippets, urls = search_interview_questions(company, role, api_key)
        print(f"    Found {len(snippets)} snippets, {len(urls)} URLs")

        # 2. Scrape pages
        all_raw_questions = []
        for url in urls:
            print(f"    Scraping: {url[:60]}...")
            page_questions = scrape_questions_from_url(url)
            all_raw_questions.extend(page_questions)
            time.sleep(0.5)  # Be respectful

        print(f"    Extracted {len(all_raw_questions)} raw questions from pages")

        if not all_raw_questions and not snippets:
            print(f"    No data found for {company} {role}. Skipping.")
            continue

        # 3. Clean & categorize with LLM
        print(f"    Cleaning & categorizing with LLM...")
        cleaned = clean_and_categorize(company, role, all_raw_questions, snippets)
        print(f"    Cleaned down to {len(cleaned)} structured questions")

        # 4. Save to DB (Match role to domain if possible)
        domain = target_domains[0] if target_domains else "Software Engineering"
        for d in target_domains:
            # If role name is in domain name (e.g. "ML Engineer" in "Machine Learning Engineering")
            if any(word.lower() in d.lower() for word in role.split()):
                domain = d
                break
        
        saved, skipped = save_questions(company, domain, role, cleaned)
        total_saved += saved
        total_skipped += skipped
        print(f"    Saved: {saved} | Skipped (duplicates): {skipped}")

        # Rate limit between roles
        time.sleep(2)

    print(f"\n  TOTAL for {company}: {total_saved} saved, {total_skipped} skipped")
    return total_saved


def run_all():
    """Scrapes all 20 companies."""
    api_key = os.environ.get('SERPAPI_KEY')
    if not api_key:
        print("ERROR: SERPAPI_KEY environment variable not set!")
        print("Add it to your .env file: SERPAPI_KEY=your_key_here")
        return

    grand_total = 0

    for company in COMPANY_REGISTRY:
        try:
            count = scrape_company(company, api_key=api_key)
            grand_total += (count or 0)
        except Exception as e:
            print(f"  ERROR scraping {company}: {e}")
            continue

        # Longer pause between companies
        time.sleep(3)

    print(f"\n{'='*60}")
    print(f"  SCRAPING COMPLETE")
    print(f"  Total questions saved: {grand_total}")
    print(f"{'='*60}")


# --- CLI Entry Point --------------------------------------------

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scrape company interview questions')
    parser.add_argument('--company', type=str, help='Scrape a specific company (e.g., Google)')
    parser.add_argument('--role', type=str, help='Scrape for a specific role (e.g., "Software Engineer")')
    args = parser.parse_args()

    from dotenv import load_dotenv
    load_dotenv()
    
    # Connect to MongoDB
    db.connect(host=Config.MONGODB_SETTINGS['host'])
    print(f"Connected to MongoDB at {Config.MONGODB_SETTINGS['host']}")

    if args.company:
        roles = [args.role] if args.role else None
        scrape_company(args.company, roles=roles, api_key=os.environ.get('SERPAPI_KEY'))
    else:
        run_all()

        # Print final stats
        total = QuestionBank.objects(company_name__ne=None).count()
        print(f"\nTotal company-specific questions in DB: {total}")

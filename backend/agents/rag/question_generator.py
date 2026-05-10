"""
RAG Question Generator — Uses Groq LLM to generate interview questions
from document chunks provided by the user.
"""

import json
import random
import re
from typing import List, Dict
from backend.agents.llm_client import call_llm, safe_parse_json


QUESTION_GEN_PROMPT = """You are an expert interview question generator for the IntelliHire platform.
Given a chunk of text from a user-uploaded document, generate targeted interview questions.

RULES:
- Generate questions that test understanding of the content
- Each question must be standalone (don't reference "the document")
- Vary question types: conceptual, practical, scenario-based
- Match the specified difficulty level and category
- Return STRICT JSON

Return JSON in this exact format:
{
  "questions": [
    {
      "question_text": "the interview question",
      "category": "hr|technical|stress",
      "difficulty": "easy|medium|hard",
      "subtype": "conceptual|practical|situational|behavioral",
      "expected_topics": ["topic1", "topic2"],
      "requires_code": false
    }
  ]
}
"""


def _extract_keywords(text: str, limit: int = 8) -> List[str]:
    stop_words = {
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your',
        'you', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would',
        'could', 'should', 'about', 'their', 'there', 'what', 'when', 'where',
        'which', 'using', 'use', 'used', 'also', 'than', 'then', 'they'
    }
    words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9+#.-]{2,}\b', text.lower())
    frequencies = {}
    for word in words:
        if word in stop_words:
            continue
        frequencies[word] = frequencies.get(word, 0) + 1

    ranked = sorted(frequencies.items(), key=lambda item: item[1], reverse=True)
    return [word for word, _ in ranked[:limit]]


def _fallback_questions_from_text(
    text: str,
    categories: List[str],
    difficulty: str,
    total_questions: int,
    job_role: str
) -> List[Dict]:
    """
    Build useful personalized questions without an LLM.
    This keeps session launch working when the AI provider is unavailable.
    """
    keywords = _extract_keywords(text)
    topic = ', '.join(keywords[:3]) if keywords else job_role
    templates = [
        (
            "technical",
            "conceptual",
            "Walk me through your experience with {topic} and explain the most important technical decision you made."
        ),
        (
            "technical",
            "practical",
            "How would you apply {topic} to solve a real problem in a {role} role?"
        ),
        (
            "hr",
            "behavioral",
            "Tell me about a time you worked on something related to {topic}. What was your contribution and outcome?"
        ),
        (
            "stress",
            "situational",
            "If a project involving {topic} was behind schedule, how would you prioritize your next steps?"
        ),
        (
            "technical",
            "situational",
            "What trade-offs would you consider before choosing an approach for {topic}?"
        ),
        (
            "hr",
            "behavioral",
            "Which strength from this background would help you most as a {role}, and where do you still need to improve?"
        ),
    ]

    usable_templates = [tpl for tpl in templates if tpl[0] in categories] or templates
    questions = []
    for i in range(total_questions):
        category, subtype, template = usable_templates[i % len(usable_templates)]
        questions.append({
            "question_text": template.format(topic=topic, role=job_role),
            "category": category,
            "difficulty": difficulty,
            "subtype": subtype,
            "expected_topics": keywords[:5],
            "requires_code": False,
            "context_excerpt": text[:300]
        })
    return questions


def generate_questions_from_chunks(
    chunks: List[Dict],
    agent_mode: str = "mixed",
    difficulty: str = "medium",
    total_questions: int = 5,
    job_role: str = "Software Engineer",
    focus_areas: List[str] = None
) -> List[Dict]:
    """
    Generates interview questions from document chunks using LLM.

    Args:
        chunks: List of text chunks from document processor
        agent_mode: 'hr', 'technical', 'stress', or 'mixed'
        difficulty: 'easy', 'medium', 'hard'
        total_questions: Number of questions to generate
        job_role: Target job role
        focus_areas: Optional list of topics to focus on

    Returns:
        List of question dictionaries
    """
    all_questions = []

    # Determine how many questions to generate per chunk
    # Generate more than needed so we can filter the best ones
    questions_per_chunk = max(2, (total_questions * 2) // max(len(chunks), 1))

    # Determine category distribution based on agent mode
    if agent_mode == 'hr':
        categories = ['hr']
    elif agent_mode == 'technical':
        categories = ['technical']
    elif agent_mode == 'stress':
        categories = ['stress']
    else:
        categories = ['hr', 'technical', 'stress']

    # Process each chunk (limit to most relevant chunks)
    selected_chunks = chunks[:min(len(chunks), 6)]  # Max 6 chunks to avoid token overload

    for chunk in selected_chunks:
        chunk_text = chunk.get('text', '')
        if not chunk_text or len(chunk_text.strip()) < 50:
            continue

        category = random.choice(categories)
        focus_str = f"\nFocus areas: {', '.join(focus_areas)}" if focus_areas else ""

        user_message = f"""Generate {questions_per_chunk} {category} interview questions at {difficulty} difficulty level.

Target Role: {job_role}
Category: {category}
Difficulty: {difficulty}{focus_str}

Document Content:
---
{chunk_text[:1500]}
---

Generate exactly {questions_per_chunk} questions based on this content."""

        try:
            response = call_llm(QUESTION_GEN_PROMPT, user_message)
            parsed = safe_parse_json(response)

            if 'error' not in parsed and 'questions' in parsed:
                for q in parsed['questions']:
                    q['context_excerpt'] = chunk_text[:300]
                    q['category'] = q.get('category', category)
                    q['difficulty'] = q.get('difficulty', difficulty)
                    all_questions.append(q)
        except Exception as e:
            print(f"Error generating questions from chunk: {e}")
            continue

    # If we got fewer questions than needed, generate from the full text
    if len(all_questions) < total_questions and chunks:
        combined_text = " ".join([c.get('text', '')[:500] for c in chunks[:3]])
        remaining = total_questions - len(all_questions)
        category = random.choice(categories)

        user_message = f"""Generate {remaining} {category} interview questions at {difficulty} difficulty.

Target Role: {job_role}
Category: {category}

Content Summary:
---
{combined_text[:2000]}
---

Generate exactly {remaining} questions."""

        try:
            response = call_llm(QUESTION_GEN_PROMPT, user_message)
            parsed = safe_parse_json(response)
            if 'error' not in parsed and 'questions' in parsed:
                for q in parsed['questions']:
                    q['context_excerpt'] = combined_text[:300]
                    all_questions.append(q)
        except Exception as e:
            print(f"Error generating fallback questions: {e}")

    if len(all_questions) < total_questions and chunks:
        combined_text = " ".join([c.get('text', '') for c in chunks[:6]])
        fallback_count = total_questions - len(all_questions)
        all_questions.extend(_fallback_questions_from_text(
            combined_text,
            categories,
            difficulty,
            fallback_count,
            job_role
        ))

    # Shuffle and trim to requested count
    random.shuffle(all_questions)
    return all_questions[:total_questions]


def generate_questions_from_prompt(
    prompt_text: str,
    agent_mode: str = "mixed",
    difficulty: str = "medium",
    total_questions: int = 5,
    job_role: str = "Software Engineer"
) -> List[Dict]:
    """
    Generates interview questions from a user-provided text prompt.
    """
    if agent_mode == 'hr':
        categories = ['hr']
    elif agent_mode == 'technical':
        categories = ['technical']
    elif agent_mode == 'stress':
        categories = ['stress']
    else:
        categories = ['hr', 'technical', 'stress']

    all_questions = []

    # Split into batches if we need many questions
    batch_size = min(total_questions, 5)
    batches = max(1, (total_questions + batch_size - 1) // batch_size)

    for i in range(batches):
        remaining = total_questions - len(all_questions)
        if remaining <= 0:
            break

        count = min(batch_size, remaining)
        category = categories[i % len(categories)] if len(categories) > 1 else categories[0]

        user_message = f"""Generate {count} {category} interview questions at {difficulty} difficulty level.

Target Role: {job_role}
Category: {category}
Difficulty: {difficulty}

User's Custom Instructions / Context:
---
{prompt_text[:3000]}
---

Generate exactly {count} questions based on the user's instructions above."""

        try:
            response = call_llm(QUESTION_GEN_PROMPT, user_message)
            parsed = safe_parse_json(response)

            if 'error' not in parsed and 'questions' in parsed:
                for q in parsed['questions']:
                    q['context_excerpt'] = prompt_text[:300]
                    q['category'] = q.get('category', category)
                    q['difficulty'] = q.get('difficulty', difficulty)
                    all_questions.append(q)
        except Exception as e:
            print(f"Error generating prompt-based questions: {e}")

    if len(all_questions) < total_questions:
        fallback_count = total_questions - len(all_questions)
        all_questions.extend(_fallback_questions_from_text(
            prompt_text,
            categories,
            difficulty,
            fallback_count,
            job_role
        ))

    random.shuffle(all_questions)
    return all_questions[:total_questions]

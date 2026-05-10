"""
Question Bank Utility — Loads and serves questions from JSON files.
"""

import json
import os
import random
from flask import current_app
from backend.utils.constants import DOMAIN_QUESTION_FILES, QUESTION_POOL_FILES


def load_questions(domain):
    """
    Loads all questions for a given domain from its JSON file.
    Returns dict with keys: easy, medium, hard.
    """
    filename = DOMAIN_QUESTION_FILES.get(domain)
    if not filename:
        filename = "general.json"

    file_path = os.path.join(current_app.config['QUESTION_BANKS_DIR'], filename)
    if not os.path.exists(file_path):
        return {"easy": [], "medium": [], "hard": []}

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            return data.get("questions", {})
    except Exception as e:
        print(f"Error loading questions for {domain}: {e}")
        return {"easy": [], "medium": [], "hard": []}


def load_category_questions(category):
    """
    Loads questions by category (hr, technical, stress) from pool files.
    """
    filename = QUESTION_POOL_FILES.get(category)
    if not filename:
        return {"easy": [], "medium": [], "hard": []}

    file_path = os.path.join(current_app.config['QUESTION_BANKS_DIR'], filename)
    if not os.path.exists(file_path):
        return {"easy": [], "medium": [], "hard": []}

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            return data.get("questions", {})
    except Exception as e:
        print(f"Error loading {category} questions: {e}")
        return {"easy": [], "medium": [], "hard": []}


def get_random_questions(domain, difficulty, count=5):
    """
    Returns N random questions for a domain at a given difficulty.
    Falls back to medium if requested difficulty is empty.
    """
    pool = load_questions(domain)
    options = pool.get(difficulty, [])

    if not options:
        options = pool.get("medium", [])
    if not options:
        options = pool.get("easy", [])
    if not options:
        return []

    count = min(count, len(options))
    return random.sample(options, count)


def get_domains():
    """
    Returns list of all supported interview domains.
    """
    from backend.utils.constants import SUPPORTED_DOMAINS
    return SUPPORTED_DOMAINS

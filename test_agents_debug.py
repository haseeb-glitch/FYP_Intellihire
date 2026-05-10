import sys
import os
sys.path.append('.')
from dotenv import load_dotenv
load_dotenv()

from backend.agents.agents import hr_agent, technical_agent, stress_agent

print("=" * 60)
print("TEST 1: HR Agent with a WRONG / irrelevant answer")
print("=" * 60)
result = hr_agent.evaluate(
    question="Tell me about a time you led a team through a difficult project.",
    answer="I like pizza and football. The weather is nice today.",
    job_role="Software Engineer",
    company="Google",
    domain="Tech",
    answer_mode="text"
)
print(f"  Overall score: {result.get('overall')}")
print(f"  Clarity: {result.get('clarity')}")
print(f"  Relevance: {result.get('relevance')}")
print(f"  Feedback: {result.get('feedback')}")
print()

print("=" * 60)
print("TEST 2: Technical Agent with a WRONG answer")
print("=" * 60)
result2 = technical_agent.evaluate(
    question="Explain the difference between a stack and a queue.",
    answer="I don't know, maybe they are the same thing?",
    domain="computer_science",
    job_role="Software Engineer",
    answer_mode="text",
    question_subtype="conceptual"
)
print(f"  Overall score: {result2.get('overall')}")
print(f"  Correctness: {result2.get('correctness')}")
print(f"  Feedback: {result2.get('feedback')}")
print()

print("=" * 60)
print("TEST 3: Stress Agent with a very brief/stressed answer")
print("=" * 60)
result3 = stress_agent.evaluate(
    question="What would you do if your manager publicly criticized your work?",
    answer="um... I don't know... maybe... I would just... um...",
    answer_mode="text"
)
print(f"  Overall score: {result3.get('overall')}")
print(f"  Composure: {result3.get('composure')}")
print(f"  Confidence: {result3.get('confidence')}")
print(f"  Feedback: {result3.get('feedback')}")
print()

print("=" * 60)
print("SUMMARY")
print("=" * 60)
scores = [result.get('overall', 5.0), result2.get('overall', 5.0), result3.get('overall', 5.0)]
print(f"  HR Overall: {scores[0]}")
print(f"  Tech Overall: {scores[1]}")
print(f"  Stress Overall: {scores[2]}")
avg = sum(scores) / len(scores)
print(f"  Average: {avg}")
if avg > 4.0:
    print("  WARNING: Scores are still too high for wrong answers!")
else:
    print("  SUCCESS: Agents are correctly scoring wrong answers low.")

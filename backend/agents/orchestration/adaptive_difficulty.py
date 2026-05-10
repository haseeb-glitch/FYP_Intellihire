"""
Adaptive Difficulty Engine

Implements intelligent real-time difficulty adjustment based on candidate performance.
First 40-50% of questions are easy, then dynamically adjusts based on:
- Answer speed (relative to question complexity)
- Score performance
- Confidence indicators
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Difficulty progression thresholds
EASY_PHASE_RATIO = 0.45  # First 45% of questions are easy
PERFORMANCE_THRESHOLD_HIGH = 7.0  # Score above this = candidate doing well
PERFORMANCE_THRESHOLD_LOW = 4.0   # Score below this = candidate struggling
SPEED_THRESHOLD_FAST = 60  # Seconds - considered fast answer
SPEED_THRESHOLD_SLOW = 180  # Seconds - considered slow answer


class AdaptiveDifficultyEngine:
    """
    Tracks candidate performance and determines appropriate difficulty level.
    """

    def __init__(self, total_questions: int, initial_difficulty: str = 'easy'):
        self.total_questions = total_questions
        self.initial_difficulty = initial_difficulty
        self.current_difficulty = 'easy'  # Always start with easy
        self.question_history: List[Dict] = []
        self.cumulative_score = 0.0
        self.consecutive_high_scores = 0
        self.consecutive_low_scores = 0

    def get_easy_phase_count(self) -> int:
        """Returns how many questions should be in the easy phase."""
        return max(2, int(self.total_questions * EASY_PHASE_RATIO))

    def record_answer(self, question_number: int, score: float,
                      time_taken_seconds: int, confidence_score: float = None) -> None:
        """
        Records a candidate's answer performance.

        Args:
            question_number: The question index (1-based)
            score: The agent's score for this answer (0-10)
            time_taken_seconds: How long the candidate took to answer
            confidence_score: Optional confidence metric from stress agent
        """
        record = {
            'question_number': question_number,
            'score': score,
            'time_taken': time_taken_seconds,
            'confidence': confidence_score,
            'difficulty': self.current_difficulty,
            'timestamp': datetime.utcnow().isoformat()
        }
        self.question_history.append(record)
        self.cumulative_score += score

        # Track consecutive performance
        if score >= PERFORMANCE_THRESHOLD_HIGH:
            self.consecutive_high_scores += 1
            self.consecutive_low_scores = 0
        elif score < PERFORMANCE_THRESHOLD_LOW:
            self.consecutive_low_scores += 1
            self.consecutive_high_scores = 0
        else:
            # Reset both for mid-range scores
            self.consecutive_high_scores = max(0, self.consecutive_high_scores - 1)
            self.consecutive_low_scores = max(0, self.consecutive_low_scores - 1)

    def get_average_score(self) -> float:
        """Returns average score across all answered questions."""
        if not self.question_history:
            return 5.0
        return self.cumulative_score / len(self.question_history)

    def get_recent_performance(self, window: int = 3) -> Dict:
        """
        Analyzes recent performance over the last N questions.

        Returns:
            Dict with avg_score, avg_time, trend (improving/declining/stable)
        """
        if not self.question_history:
            return {'avg_score': 5.0, 'avg_time': 90, 'trend': 'stable'}

        recent = self.question_history[-window:]
        avg_score = sum(q['score'] for q in recent) / len(recent)
        avg_time = sum(q['time_taken'] for q in recent) / len(recent)

        # Determine trend
        trend = 'stable'
        if len(recent) >= 2:
            first_half = recent[:len(recent)//2]
            second_half = recent[len(recent)//2:]
            first_avg = sum(q['score'] for q in first_half) / len(first_half)
            second_avg = sum(q['score'] for q in second_half) / len(second_half)

            if second_avg > first_avg + 0.5:
                trend = 'improving'
            elif second_avg < first_avg - 0.5:
                trend = 'declining'

        return {
            'avg_score': round(avg_score, 2),
            'avg_time': int(avg_time),
            'trend': trend
        }

    def determine_next_difficulty(self, next_question_number: int) -> str:
        """
        Intelligently determines the difficulty for the next question.

        Logic:
        1. First 40-50% questions are always easy (warm-up phase)
        2. After warm-up phase:
           - If candidate scores high + answers quickly → increase difficulty
           - If candidate struggles → keep or decrease difficulty
           - Consider consecutive performance patterns

        Args:
            next_question_number: The upcoming question number (1-based)

        Returns:
            'easy', 'medium', or 'hard'
        """
        easy_phase_count = self.get_easy_phase_count()

        # Phase 1: Easy warmup phase
        if next_question_number <= easy_phase_count:
            self.current_difficulty = 'easy'
            return 'easy'

        # Phase 2: Adaptive phase - analyze performance
        recent_perf = self.get_recent_performance()
        avg_score = self.get_average_score()

        # Decision logic for difficulty progression
        if self.current_difficulty == 'easy':
            # Can we move to medium?
            if (recent_perf['avg_score'] >= PERFORMANCE_THRESHOLD_HIGH and
                self.consecutive_high_scores >= 2):
                # Candidate is doing excellent - move to medium
                self.current_difficulty = 'medium'
            elif (recent_perf['avg_score'] >= 5.5 and
                  recent_perf['trend'] in ['improving', 'stable'] and
                  self.consecutive_low_scores == 0):
                # Candidate is doing reasonably well - try medium
                self.current_difficulty = 'medium'
            # Otherwise stay at easy

        elif self.current_difficulty == 'medium':
            # Should we go to hard or back to easy?
            if self.consecutive_low_scores >= 2:
                # Struggling - go back to easy
                self.current_difficulty = 'easy'
            elif (recent_perf['avg_score'] >= PERFORMANCE_THRESHOLD_HIGH and
                  self.consecutive_high_scores >= 2 and
                  recent_perf['avg_time'] < SPEED_THRESHOLD_SLOW):
                # Excelling at medium - move to hard
                self.current_difficulty = 'hard'
            # Otherwise stay at medium

        elif self.current_difficulty == 'hard':
            # Should we stay at hard or step down?
            if self.consecutive_low_scores >= 1:
                # Even one low score at hard = step back to medium
                self.current_difficulty = 'medium'
            elif recent_perf['avg_score'] < 5.0:
                # Average below 5 at hard = step back
                self.current_difficulty = 'medium'
            # Otherwise stay at hard

        return self.current_difficulty

    def get_performance_summary(self) -> Dict:
        """
        Returns a comprehensive summary of the candidate's performance.
        Useful for the results page.
        """
        if not self.question_history:
            return {
                'total_answered': 0,
                'average_score': 0,
                'difficulty_progression': [],
                'performance_trend': 'N/A',
                'final_difficulty_reached': 'easy',
                'speed_category': 'N/A'
            }

        # Calculate difficulty progression
        difficulty_counts = {'easy': 0, 'medium': 0, 'hard': 0}
        for q in self.question_history:
            difficulty_counts[q['difficulty']] += 1

        # Find highest difficulty reached
        if difficulty_counts['hard'] > 0:
            final_diff = 'hard'
        elif difficulty_counts['medium'] > 0:
            final_diff = 'medium'
        else:
            final_diff = 'easy'

        # Speed analysis
        avg_time = sum(q['time_taken'] for q in self.question_history) / len(self.question_history)
        if avg_time < SPEED_THRESHOLD_FAST:
            speed_cat = 'fast'
        elif avg_time > SPEED_THRESHOLD_SLOW:
            speed_cat = 'slow'
        else:
            speed_cat = 'moderate'

        recent = self.get_recent_performance()

        return {
            'total_answered': len(self.question_history),
            'average_score': round(self.get_average_score(), 2),
            'difficulty_progression': [
                {'difficulty': 'easy', 'count': difficulty_counts['easy']},
                {'difficulty': 'medium', 'count': difficulty_counts['medium']},
                {'difficulty': 'hard', 'count': difficulty_counts['hard']}
            ],
            'performance_trend': recent['trend'],
            'final_difficulty_reached': final_diff,
            'speed_category': speed_cat,
            'average_time_seconds': int(avg_time),
            'per_question_data': [
                {
                    'question': q['question_number'],
                    'score': q['score'],
                    'difficulty': q['difficulty'],
                    'time': q['time_taken']
                }
                for q in self.question_history
            ]
        }


# Session-level cache for adaptive engines
_session_engines: Dict[str, AdaptiveDifficultyEngine] = {}


def get_engine(session_id: str, total_questions: int = 5) -> AdaptiveDifficultyEngine:
    """
    Gets or creates an adaptive difficulty engine for a session.
    """
    if session_id not in _session_engines:
        _session_engines[session_id] = AdaptiveDifficultyEngine(total_questions)
    return _session_engines[session_id]


def clear_engine(session_id: str) -> None:
    """Removes the engine for a completed session."""
    if session_id in _session_engines:
        del _session_engines[session_id]


def record_and_get_next_difficulty(
    session_id: str,
    question_number: int,
    score: float,
    time_taken: int,
    total_questions: int,
    confidence_score: float = None
) -> Tuple[str, Dict]:
    """
    Convenience function: Records answer and returns next difficulty.

    Returns:
        Tuple of (next_difficulty, performance_summary)
    """
    engine = get_engine(session_id, total_questions)
    engine.record_answer(question_number, score, time_taken, confidence_score)
    next_diff = engine.determine_next_difficulty(question_number + 1)
    summary = engine.get_performance_summary()

    return next_diff, summary

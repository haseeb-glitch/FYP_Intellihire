from fastapi import APIRouter, Depends, HTTPException
from backend.models.user import User
from backend.models.interview import InterviewSession
from backend.models.report import EvaluationScore
from backend.routes.auth import get_current_user

admin_router = APIRouter()

async def admin_required(current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required!")
    return current_user

@admin_router.get('/stats')
async def get_stats(current_user = Depends(admin_required)):
    """
    Returns high-level statistics for the admin dashboard.
    """
    total_users = User.objects.count()
    total_interviews = InterviewSession.objects.count()
    completed_interviews = InterviewSession.objects(status='completed').count()
    
    # Calculate average final score
    avg_score = EvaluationScore.objects.average('final_score') or 0.0
    
    return {
        'total_users': total_users,
        'total_interviews': total_interviews,
        'completed_interviews': completed_interviews,
        'average_score': round(avg_score, 2)
    }

@admin_router.get('/users')
async def get_users(current_user = Depends(admin_required)):
    """
    Returns a list of all users with their recent scores.
    """
    users = User.objects.all()
    result = []
    
    for user in users:
        user_data = user.to_dict()
        
        # Get recent sessions for this user
        recent_sessions = InterviewSession.objects(user=user).order_by('-started_at').limit(5)
        
        user_data['recent_scores'] = []
        for session in recent_sessions:
            evaluation = EvaluationScore.objects(session=session).first()
            score = evaluation.final_score if evaluation else None
            user_data['recent_scores'].append({
                'session_id': str(session.id),
                'domain': session.domain,
                'score': score,
                'date': session.started_at.isoformat()
            })
            
        result.append(user_data)
        
    return result

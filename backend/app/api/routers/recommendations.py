from fastapi import APIRouter, Depends, status
from ...dependencies.auth import get_current_user
from ...data.models.user import User
from ...schemas.user_schemas import UserRecommendationResponse
from ...services import recommendation_service

recommendation_router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@recommendation_router.get("", response_model=list[UserRecommendationResponse])
def get_recommendations(current_user: User = Depends(get_current_user)):
    return recommendation_service.get_recommendations(user_id=current_user.id)


@recommendation_router.post("/{target_id}/hide", status_code=status.HTTP_204_NO_CONTENT)
def hide_user(target_id: str, current_user: User = Depends(get_current_user)):
    recommendation_service.hide_user(user_id=current_user.id, target_user_id=target_id)

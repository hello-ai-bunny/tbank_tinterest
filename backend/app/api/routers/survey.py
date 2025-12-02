from fastapi import APIRouter, Depends, HTTPException, status
from ...dependencies.auth import get_current_user
from ...data.models.user import User
from ...schemas.survey_schemas import InterestBase
from ...services import survey_service

survey_router = APIRouter(prefix="/survey", tags=["survey"])


@survey_router.get("/interests", response_model=list[InterestBase])
def get_all_interests():
    return survey_service.get_all_interests()


@survey_router.get("/me/interests", response_model=list[InterestBase])
def get_my_interests(current_user: User = Depends(get_current_user)):
    return survey_service.get_user_interests(user_id=current_user.id)


@survey_router.put("/me/interests", response_model=list[InterestBase])
def set_my_interests(
    interests_ids: list[str], current_user: User = Depends(get_current_user)
):
    if not interests_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо выбрать хотя бы один интерес.",
        )
    return survey_service.replace_user_interests(
        user_id=current_user.id, interests_ids=interests_ids
    )

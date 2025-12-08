from fastapi import APIRouter, Depends, HTTPException, status
from ...dependencies.auth import get_current_user
from ...data.models.user import User
from ...schemas.user_schemas import UserResponse, ProfileUpdate
from ...services import user_service

user_router = APIRouter(prefix="/users", tags=["users"])


@user_router.get("", response_model=list[UserResponse])
def read_users(current_user: User = Depends(get_current_user)):
    return user_service.get_users(current_user_id=current_user.id)


@user_router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    user_with_profile = user_service.get_user_with_profile(user_id=current_user.id)

    return user_with_profile


@user_router.patch("/me", response_model=UserResponse)
def update_user_profile(
    profile_data: ProfileUpdate, current_user: User = Depends(get_current_user)
):
    udpated_profile = user_service.update_profile(
        user_id=current_user.id, profile_data=profile_data
    )

    if not udpated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден"
        )

    updated_user = user_service.get_user_with_profile(user_id=current_user.id)
    return updated_user

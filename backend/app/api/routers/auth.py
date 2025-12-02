from fastapi import APIRouter, HTTPException, status

from app.core.security import create_access_token
from ...services import user_service
from ...schemas.user_schemas import UserLogin, Token

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post(
    "/register", response_model=Token, status_code=status.HTTP_201_CREATED
)
def register_user(user_data: UserLogin):
    db_user = user_service.get_user_by_login(login=user_data.login)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь уже существует",
        )

    user = user_service.create_user(user_data=user_data)

    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@auth_router.post("/login", response_model=Token)
def login_for_token(form_data: UserLogin):
    user = user_service.get_user_by_login(login=form_data.login)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден"
        )

    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

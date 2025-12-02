from fastapi import APIRouter

from .routers.auth import auth_router
from .routers.survey import survey_router
from .routers.users import user_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(survey_router)
api_router.include_router(user_router)

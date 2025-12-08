import logging
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.websockets import manager
from app.dependencies.auth import get_current_user_from_websocket
from app.services import chat_service
from app.data.models.user import User
from app.core.initial_data import seed_interests
from app.core.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup")
    seed_interests()
    yield
    logger.info("Application shutdown")


app = FastAPI(title="Tinterest API v0.1", lifespan=lifespan)


origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.websocket("/ws/chats/{chat_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    chat_id: str,
    user: User = Depends(get_current_user_from_websocket),
):
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    chat = chat_service.get_chat_by_id(chat_id)
    if not chat or (user.id not in [chat.direct_a, chat.direct_b]):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(chat_id, user.id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(chat_id, user.id)


@app.get("/")
def test() -> dict[str, str]:
    return {"message": "Backend is running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

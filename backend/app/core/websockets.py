from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # {chat_id: {user_id: WebSocket}}
        self.active_connections: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, chat_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = {}
        self.active_connections[chat_id][user_id] = websocket
        logger.info(f"User {user_id} connected to chat {chat_id}.")

    def disconnect(self, chat_id: str, user_id: str):
        if chat_id in self.active_connections and user_id in self.active_connections[chat_id]:
            del self.active_connections[chat_id][user_id]
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]
        logger.info(f"User {user_id} disconnected from chat {chat_id}.")

    async def broadcast(self, chat_id: str, message: str):
        if chat_id in self.active_connections:
            for user_id, connection in self.active_connections[chat_id].items():
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send message to user {user_id} in chat {chat_id}: {e}")


manager = ConnectionManager()

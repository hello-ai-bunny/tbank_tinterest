from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from ..core.websockets import manager
from ..data.db import db_conn
from ..data.models.user import User
from ..data.models.chat import Chat, ChatType
from ..data.models.message import Message
from ..schemas.chat_schemas import MessageCreate, MessageResponse


def get_user_chats(user_id: str):
    with db_conn() as db:
        chats = (
            db.query(Chat)
            .filter(or_(Chat.direct_a == user_id, Chat.direct_b == user_id))
            .options(
                joinedload(Chat.messages),
                joinedload(Chat.direct_a_user).joinedload(User.profile),
                joinedload(Chat.direct_b_user).joinedload(User.profile),
            )
            .all()
        )
        return chats


def get_or_create_direct_chat(user_a_id: str, user_b_id: str) -> Chat:
    if user_a_id == user_b_id:
        raise ValueError("Cannot create a direct chat with oneself.")

    with db_conn() as db:
        u1, u2 = sorted([user_a_id, user_b_id])

        chat = (
            db.query(Chat)
            .filter(Chat.direct_a == u1, Chat.direct_b == u2)
            .first()
        )

        if not chat:
            chat = Chat(direct_a=u1, direct_b=u2, type=ChatType.direct)
            db.add(chat)
            db.commit()
            db.refresh(chat)
        return chat


def get_chat_by_id(chat_id: str) -> Chat | None:
    with db_conn() as db:
        return db.get(Chat, chat_id)


def get_chat_messages(chat_id: str) -> list[Message]:
    with db_conn() as db:
        return (
            db.query(Message)
            .filter(Message.chat_id == chat_id)
            .order_by(Message.created_at.asc())
            .all()
        )


async def create_message(
    chat_id: str, author_id: str, msg_data: MessageCreate
) -> Message:
    with db_conn() as db:
        new_message = Message(
            chat_id=chat_id, author_id=author_id, text=msg_data.text
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)

    message_schema = MessageResponse.model_validate(new_message)
    await manager.broadcast(chat_id, message_schema.model_dump_json())

    return new_message

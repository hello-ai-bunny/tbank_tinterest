from fastapi import APIRouter, Depends, HTTPException, status
from ...dependencies.auth import get_current_user
from ...data.models.user import User
from ...schemas import chat_schemas
from ...services import chat_service, user_service

chat_router = APIRouter(prefix="/chats", tags=["chats"])


def transform_chat_to_schema(chat: User, current_user_id: str) -> chat_schemas.ChatListItem:
    participant_user = None
    if chat.direct_a == current_user_id:
        participant_user = chat.direct_b_user
    else:
        participant_user = chat.direct_a_user
    
    if not participant_user:
        return None

    last_message = None
    if chat.messages:
        latest_msg = sorted(chat.messages, key=lambda m: m.created_at, reverse=True)[0]
        last_message = chat_schemas.MessageResponse.from_orm(latest_msg)
    
    participant_profile = participant_user.profile
    participant_schema = chat_schemas.ChatParticipant(
        id=participant_user.id,
        first_name=participant_profile.first_name if participant_profile else participant_user.email.split('@')[0],
        last_name=participant_profile.last_name if participant_profile else "",
        avatar_url=participant_profile.avatar_url if participant_profile else None
    )

    return chat_schemas.ChatListItem(
        id=chat.id,
        participant=participant_schema,
        last_message=last_message,
    )


@chat_router.get("", response_model=list[chat_schemas.ChatListItem])
def get_my_chats(current_user: User = Depends(get_current_user)):
    chats_from_db = chat_service.get_user_chats(user_id=current_user.id)
    
    response = []
    for chat in chats_from_db:
        chat_item = transform_chat_to_schema(chat, current_user.id)
        if chat_item:
            response.append(chat_item)
    return response


@chat_router.get("/{user_id}", response_model=chat_schemas.ChatListItem)
def get_or_create_chat_with_user(
    user_id: str, current_user: User = Depends(get_current_user)
):
    other_user = user_service.get_user_by_id(user_id=user_id)
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Собеседник не найден"
        )

    chat = chat_service.get_or_create_direct_chat(
        user_a_id=current_user.id, user_b_id=user_id
    )
    
    chat_with_details = chat_service.get_user_chats(user_id=current_user.id)
    found_chat = next((c for c in chat_with_details if c.id == chat.id), None)

    if not found_chat:
        raise HTTPException(status_code=404, detail="Chat not found after creation")

    return transform_chat_to_schema(found_chat, current_user.id)


@chat_router.get("/{chat_id}/messages", response_model=list[chat_schemas.MessageResponse])
def get_messages(chat_id: str, current_user: User = Depends(get_current_user)):
    chat = chat_service.get_chat_by_id(chat_id) # Assumes this function exists
    if not chat or (current_user.id not in [chat.direct_a, chat.direct_b]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    messages = chat_service.get_chat_messages(chat_id=chat_id)
    return messages


@chat_router.post(
    "/{chat_id}/messages",
    response_model=chat_schemas.MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    chat_id: str,
    message_data: chat_schemas.MessageCreate,
    current_user: User = Depends(get_current_user),
):
    chat = chat_service.get_chat_by_id(chat_id)
    if not chat or (current_user.id not in [chat.direct_a, chat.direct_b]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    new_message = await chat_service.create_message(
        chat_id=chat_id, author_id=current_user.id, msg_data=message_data
    )
    return new_message

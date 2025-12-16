from ..data.db import db_conn
from ..data.models.user import User
from ..data.models.user_interaction import UserInteraction, InteractionActionEnum
from sqlalchemy.orm import joinedload
from sqlalchemy import not_

def get_recommendations(user_id: str) -> list[User]:
    with db_conn() as db:
        current_user = db.get(User, user_id)
        if not current_user:
            return []
        
        my_interests = {i.id for i in current_user.interests}

        passed_subquery = (
            db.query(UserInteraction.target_user_id)
            .filter(
                UserInteraction.user_id == user_id,
                UserInteraction.action == InteractionActionEnum.pass_
            )
        )
        candidates = (
            db.query(User)
            .options(joinedload(User.profile), joinedload(User.interests))
            .filter(
                User.id != user_id,
                not_(User.id.in_(passed_subquery))
            )
            .all()
        )
        scored_users = []
        for candidate in candidates:
            their_interests = {i.id for i in candidate.interests}
            
            intersection = len(my_interests & their_interests)
            union = len(my_interests | their_interests)
            
            compatibility = int((intersection / union) * 100) if union > 0 else 0
            
            if compatibility > 0:
                candidate.compatibility = compatibility
                scored_users.append(candidate)

        scored_users.sort(key=lambda x: x.compatibility, reverse=True)

        return scored_users


def hide_user(user_id: str, target_user_id: str):
    
    with db_conn() as db:
        existing = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id,
            UserInteraction.target_user_id == target_user_id,
            UserInteraction.action == InteractionActionEnum.pass_
        ).first()

        if existing:
            return

        interaction = UserInteraction(
            user_id=user_id,
            target_user_id=target_user_id,
            action=InteractionActionEnum.pass_
        )
        db.add(interaction)
        db.commit()

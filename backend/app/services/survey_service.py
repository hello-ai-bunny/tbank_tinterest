from ..data.db import db_conn
from ..data.models.interest import Interest
from ..data.models.user_interest import UserInterest


def get_all_interests() -> list[Interest]:
    with db_conn() as db:
        return db.query(Interest).all()


def get_user_interests(user_id: str) -> list[Interest]:
    with db_conn() as db:
        return (
            db.query(Interest)
            .join(UserInterest)
            .filter(UserInterest.user_id == user_id)
            .order_by(Interest.name)
            .all()
        )


def replace_user_interests(user_id: str, interests_ids: list[str]) -> list[Interest]:
    with db_conn() as db:
        db.query(UserInterest).filter(UserInterest.user_id == user_id).delete(
            synchronize_session=False
        )

        for interest_id in interests_ids:
            if db.get(Interest, interest_id):
                user_interest = UserInterest(user_id=user_id, interest_id=interest_id)
                db.add(user_interest)

    return get_user_interests(user_id=user_id)

from ..data.db import db_conn
from ..data.models.user import User
from ..data.models.profile import Profile
from ..schemas.user_schemas import UserLogin, ProfileUpdate
from sqlalchemy.orm import joinedload


def create_user(user_data: UserLogin) -> User:
    with db_conn() as db:
        new_user = User(email=user_data.login, pass_hash="none")

        db.add(new_user)
        db.flush()

        new_profile = Profile(user_id=new_user.id)
        db.add(new_profile)

        return new_user


def get_user_by_login(login: str) -> User | None:
    with db_conn() as db:
        return db.query(User).filter(User.email == login).first()


def get_user_by_id(user_id: str) -> User | None:
    with db_conn() as db:
        return db.get(User, user_id)


def get_users() -> list[User]:
    with db_conn() as db:
        return db.query(User).options(joinedload(User.profile)).all()


def get_user_with_profile(user_id: str) -> User | None:
    with db_conn() as db:
        return (
            db.query(User)
            .options(joinedload(User.profile))
            .filter(User.id == user_id)
            .first()
        )


def update_profile(user_id: str, profile_data: ProfileUpdate) -> Profile | None:
    with db_conn() as db:
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            return None

        update_data = profile_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(profile, key, value)

        db.add(profile)
        return profile

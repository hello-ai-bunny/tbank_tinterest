from ..data.db import db_conn
from ..data.models.user import User
from ..data.models.profile import Profile
from ..schemas.user_schemas import UserLogin


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

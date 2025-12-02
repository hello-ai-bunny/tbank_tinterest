import logging
from app.data.db import db_conn
from app.data.models.interest import Interest

logger = logging.getLogger(__name__)

INITIAL_INTERESTS = [
    "Программирование",
    "Кино",
    "Музыка",
    "Спорт",
    "Путешествия",
    "Книги",
    "Настольные игры",
    "Фотография",
    "Кулинария",
    "Искусство",
    "Театр",
    "Видеоигры",
    "Наука",
    "Психология",
    "Йога",
]


def seed_interests():
    with db_conn() as db:
        if db.query(Interest).count() == 0:
            for interest_name in INITIAL_INTERESTS:
                db.add(Interest(name=interest_name))
            db.commit()
            logger.info(
                f"Added {len(INITIAL_INTERESTS)} initial interests to the database."
            )
        else:
            logger.info("Interests table is not empty. Skipping seeding.")

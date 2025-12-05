import logging
from app.data.db import db_conn
from app.data.models.interest import Interest

logger = logging.getLogger(__name__)

INITIAL_INTERESTS = [
    {"name": "Программирование", "group": "IT-клубы"},
    {"name": "Киберспорт", "group": "IT-клубы"},
    {"name": "ИИ/Машинное обучение", "group": "IT-клубы"},
    {"name": "Наука", "group": "IT-клубы"},
    {"name": "Кино", "group": "Другое"},
    {"name": "Музыка", "group": "Музыка"},
    {"name": "Рок", "group": "Музыка"},
    {"name": "Поп", "group": "Музыка"},
    {"name": "Классика", "group": "Музыка"},
    {"name": "Электронная", "group": "Музыка"},
    {"name": "Спорт", "group": "Спорт"},
    {"name": "Йога", "group": "Спорт"},
    {"name": "Футбол", "group": "Спорт"},
    {"name": "Баскетбол", "group": "Спорт"},
    {"name": "Плавание", "group": "Спорт"},
    {"name": "Велоспорт", "group": "Спорт"},
    {"name": "Путешествия", "group": "Путешествия"},
    {"name": "Пеший туризм", "group": "Путешествия"},
    {"name": "Пляжный отдых", "group": "Путешествия"},
    {"name": "Экскурсии", "group": "Путешествия"},
    {"name": "Гастрономический туризм", "group": "Путешествия"},
    {"name": "Книги", "group": "Другое"},
    {"name": "Настольные игры", "group": "Настольные игры"},
    {"name": "Монополия", "group": "Настольные игры"},
    {"name": "Эрудит", "group": "Настольные игры"},
    {"name": "Покер", "group": "Настольные игры"},
    {"name": "Квизы", "group": "Настольные игры"},
    {"name": "Фотография", "group": "Другое"},
    {"name": "Кулинария", "group": "Другое"},
    {"name": "Искусство", "group": "Другое"},
    {"name": "Театр", "group": "Другое"},
    {"name": "Видеоигры", "group": "Другое"},
    {"name": "Психология", "group": "Другое"},
]


def seed_interests():
    with db_conn() as db:
        if db.query(Interest).count() == 0:
            for interest_data in INITIAL_INTERESTS:
                db.add(Interest(name=interest_data["name"], group=interest_data["group"]))
            db.commit()
            logger.info(
                f"Added {len(INITIAL_INTERESTS)} initial interests to the database."
            )
        else:
            logger.info("Interests table is not empty. Skipping seeding.")

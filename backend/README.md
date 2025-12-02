# Tinterest Backend

Backend-сервис для приложения Tinterest.

## Требования

*   Python 3.11+
*   `uv` для управления виртуальным окружением и зависимостями

## Быстрый старт

1.  **Клонируйте репозиторий:**
    ```bash
    git clone <repository_url>
    cd backend
    ```

2.  **Создайте и активируйте виртуальное окружение с помощью `uv`:**
    ```bash
    uv venv
    source .venv/bin/activate
    # Для Windows: .venv\Scripts\activate
    ```

3.  **Установите зависимости из `pyproject.toml`:**
    ```bash
    uv sync
    ```

4.  **Настройте переменные окружения:**
    Создайте файл `.env` в корневой папке `backend`.
    Пример `.env` для локальной разработки с SQLite:
    ```env
    DATABASE_URL="sqlite:///./app.db"
    SECRET_KEY="<your_super_secret_key>"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

5.  **Примените миграции базы данных:**
    ```bash
    alembic upgrade head
    ```

6.  **Запустите сервер:**
    ```bash
    python main.py
    ```

После запуска сервер будет доступен по адресу `http://localhost:8000`.
Документация API (Swagger UI) будет доступна по адресу `http://localhost:8000/docs`.

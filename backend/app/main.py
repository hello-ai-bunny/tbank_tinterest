from fastapi import FastAPI
from app.api.router import api_router

app = FastAPI(title='Tinterest API v0.1')

app.include_router(api_router)

@app.get('/')
def test() -> None:
    return {
        "message" : "Backend is running"
    }
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.chatbot import router as chat_router
from app.routes.statement import router as statement_router
from app.routes.transactions import router as transactions_router
from app.routes.goals import router as goals_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.15:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profile_router, prefix="/api", tags=["Profile Dashboard"])
app.include_router(chat_router, prefix="/api", tags=["AI Mentor Chat"])
app.include_router(statement_router, prefix="/api", tags=["Financial Statements"])
app.include_router(transactions_router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(goals_router, prefix="/api/goals", tags=["Goals"])

@app.get("/")
async def root():
    return {
        "status": "success",
        "data": {"message": f"Welcome to the {settings.PROJECT_NAME} API"}
    }

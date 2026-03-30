from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, opportunities, favorites, users, curator, applications
from app.database import engine, Base
import logging

# Create tables
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app = FastAPI(title="Tramplin API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # URL вашего фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(opportunities.router)
app.include_router(favorites.router)
app.include_router(users.router)
app.include_router(curator.router)
app.include_router(applications.router)

@app.on_event("startup")
async def startup():
    await init_db()
    logging.info("Database initialized")

@app.get("/")
async def root():
    return {"message": "Tramplin API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
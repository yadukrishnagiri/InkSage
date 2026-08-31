from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from app.api.routes import files, subjects, chat, guest, cleanup, user

app = FastAPI(title="InkSage API", version="1.0.0")

# CORS origins configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
if cors_origins_env:
    for origin in cors_origins_env.split(","):
        origin = origin.strip()
        if origin and origin not in allowed_origins:
            allowed_origins.append(origin)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not cors_origins_env == "*" else ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.netlify\.app|.*\.onrender\.com)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(guest.router, prefix="/api/guest", tags=["guest"])
app.include_router(cleanup.router, prefix="/api", tags=["cleanup"])
app.include_router(user.router, prefix="/api/user", tags=["user"])

@app.get("/")
async def root():
    return {"message": "InkSage API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


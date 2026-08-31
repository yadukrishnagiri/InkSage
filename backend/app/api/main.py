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

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Serve frontend build static files if present (for single-server hosting)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

frontend_dist = Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to be handled by routers
        if full_path.startswith("api/") or full_path == "health":
            return {"error": "Not found"}
        target_file = frontend_dist / full_path
        if target_file.exists() and target_file.is_file():
            return FileResponse(str(target_file))
        return FileResponse(str(frontend_dist / "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "InkSage API", "version": "1.0.0"}


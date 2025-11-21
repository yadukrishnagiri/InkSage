from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from app.api.routes import files, subjects, chat, guest, cleanup, user

app = FastAPI(title="InkSage API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
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


from fastapi import APIRouter
from app.models.schemas import GuestSession, GuestSessionCreate
from app.services.supabase_service import SupabaseService
import uuid
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

router = APIRouter()

GUEST_UPLOAD_DIR = "./uploads/guest"
_supabase = SupabaseService.get_instance()

@router.post("/session", response_model=GuestSession)
async def create_guest_session():
    """Create a new guest session."""
    session_id = str(uuid.uuid4())
    expires_at = datetime.now() + timedelta(hours=2)
    
    # Save to Supabase
    try:
        result = _supabase.create_guest_session(
            session_id=session_id,
            expires_at=expires_at.isoformat()
        )
        if result:
            return GuestSession(
                session_id=result["session_id"],
                expires_at=datetime.fromisoformat(result["expires_at"].replace("Z", "+00:00"))
            )
    except Exception as e:
        print(f"Error creating guest session: {e}")
    
    # Fallback if Supabase fails
    return GuestSession(
        session_id=session_id,
        expires_at=expires_at
    )

@router.get("/session/{session_id}", response_model=GuestSession)
async def get_guest_session(session_id: str):
    """Get guest session info."""
    # In production, fetch from Supabase
    expires_at = datetime.now() + timedelta(hours=2)
    return GuestSession(
        session_id=session_id,
        expires_at=expires_at
    )

@router.post("/cleanup/{session_id}")
async def cleanup_guest_session(session_id: str):
    """Cleanup guest session files when tab closes."""
    # Delete all files for this session
    session_path = Path(GUEST_UPLOAD_DIR) / "temp" / session_id
    if session_path.exists():
        try:
            shutil.rmtree(session_path)
            return {"message": f"Guest session {session_id} cleaned up"}
        except Exception as e:
            return {"message": f"Error cleaning up session: {str(e)}"}
    return {"message": "Session not found or already cleaned"}


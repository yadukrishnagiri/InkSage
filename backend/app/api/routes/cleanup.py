"""
Background cleanup tasks for guest sessions and expired data.
"""
from fastapi import APIRouter, BackgroundTasks
from datetime import datetime, timedelta
import os
import shutil
from pathlib import Path

router = APIRouter()

GUEST_UPLOAD_DIR = "./uploads/guest"

async def cleanup_expired_guest_sessions():
    """
    Cleanup expired guest sessions and their files.
    Should be run periodically (e.g., every hour via cron or scheduler).
    """
    # In production, query Supabase:
    # SELECT * FROM guest_sessions WHERE expires_at < NOW()
    
    # For now, cleanup files older than 2 hours
    guest_path = Path(GUEST_UPLOAD_DIR) / "temp"
    if not guest_path.exists():
        return
    
    cutoff_time = datetime.now() - timedelta(hours=2)
    
    for session_dir in guest_path.iterdir():
        if not session_dir.is_dir():
            continue
        
        # Check if session directory is older than 2 hours
        session_mtime = datetime.fromtimestamp(session_dir.stat().st_mtime)
        if session_mtime < cutoff_time:
            # Delete session directory and all contents
            try:
                shutil.rmtree(session_dir)
                print(f"Cleaned up expired guest session: {session_dir.name}")
            except Exception as e:
                print(f"Error cleaning up session {session_dir.name}: {e}")

@router.post("/cleanup/guest-sessions")
async def trigger_guest_cleanup(background_tasks: BackgroundTasks):
    """Manually trigger guest session cleanup."""
    background_tasks.add_task(cleanup_expired_guest_sessions)
    return {"message": "Guest session cleanup started"}


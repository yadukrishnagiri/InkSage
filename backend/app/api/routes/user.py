"""
User-related API endpoints.
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.services.supabase_service import SupabaseService
from app.services.auth_service import AuthService

router = APIRouter()

_supabase = SupabaseService.get_instance()
_auth = AuthService()

@router.get("/storage")
async def get_user_storage(
    authorization: Optional[str] = Header(None)
):
    """Get current user's storage usage."""
    user = _auth.get_user_from_header(authorization)
    
    if not user:
        # Guest users have no storage limit
        return {"storage_used": 0, "max_storage": 0, "is_guest": True}
    
    user_id = user.get("user_id")
    if not user_id:
        return {"storage_used": 0, "max_storage": 0, "is_guest": True}
    
    try:
        storage_used = _supabase.get_storage_used(user_id)
        max_storage = 500 * 1024 * 1024  # 500MB
        return {
            "storage_used": storage_used,
            "max_storage": max_storage,
            "is_guest": False
        }
    except Exception as e:
        print(f"Error getting storage: {e}")
        return {"storage_used": 0, "max_storage": 500 * 1024 * 1024, "is_guest": False}


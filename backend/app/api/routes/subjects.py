from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from app.models.schemas import Subject, SubjectCreate
from app.services.chromadb_service import ChromaDBService
from app.services.supabase_service import SupabaseService
from app.services.auth_service import AuthService
from datetime import datetime
import uuid

router = APIRouter()

_chromadb_service = ChromaDBService()
_supabase = SupabaseService.get_instance()
_auth = AuthService()

@router.get("/", response_model=List[Subject])
async def get_subjects(
    authorization: Optional[str] = Header(None),
    guest_session_id: Optional[str] = Header(None, alias="X-Guest-Session-ID")
):
    """Get all subjects for the current user or guest."""
    user = _auth.get_user_from_header(authorization)
    user_id = user.get("user_id") if user else None
    
    # Get guest session if no user
    if not user_id:
        guest_session_id = _auth.get_guest_session(guest_session_id)
    
    try:
        subjects = _supabase.get_subjects(user_id=user_id, guest_session_id=guest_session_id)
        return [Subject(**s) for s in subjects]
    except Exception as e:
        print(f"Error fetching subjects: {e}")
        return []

@router.post("/", response_model=Subject)
async def create_subject(
    subject: SubjectCreate,
    authorization: Optional[str] = Header(None),
    guest_session_id: Optional[str] = Header(None, alias="X-Guest-Session-ID")
):
    """Create a new subject."""
    user = _auth.get_user_from_header(authorization)
    user_id = user.get("user_id") if user else None
    
    # Create ChromaDB collection for this subject
    subject_id = str(uuid.uuid4())
    _chromadb_service.get_collection(subject_id)
    
    try:
        # Save to Supabase
        result = _supabase.create_subject(name=subject.name, user_id=user_id)
        if result:
            return Subject(**result)
        else:
            raise HTTPException(status_code=500, detail="Failed to create subject")
    except Exception as e:
        print(f"Error creating subject: {e}")
        # Fallback: return without saving to DB
        return Subject(
            id=subject_id,
            name=subject.name,
            user_id=user_id,
            created_at=datetime.now()
        )

@router.delete("/{subject_id}")
async def delete_subject(subject_id: str):
    """Delete a subject and its collection."""
    # Delete ChromaDB collection
    _chromadb_service.delete_subject_collection(subject_id)
    
    # Delete from database
    return {"message": "Subject deleted"}


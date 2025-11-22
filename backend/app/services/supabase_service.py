"""
Supabase client service for database and storage operations.
"""
from supabase import create_client, Client
import os
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from backend directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
# Also try loading from current directory (for compatibility)
load_dotenv()

class SupabaseService:
    """Service to interact with Supabase (Database, Storage, Auth)."""
    
    _instance: Optional['SupabaseService'] = None
    _client: Optional[Client] = None
    
    def __init__(self):
        """Initialize Supabase client."""
        if SupabaseService._client is None:
            # Reload env to ensure we have latest values
            load_dotenv(dotenv_path=env_path, override=True)
            load_dotenv(override=True)
            
            supabase_url = os.getenv("SUPABASE_URL")
            # Use anon key (service key format 'sb_secret_' not supported by Python client)
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_KEY must be set in environment variables"
                )
            
            try:
                SupabaseService._client = create_client(supabase_url, supabase_key)
            except Exception as e:
                raise ValueError(
                    f"Failed to create Supabase client: {str(e)}. "
                    f"URL: {supabase_url}, Key length: {len(supabase_key) if supabase_key else 0}"
                )
    
    @classmethod
    def get_client(cls) -> Client:
        """Get Supabase client instance (singleton)."""
        if cls._client is None:
            cls()
        return cls._client
    
    @classmethod
    def get_instance(cls) -> 'SupabaseService':
        """Get service instance (singleton)."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @classmethod
    def reset(cls):
        """Reset singleton instances (useful for testing or re-initialization)."""
        cls._instance = None
        cls._client = None
    
    # Database operations
    def get_user(self, user_id: str):
        """Get user by ID."""
        client = self.get_client()
        response = client.table("users").select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None
    
    def get_user_by_email(self, email: str):
        """Get user by email."""
        client = self.get_client()
        response = client.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    
    def create_user(self, user_id: str, email: str):
        """Create a new user record."""
        client = self.get_client()
        response = client.table("users").insert({
            "id": user_id,
            "email": email,
            "storage_used": 0
        }).execute()
        return response.data[0] if response.data else None
    
    def update_user_storage(self, user_id: str, storage_used: int):
        """Update user's storage usage."""
        client = self.get_client()
        response = client.table("users").update({
            "storage_used": storage_used
        }).eq("id", user_id).execute()
        return response.data[0] if response.data else None
    
    def get_subjects(self, user_id: Optional[str] = None, guest_session_id: Optional[str] = None):
        """Get subjects for a user or guest session."""
        client = self.get_client()
        query = client.table("subjects").select("*")
        
        if user_id:
            query = query.eq("user_id", user_id)
        elif guest_session_id:
            # For guests, get session ID from guest_sessions table
            session = self.get_guest_session_by_id(guest_session_id)
            if session:
                query = query.is_("user_id", "null")
        else:
            query = query.is_("user_id", "null")
        
        response = query.execute()
        return response.data
    
    def create_subject(self, name: str, user_id: Optional[str] = None):
        """Create a new subject."""
        client = self.get_client()
        data = {"name": name}
        if user_id:
            data["user_id"] = user_id
        
        response = client.table("subjects").insert(data).execute()
        return response.data[0] if response.data else None
    
    def delete_subject(self, subject_id: str):
        """Delete a subject."""
        client = self.get_client()
        response = client.table("subjects").delete().eq("id", subject_id).execute()
        return response.data
    
    def get_file_by_hash(self, file_hash: str, subject_id: str):
        """Get file by hash to check for duplicates."""
        client = self.get_client()
        response = client.table("files").select("*").eq("file_hash", file_hash).eq("subject_id", subject_id).execute()
        return response.data[0] if response.data else None
    
    def create_file(self, file_data: dict):
        """Create a file record."""
        client = self.get_client()
        response = client.table("files").insert(file_data).execute()
        return response.data[0] if response.data else None
    
    def update_file_status(self, file_id: str, status: str):
        """Update file processing status."""
        client = self.get_client()
        response = client.table("files").update({"status": status}).eq("id", file_id).execute()
        return response.data[0] if response.data else None
    
    def get_files_by_subject(self, subject_id: str):
        """Get all files for a subject."""
        client = self.get_client()
        response = client.table("files").select("*").eq("subject_id", subject_id).execute()
        return response.data
    
    def delete_file(self, file_id: str):
        """Delete a file record."""
        client = self.get_client()
        response = client.table("files").delete().eq("id", file_id).execute()
        return response.data
    
    def get_storage_used(self, user_id: str) -> int:
        """Get total storage used by a user."""
        client = self.get_client()
        response = client.table("users").select("storage_used").eq("id", user_id).execute()
        if response.data:
            return response.data[0].get("storage_used", 0)
        return 0
    
    # Guest session operations
    def create_guest_session(self, session_id: str, expires_at: str):
        """Create a guest session."""
        client = self.get_client()
        response = client.table("guest_sessions").insert({
            "session_id": session_id,
            "expires_at": expires_at
        }).execute()
        return response.data[0] if response.data else None
    
    def get_guest_session_by_id(self, session_id: str):
        """Get guest session by session_id."""
        client = self.get_client()
        response = client.table("guest_sessions").select("*").eq("session_id", session_id).execute()
        return response.data[0] if response.data else None
    
    def delete_guest_session(self, session_id: str):
        """Delete a guest session."""
        client = self.get_client()
        response = client.table("guest_sessions").delete().eq("session_id", session_id).execute()
        return response.data
    
    def cleanup_expired_guest_sessions(self):
        """Delete expired guest sessions."""
        from datetime import datetime
        client = self.get_client()
        now = datetime.utcnow().isoformat()
        response = client.table("guest_sessions").delete().lt("expires_at", now).execute()
        return response.data
    
    # Storage operations
    def upload_file_to_storage(self, bucket: str, path: str, file_content: bytes, content_type: str = "application/octet-stream"):
        """Upload file to Supabase Storage."""
        client = self.get_client()
        response = client.storage.from_(bucket).upload(path, file_content, file_options={"content-type": content_type})
        return response
    
    def delete_file_from_storage(self, bucket: str, path: str):
        """Delete file from Supabase Storage."""
        client = self.get_client()
        response = client.storage.from_(bucket).remove([path])
        return response
    
    def get_file_url(self, bucket: str, path: str):
        """Get public URL for a file."""
        client = self.get_client()
        response = client.storage.from_(bucket).get_public_url(path)
        return response


"""
Authentication service using Supabase Auth.
"""
from fastapi import HTTPException, Header
from typing import Optional
from supabase import Client
from app.services.supabase_service import SupabaseService

class AuthService:
    """Service to handle authentication."""
    
    def __init__(self):
        """Initialize auth service."""
        self.supabase = SupabaseService.get_instance()
        self.client = SupabaseService.get_client()
    
    def verify_token(self, token: str) -> Optional[dict]:
        """
        Verify JWT token and return user info.
        
        Args:
            token: JWT token from Authorization header
            
        Returns:
            Dict with user_id and email, or None if invalid
        """
        try:
            # Use Supabase client to verify token
            # The client automatically validates JWT tokens
            user = self.client.auth.get_user(token)
            if user and user.user:
                return {
                    "user_id": user.user.id,
                    "email": user.user.email
                }
        except Exception as e:
            print(f"Token verification error: {e}")
            return None
    
    def get_user_from_header(self, authorization: Optional[str] = Header(None)) -> Optional[dict]:
        """
        Extract and verify user from Authorization header.
        
        Args:
            authorization: Authorization header (format: "Bearer <token>")
            
        Returns:
            Dict with user_id and email, or None
        """
        if not authorization:
            return None
        
        try:
            # Extract token from "Bearer <token>"
            parts = authorization.split(" ")
            if len(parts) != 2 or parts[0].lower() != "bearer":
                return None
            
            token = parts[1]
            return self.verify_token(token)
        except Exception as e:
            print(f"Error extracting user from header: {e}")
            return None
    
    def require_auth(self, authorization: Optional[str] = Header(None)) -> dict:
        """
        Require authentication, raise 401 if not authenticated.
        
        Args:
            authorization: Authorization header
            
        Returns:
            Dict with user_id and email
            
        Raises:
            HTTPException: If not authenticated
        """
        user = self.get_user_from_header(authorization)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Authentication required"
            )
        return user
    
    def get_guest_session(self, guest_session_id: Optional[str] = Header(None, alias="X-Guest-Session-ID")) -> Optional[str]:
        """
        Get guest session ID from header.
        
        Args:
            guest_session_id: Guest session ID from header
            
        Returns:
            Session ID or None
        """
        if guest_session_id:
            # Verify session exists and is not expired
            session = self.supabase.get_guest_session_by_id(guest_session_id)
            if session:
                from datetime import datetime
                expires_at = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
                if datetime.now(expires_at.tzinfo) < expires_at:
                    return guest_session_id
        return None


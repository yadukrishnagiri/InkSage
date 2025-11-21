"""
Storage management service for tracking user storage usage.
"""
from typing import Optional, Dict

class StorageService:
    """Service to manage user storage limits and warnings."""
    
    MAX_STORAGE_PER_USER = 500 * 1024 * 1024  # 500MB
    STORAGE_WARNING_THRESHOLD = 450 * 1024 * 1024  # 450MB
    
    @staticmethod
    def check_storage_limit(
        current_storage: int,
        new_file_size: int,
        user_id: Optional[str] = None
    ) -> Dict:
        """
        Check if upload would exceed storage limits.
        
        Args:
            current_storage: Current storage used in bytes
            new_file_size: Size of new file in bytes
            user_id: User ID (None for guests)
            
        Returns:
            Dict with 'allowed', 'warning', 'message'
        """
        if user_id is None:
            # Guests have no storage limit
            return {
                "allowed": True,
                "warning": False,
                "message": None
            }
        
        total_after_upload = current_storage + new_file_size
        
        # Check hard limit
        if current_storage >= StorageService.MAX_STORAGE_PER_USER:
            return {
                "allowed": False,
                "warning": False,
                "message": f"Storage limit reached (500MB). Please delete some files."
            }
        
        if total_after_upload > StorageService.MAX_STORAGE_PER_USER:
            available = StorageService.MAX_STORAGE_PER_USER - current_storage
            return {
                "allowed": False,
                "warning": False,
                "message": f"Upload would exceed storage limit. Available: {available / (1024*1024):.1f}MB"
            }
        
        # Check warning threshold
        warning = current_storage >= StorageService.STORAGE_WARNING_THRESHOLD
        message = None
        
        if warning:
            message = f"Warning: You're using {current_storage / (1024*1024):.1f}MB of 500MB storage."
        
        return {
            "allowed": True,
            "warning": warning,
            "message": message
        }
    
    @staticmethod
    def format_storage_info(storage_bytes: int) -> str:
        """Format storage bytes to human-readable string."""
        mb = storage_bytes / (1024 * 1024)
        return f"{mb:.1f}MB"


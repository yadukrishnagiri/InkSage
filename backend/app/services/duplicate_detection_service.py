"""
Duplicate detection service for file and chunk-level deduplication.
"""
from typing import Dict, List, Optional, Tuple
import hashlib
from app.services.chromadb_service import ChromaDBService

class DuplicateDetectionService:
    """Service to detect duplicate files and chunks."""
    
    def __init__(self, chromadb_service: ChromaDBService):
        """
        Initialize duplicate detection service.
        
        Args:
            chromadb_service: ChromaDB service instance
        """
        self.chromadb_service = chromadb_service
        self.similarity_threshold = 0.7  # 70% similarity threshold
    
    def check_file_duplicate(
        self,
        file_hash: str,
        subject_id: str
    ) -> Optional[Dict]:
        """
        Check if a file with the same hash already exists.
        
        Args:
            file_hash: SHA-256 hash of the file
            subject_id: Subject ID to check within
            
        Returns:
            Dict with duplicate info if found, None otherwise
            Format: {
                "is_duplicate": True,
                "existing_file_id": "...",
                "existing_file_name": "...",
                "similarity": 1.0  # Exact match
            }
        """
        # In production, query Supabase:
        # SELECT id, name FROM files WHERE file_hash = file_hash AND subject_id = subject_id
        
        # For now, we'll check ChromaDB metadata for file references
        # This is a simplified check - in production, use database
        
        # TODO: Implement with Supabase query
        # For demo purposes, return None (no duplicate found)
        return None
    
    def check_chunk_duplicates(
        self,
        chunks: List[Dict],
        subject_id: str
    ) -> List[Dict]:
        """
        Check for duplicate chunks using hash and similarity.
        
        Args:
            chunks: List of chunk dictionaries with text and chunk_hash
            subject_id: Subject ID to check within
            
        Returns:
            List of duplicate chunk info:
            [{
                "chunk_index": 0,
                "existing_file_name": "...",
                "similarity": 0.85,
                "chunk_text_preview": "..."
            }]
        """
        duplicates = []
        
        try:
            collection = self.chromadb_service.get_collection(subject_id)
            
            for i, chunk in enumerate(chunks):
                chunk_hash = chunk.get("chunk_hash", "")
                if not chunk_hash:
                    continue
                
                # Get all chunks from this subject
                # In production, query by chunk_hash in metadata
                # For now, get all and check hashes
                all_chunks = collection.get(
                    where={"subject_id": subject_id}
                )
                
                if all_chunks and all_chunks.get("metadatas"):
                    for j, metadata in enumerate(all_chunks["metadatas"]):
                        existing_hash = metadata.get("chunk_hash", "")
                        if existing_hash == chunk_hash:
                            # Exact hash match
                            duplicates.append({
                                "chunk_index": i,
                                "existing_file_name": metadata.get("file_name", "Unknown"),
                                "similarity": 1.0,
                                "chunk_text_preview": chunk.get("text", "")[:100] + "..."
                            })
                            break
                        elif existing_hash:
                            # Could add cosine similarity check here for partial duplicates
                            # For now, only exact hash matches
                            pass
        
        except Exception as e:
            print(f"Error checking chunk duplicates: {e}")
        
        return duplicates
    
    def detect_duplicates(
        self,
        file_hash: str,
        chunks: List[Dict],
        subject_id: str
    ) -> Dict:
        """
        Comprehensive duplicate detection (file-level + chunk-level).
        
        Args:
            file_hash: SHA-256 hash of the file
            chunks: List of chunks from the file
            subject_id: Subject ID
            
        Returns:
            Dict with duplicate information:
            {
                "file_duplicate": {...} or None,
                "chunk_duplicates": [...],
                "has_duplicates": bool
            }
        """
        file_duplicate = self.check_file_duplicate(file_hash, subject_id)
        chunk_duplicates = self.check_chunk_duplicates(chunks, subject_id)
        
        return {
            "file_duplicate": file_duplicate,
            "chunk_duplicates": chunk_duplicates,
            "has_duplicates": file_duplicate is not None or len(chunk_duplicates) > 0
        }


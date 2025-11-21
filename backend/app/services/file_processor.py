import os
import hashlib
import uuid
from typing import Dict, Tuple
from app.utils.file_handlers import (
    extract_text_from_file,
    calculate_file_hash
)
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.chromadb_service import ChromaDBService

class FileProcessor:
    def __init__(
        self,
        chunking_service: ChunkingService,
        embedding_service: EmbeddingService,
        chromadb_service: ChromaDBService
    ):
        """
        Initialize file processor.
        
        Args:
            chunking_service: Chunking service instance
            embedding_service: Embedding service instance
            chromadb_service: ChromaDB service instance
        """
        self.chunking_service = chunking_service
        self.embedding_service = embedding_service
        self.chromadb_service = chromadb_service
    
    def process_file(
        self,
        file_path: str,
        file_id: str,
        subject_id: str,
        file_name: str,
        file_extension: str
    ) -> Dict:
        """
        Process a file: extract text, chunk, embed, and store in ChromaDB.
        
        Args:
            file_path: Path to the file
            file_id: File ID
            subject_id: Subject ID
            file_name: Original file name
            file_extension: File extension
            
        Returns:
            Dictionary with processing results
        """
        try:
            # Extract text
            text, metadata = extract_text_from_file(file_path, file_extension)
            
            if not text or len(text.strip()) == 0:
                raise ValueError("No text extracted from file")
            
            # Prepare chunk metadata
            chunk_metadata = {
                "file_id": file_id,
                "file_name": file_name,
                "file_type": file_extension.replace('.', '').upper(),
            }
            
            # Add page information if available
            if "pages" in metadata and metadata["pages"]:
                # For PDFs, we'll handle page numbers per chunk
                chunk_metadata["page_number"] = 0  # Will be set per chunk if needed
            
            # Chunk text
            chunks = self.chunking_service.chunk_text(text, chunk_metadata)
            
            # Add chunk hashes
            for chunk in chunks:
                chunk_text = chunk["text"]
                chunk_hash = hashlib.sha256(chunk_text.encode()).hexdigest()
                chunk["chunk_hash"] = chunk_hash
                
                # Try to extract page number from chunk text
                if "--- Page" in chunk_text:
                    try:
                        page_line = chunk_text.split("\n")[0]
                        page_num = int(page_line.split("Page")[1].split("---")[0].strip())
                        chunk["page_number"] = page_num
                    except:
                        chunk["page_number"] = 0
                else:
                    chunk["page_number"] = 0
            
            # Generate embeddings
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = self.embedding_service.generate_embeddings(chunk_texts)
            
            # Store in ChromaDB
            self.chromadb_service.add_chunks(
                subject_id=subject_id,
                chunks=chunks,
                embeddings=embeddings
            )
            
            return {
                "status": "processed",
                "chunks_count": len(chunks),
                "text_length": len(text)
            }
            
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e)
            }


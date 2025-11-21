import chromadb
from chromadb.config import Settings
import uuid
from typing import List, Dict, Optional
import os

class ChromaDBService:
    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize ChromaDB service.
        
        Args:
            persist_directory: Directory to persist ChromaDB data
        """
        os.makedirs(persist_directory, exist_ok=True)
        
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(anonymized_telemetry=False)
        )
        self.persist_directory = persist_directory
    
    def get_collection(self, subject_id: str):
        """Get or create a collection for a subject."""
        collection_name = f"subject_{subject_id}"
        try:
            return self.client.get_collection(name=collection_name)
        except:
            return self.client.create_collection(
                name=collection_name,
                metadata={"subject_id": subject_id}
            )
    
    def add_chunks(
        self,
        subject_id: str,
        chunks: List[Dict],
        embeddings: List
    ):
        """
        Add chunks to ChromaDB collection.
        
        Args:
            subject_id: Subject ID
            chunks: List of chunk dictionaries with text and metadata
            embeddings: List of embedding vectors
        """
        collection = self.get_collection(subject_id)
        
        ids = [str(uuid.uuid4()) for _ in chunks]
        texts = [chunk["text"] for chunk in chunks]
        metadatas = [
            {
                "file_id": chunk.get("file_id", ""),
                "file_name": chunk.get("file_name", ""),
                "page_number": chunk.get("page_number", 0),
                "char_start": chunk.get("char_start", 0),
                "char_end": chunk.get("char_end", 0),
                "chunk_hash": chunk.get("chunk_hash", ""),
                "subject_id": subject_id,
                "file_type": chunk.get("file_type", ""),
            }
            for chunk in chunks
        ]
        
        collection.add(
            ids=ids,
            embeddings=embeddings.tolist() if hasattr(embeddings, 'tolist') else embeddings,
            documents=texts,
            metadatas=metadatas
        )
    
    def query(
        self,
        subject_id: str,
        query_embedding: List[float],
        query_text: str,
        n_results: int = 10
    ) -> List[Dict]:
        """
        Query ChromaDB collection with hybrid search.
        
        Args:
            subject_id: Subject ID
            query_embedding: Query embedding vector
            query_text: Query text for keyword search
            n_results: Number of results to return
            
        Returns:
            List of result dictionaries with text, metadata, and distance
        """
        collection = self.get_collection(subject_id)
        
        # Semantic search
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        # Format results
        formatted_results = []
        if results['ids'] and len(results['ids'][0]) > 0:
            for i in range(len(results['ids'][0])):
                formatted_results.append({
                    "id": results['ids'][0][i],
                    "text": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i] if 'distances' in results else None
                })
        
        return formatted_results
    
    def delete_subject_collection(self, subject_id: str):
        """Delete a subject's collection."""
        try:
            collection_name = f"subject_{subject_id}"
            self.client.delete_collection(name=collection_name)
        except Exception as e:
            print(f"Error deleting collection: {e}")
    
    def delete_file_chunks(self, subject_id: str, file_id: str):
        """Delete all chunks for a specific file."""
        collection = self.get_collection(subject_id)
        
        # Get all chunks for this file
        results = collection.get(
            where={"file_id": file_id}
        )
        
        if results['ids']:
            collection.delete(ids=results['ids'])


from typing import List, Optional
import numpy as np

class EmbeddingService:
    _shared_model = None

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding service with lazy-loaded sentence-transformers.
        
        Args:
            model_name: Name of the sentence-transformers model (default: all-MiniLM-L6-v2)
        """
        self.model_name = model_name
        self.dimension = 384  # all-MiniLM-L6-v2 produces 384-dimensional vectors
    
    @property
    def model(self):
        """Lazy load and share a single model instance to conserve RAM."""
        if EmbeddingService._shared_model is None:
            from sentence_transformers import SentenceTransformer
            EmbeddingService._shared_model = SentenceTransformer(self.model_name)
        return EmbeddingService._shared_model

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            numpy array of shape (len(texts), dimension) containing embeddings
        """
        if not texts:
            return np.array([])
        
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return embeddings
    
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text string to embed
            
        Returns:
            numpy array of shape (dimension,) containing the embedding
        """
        embedding = self.model.encode([text], show_progress_bar=False)[0]
        return embedding

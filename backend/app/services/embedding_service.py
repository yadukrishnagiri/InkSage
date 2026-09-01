import os
import gc
from typing import List, Optional
import numpy as np

# Constrain PyTorch thread count to prevent CPU/memory spikes on low-tier cloud instances
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

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
            try:
                import torch
                torch.set_num_threads(1)
            except Exception:
                pass
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(self.model_name)
            try:
                model.eval()
            except Exception:
                pass
            EmbeddingService._shared_model = model
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
        
        try:
            import torch
            with torch.no_grad():
                embeddings = self.model.encode(
                    texts,
                    batch_size=16,
                    show_progress_bar=False,
                    normalize_embeddings=True
                )
        except Exception:
            embeddings = self.model.encode(
                texts,
                batch_size=16,
                show_progress_bar=False
            )
        finally:
            gc.collect()
            
        return embeddings
    
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text string to embed
            
        Returns:
            numpy array of shape (dimension,) containing the embedding
        """
        embeddings = self.generate_embeddings([text])
        return embeddings[0] if len(embeddings) > 0 else np.zeros(self.dimension)


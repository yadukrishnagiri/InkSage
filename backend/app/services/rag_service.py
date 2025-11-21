from typing import List, Dict
from rank_bm25 import BM25Okapi
import numpy as np
from app.services.embedding_service import EmbeddingService
from app.services.chromadb_service import ChromaDBService
from app.services.groq_service import GroqService

class RAGService:
    def __init__(
        self,
        embedding_service: EmbeddingService,
        chromadb_service: ChromaDBService,
        groq_service: GroqService
    ):
        """
        Initialize RAG service with hybrid search.
        
        Args:
            embedding_service: Embedding service instance
            chromadb_service: ChromaDB service instance
            groq_service: Groq service instance
        """
        self.embedding_service = embedding_service
        self.chromadb_service = chromadb_service
        self.groq_service = groq_service
        self.similarity_threshold = 0.3  # Lowered from 0.7 to allow more results
        self.semantic_weight = 0.7
        self.bm25_weight = 0.3
    
    def hybrid_search(
        self,
        subject_id: str,
        query: str,
        top_k: int = 10
    ) -> List[Dict]:
        """
        Perform hybrid search (semantic + BM25).
        
        Args:
            subject_id: Subject ID
            query: User query
            top_k: Number of results to return
            
        Returns:
            List of relevant chunks with combined scores
        """
        # Generate query embedding
        query_embedding = self.embedding_service.generate_embedding(query)
        
        # Semantic search via ChromaDB
        semantic_results = self.chromadb_service.query(
            subject_id=subject_id,
            query_embedding=query_embedding.tolist(),
            query_text=query,
            n_results=min(top_k * 2, 20)  # Get more for BM25 filtering, but cap at 20
        )
        
        if not semantic_results:
            print(f"No semantic results found for subject {subject_id}")
            return []
        
        print(f"Found {len(semantic_results)} semantic results")
        
        # Prepare texts for BM25
        texts = [result["text"] for result in semantic_results]
        tokenized_texts = [text.lower().split() for text in texts]
        
        # BM25 search
        try:
            bm25 = BM25Okapi(tokenized_texts)
            query_tokens = query.lower().split()
            bm25_scores = bm25.get_scores(query_tokens)
            
            # Normalize BM25 scores (0-1 range)
            if max(bm25_scores) > 0:
                bm25_scores = bm25_scores / max(bm25_scores)
        except:
            # Fallback if BM25 fails
            bm25_scores = np.zeros(len(texts))
        
        # Combine scores
        combined_results = []
        for i, result in enumerate(semantic_results):
            # Normalize semantic distance to similarity score (0-1)
            distance = result.get("distance", 1.0)
            semantic_score = 1.0 - min(distance, 1.0)  # Convert distance to similarity
            
            # Combine scores
            combined_score = (
                self.semantic_weight * semantic_score +
                self.bm25_weight * bm25_scores[i]
            )
            
            # Always include results, but sort by score (lower threshold)
            result["combined_score"] = combined_score
            result["semantic_score"] = semantic_score
            result["bm25_score"] = float(bm25_scores[i])
            combined_results.append(result)
        
        # Sort by combined score and return top_k
        combined_results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        # Filter by threshold but if no results, return top results anyway
        filtered = [r for r in combined_results[:top_k] if r["combined_score"] >= self.similarity_threshold]
        if not filtered and combined_results:
            # If no results pass threshold, return top 3 anyway
            print(f"Warning: No results above threshold {self.similarity_threshold}, returning top 3 results")
            return combined_results[:3]
        
        return filtered[:top_k] if filtered else combined_results[:top_k]
    
    def query(
        self,
        subject_id: str,
        query: str,
        chat_history: List[Dict] = None
    ) -> Dict:
        """
        Perform RAG query: retrieve relevant chunks and generate response.
        
        Args:
            subject_id: Subject ID
            query: User query
            chat_history: Previous chat messages
            
        Returns:
            Dictionary with response text and citations
        """
        # Hybrid search
        relevant_chunks = self.hybrid_search(subject_id, query, top_k=10)
        
        print(f"RAG Query - Subject: {subject_id}, Query: {query}, Found chunks: {len(relevant_chunks)}")
        
        if not relevant_chunks:
            # Check if collection exists and has any data
            try:
                collection = self.chromadb_service.get_collection(subject_id)
                count = collection.count()
                print(f"Collection has {count} chunks total")
                if count == 0:
                    return {
                        "text": "I don't see any files uploaded yet. Please upload your notes first.",
                        "citations": []
                    }
            except Exception as e:
                print(f"Error checking collection: {e}")
            
            return {
                "text": "I couldn't find relevant information in your uploaded notes for this query. Try rephrasing your question or uploading more related files.",
                "citations": []
            }
        
        # Generate response with Groq
        response_text = self.groq_service.generate_response(
            query=query,
            context_chunks=relevant_chunks,
            chat_history=chat_history
        )
        
        # Extract citations from chunks
        citations = []
        seen_files = set()
        for chunk in relevant_chunks:
            file_name = chunk.get("metadata", {}).get("file_name", "")
            if file_name and file_name not in seen_files:
                citations.append(file_name)
                seen_files.add(file_name)
        
        return {
            "text": response_text,
            "citations": citations
        }


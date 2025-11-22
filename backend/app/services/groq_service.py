from groq import Groq
import os
from typing import List, Dict, Iterator
import json

class GroqService:
    def __init__(self, api_key: str = None):
        """
        Initialize Groq service.
        
        Args:
            api_key: Groq API key (defaults to GROQ_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not provided")
        
        self.client = Groq(api_key=self.api_key)
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    def generate_response(
        self,
        query: str,
        context_chunks: List[Dict],
        chat_history: List[Dict] = None
    ) -> str:
        """
        Generate response using Groq API with RAG context.
        
        Args:
            query: User query
            context_chunks: List of relevant chunks with metadata
            chat_history: Previous chat messages
            
        Returns:
            Generated response text
        """
        # Build context from chunks
        context_parts = []
        for chunk in context_chunks:
            file_name = chunk.get("metadata", {}).get("file_name", "Unknown")
            page_number = chunk.get("metadata", {}).get("page_number", 0)
            text = chunk.get("text", "")
            
            if page_number > 0:
                context_parts.append(f"[File: {file_name}, Page: {page_number}]\n{text}")
            else:
                context_parts.append(f"[File: {file_name}]\n{text}")
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Build system prompt
        system_prompt = """You are InkSage, a private AI study assistant. 
Answer ONLY from the provided context (user's uploaded notes).
If the answer is not in the context, state: "I couldn't find that information in your uploaded notes."
Cite exact page numbers and file names in format [File: filename.pdf, Page: X].
Be academic, encouraging, and precise."""
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add context
        messages.append({
            "role": "user",
            "content": f"Context from user's notes:\n\n{context}\n\nUser Query: {query}"
        })
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=1024  # Reduced from 2048 for faster generation
            )
            
            return response.choices[0].message.content
        except Exception as e:
            error_str = str(e)
            # Provide more helpful error messages
            if "401" in error_str or "Invalid API Key" in error_str or "invalid_api_key" in error_str:
                raise Exception("Groq API key is invalid or missing. Please check your GROQ_API_KEY in the .env file.")
            elif "429" in error_str or "rate limit" in error_str.lower():
                raise Exception("Groq API rate limit exceeded. Please try again in a moment.")
            else:
                raise Exception(f"Groq API error: {error_str}")
    
    def generate_response_stream(
        self,
        query: str,
        context_chunks: List[Dict],
        chat_history: List[Dict] = None
    ) -> Iterator[str]:
        """
        Generate streaming response using Groq API with RAG context.
        
        Args:
            query: User query
            context_chunks: List of relevant chunks with metadata
            chat_history: Previous chat messages
            
        Yields:
            Text chunks as they're generated
        """
        # Build context from chunks (limit to prevent oversized prompts)
        context_parts = []
        max_context_length = 3000  # Limit total context length
        current_length = 0
        
        for chunk in context_chunks:
            file_name = chunk.get("metadata", {}).get("file_name", "Unknown")
            page_number = chunk.get("metadata", {}).get("page_number", 0)
            text = chunk.get("text", "")
            
            # Limit chunk text length
            if len(text) > 500:
                text = text[:500] + "..."
            
            chunk_text = f"[File: {file_name}, Page: {page_number}]\n{text}" if page_number > 0 else f"[File: {file_name}]\n{text}"
            
            if current_length + len(chunk_text) > max_context_length:
                break
            
            context_parts.append(chunk_text)
            current_length += len(chunk_text)
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Build system prompt
        system_prompt = """You are InkSage, a private AI study assistant. 
Answer ONLY from the provided context (user's uploaded notes).
If the answer is not in the context, state: "I couldn't find that information in your uploaded notes."
Cite exact page numbers and file names in format [File: filename.pdf, Page: X].
Be academic, encouraging, and precise."""
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add context
        messages.append({
            "role": "user",
            "content": f"Context from user's notes:\n\n{context}\n\nUser Query: {query}"
        })
        
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=1024,  # Reduced from 2048 for faster generation
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            error_str = str(e)
            # Provide more helpful error messages
            if "401" in error_str or "Invalid API Key" in error_str or "invalid_api_key" in error_str:
                yield json.dumps({"error": "Groq API key is invalid or missing. Please check your GROQ_API_KEY in the .env file."})
            elif "429" in error_str or "rate limit" in error_str.lower():
                yield json.dumps({"error": "Groq API rate limit exceeded. Please try again in a moment."})
            else:
                yield json.dumps({"error": f"Groq API error: {error_str}"})


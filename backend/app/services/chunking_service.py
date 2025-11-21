from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List, Dict

class ChunkingService:
    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50):
        """
        Initialize chunking service with langchain RecursiveCharacterTextSplitter.
        
        Args:
            chunk_size: Target size of chunks in tokens (default: 512)
            chunk_overlap: Overlap between chunks in tokens (default: 50)
        """
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def chunk_text(
        self,
        text: str,
        metadata: Dict = None
    ) -> List[Dict]:
        """
        Split text into chunks with metadata.
        
        Args:
            text: Text to chunk
            metadata: Additional metadata to attach to each chunk
            
        Returns:
            List of chunk dictionaries with text and metadata
        """
        chunks = self.text_splitter.split_text(text)
        
        chunk_list = []
        char_start = 0
        
        for i, chunk_text in enumerate(chunks):
            char_end = char_start + len(chunk_text)
            
            chunk_data = {
                "text": chunk_text,
                "chunk_index": i,
                "char_start": char_start,
                "char_end": char_end,
            }
            
            # Add provided metadata
            if metadata:
                chunk_data.update(metadata)
            
            chunk_list.append(chunk_data)
            char_start = char_end - self.text_splitter._chunk_overlap
        
        return chunk_list


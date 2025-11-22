from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SubjectCreate(BaseModel):
    name: str

class Subject(BaseModel):
    id: str
    name: str
    user_id: Optional[str] = None
    created_at: datetime

class FileUpload(BaseModel):
    subject_id: str

class FileDuplicateInfo(BaseModel):
    is_duplicate: bool
    existing_file_id: Optional[str] = None
    existing_file_name: Optional[str] = None
    similarity: float = 1.0

class ChunkDuplicateInfo(BaseModel):
    chunk_index: int
    existing_file_name: str
    similarity: float
    chunk_text_preview: str

class DuplicateDetectionResult(BaseModel):
    file_duplicate: Optional[FileDuplicateInfo] = None
    chunk_duplicates: List[ChunkDuplicateInfo] = []
    has_duplicates: bool = False

class FileResponse(BaseModel):
    file_id: str
    status: str
    message: str
    duplicate_info: Optional[DuplicateDetectionResult] = None

class MultiFileResponse(BaseModel):
    files: List[FileResponse]
    total: int
    successful: int
    failed: int

class FileStatus(BaseModel):
    status: str
    progress: Optional[float] = None

class ChatQuery(BaseModel):
    query: str
    subject_id: str
    chat_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    text: str
    citations: List[str]

class GuestSessionCreate(BaseModel):
    pass

class GuestSession(BaseModel):
    session_id: str
    expires_at: datetime

class Message(BaseModel):
    role: str
    text: str
    timestamp: Optional[int] = None

class PDFExportRequest(BaseModel):
    subject_id: str
    messages: List[Message]


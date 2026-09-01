from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Header, Form
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import uuid
import hashlib
from app.models.schemas import FileUpload, FileResponse, FileStatus, MultiFileResponse
from app.services.file_processor import FileProcessor
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.chromadb_service import ChromaDBService
from app.utils.file_handlers import calculate_file_hash
from app.services.storage_service import StorageService
from app.services.duplicate_detection_service import DuplicateDetectionService

router = APIRouter()

# Initialize services (in production, use dependency injection)
_chunking_service = ChunkingService()
_embedding_service = EmbeddingService()
_chromadb_service = ChromaDBService()
_file_processor = FileProcessor(
    _chunking_service,
    _embedding_service,
    _chromadb_service
)
_duplicate_detection = DuplicateDetectionService(_chromadb_service)

UPLOAD_DIR = "./uploads"
GUEST_UPLOAD_DIR = "./uploads/guest"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(GUEST_UPLOAD_DIR, exist_ok=True)

def process_file_background(
    file_path: str,
    file_id: str,
    subject_id: str,
    file_name: str,
    file_extension: str,
    storage_path: str,
    file_size: int,
    file_hash: str
):
    """Background task to process file in a separate worker thread."""
    from app.services.supabase_service import SupabaseService
    import gc
    supabase = SupabaseService.get_instance()
    
    # Update status to processing
    try:
        supabase.update_file_status(file_id, "processing")
    except Exception as e:
        print(f"Error updating file status: {e}")
    
    try:
        result = _file_processor.process_file(
            file_path=file_path,
            file_id=file_id,
            subject_id=subject_id,
            file_name=file_name,
            file_extension=file_extension
        )
        status = "processed" if result.get("status") == "processed" else "failed"
        supabase.update_file_status(file_id, status)
        print(f"File {file_id} processed successfully: {status}")
    except Exception as e:
        print(f"Error processing file {file_id}: {e}")
        try:
            supabase.update_file_status(file_id, "failed")
        except Exception:
            pass
    finally:
        gc.collect()

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    user_id: Optional[str] = Header(None, alias="X-User-ID"),
    guest_session_id: Optional[str] = Header(None, alias="X-Guest-Session-ID")
):
    """Upload and process a file."""
    if not subject_id:
        raise HTTPException(status_code=400, detail="subject_id is required")
    
    # Validate file size (50MB limit per file)
    max_file_size = 50 * 1024 * 1024
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > max_file_size:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
    
    # Check storage cap for logged users (500MB total)
    storage_check = None
    if user_id and not guest_session_id:
        # Fetch from Supabase
        from app.services.supabase_service import SupabaseService
        supabase = SupabaseService.get_instance()
        current_storage = supabase.get_storage_used(user_id)
        
        storage_check = StorageService.check_storage_limit(
            current_storage=current_storage,
            new_file_size=file_size,
            user_id=user_id
        )
        
        if not storage_check["allowed"]:
            raise HTTPException(
                status_code=400,
                detail=storage_check["message"]
            )
    
    # Validate file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = ['.pdf', '.docx', '.pptx', '.xlsx', '.xls', '.csv', '.txt', '.md']
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Generate file ID
    file_id = str(uuid.uuid4())
    
    # Determine storage path based on user type
    if guest_session_id:
        # Guest: store under guest/temp/<session_id>/<subject_id>/
        guest_path = os.path.join(GUEST_UPLOAD_DIR, "temp", guest_session_id, subject_id)
        os.makedirs(guest_path, exist_ok=True)
        file_path = os.path.join(guest_path, f"{file_id}{file_extension}")
        storage_path = f"guest/temp/{guest_session_id}/{subject_id}/{file_id}{file_extension}"
    else:
        # Logged user: store under user/<user_id>/<subject_id>/
        user_path = os.path.join(UPLOAD_DIR, "user", user_id or "anonymous", subject_id)
        os.makedirs(user_path, exist_ok=True)
        file_path = os.path.join(user_path, f"{file_id}{file_extension}")
        storage_path = f"user/{user_id or 'anonymous'}/{subject_id}/{file_id}{file_extension}"
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Calculate file hash
    file_hash = calculate_file_hash(file_path)
    
    # Check for duplicates BEFORE processing
    duplicate_info = None
    try:
        # Check in Supabase for file-level duplicates
        from app.services.supabase_service import SupabaseService
        supabase = SupabaseService.get_instance()
        existing_file = supabase.get_file_by_hash(file_hash, subject_id)
        
        if existing_file:
            from app.models.schemas import DuplicateDetectionResult, FileDuplicateInfo
            duplicate_info = DuplicateDetectionResult(
                file_duplicate=FileDuplicateInfo(
                    is_duplicate=True,
                    existing_file_id=existing_file["id"],
                    existing_file_name=existing_file["name"],
                    similarity=1.0
                ),
                chunk_duplicates=[],
                has_duplicates=True
            )
        else:
            # Also check with duplicate detection service for chunk-level
            file_duplicate = _duplicate_detection.check_file_duplicate(file_hash, subject_id)
        
            # For chunk-level check, we'd need to process the file first
            # But we can return file-level duplicate immediately
            if file_duplicate:
                if not duplicate_info:
                    from app.models.schemas import DuplicateDetectionResult, FileDuplicateInfo
                    duplicate_info = DuplicateDetectionResult(
                        file_duplicate=FileDuplicateInfo(**file_duplicate),
                        chunk_duplicates=[],
                        has_duplicates=True
                    )
    except Exception as e:
        print(f"Error checking duplicates: {e}")
        # Continue with upload even if duplicate check fails
    
    # If exact file duplicate found, we still process but include duplicate info
    # Frontend will show popup and user can choose to proceed or cancel
    
    # Save file record to database
    from app.services.supabase_service import SupabaseService
    supabase = SupabaseService.get_instance()
    try:
        supabase.create_file({
            "id": file_id,
            "subject_id": subject_id,
            "name": file.filename,
            "storage_path": storage_path,
            "storage_size": file_size,
            "file_hash": file_hash,
            "status": "pending"
        })
    except Exception as e:
        print(f"Error creating file record: {e}")

    # Upload file binary to Supabase Storage bucket
    try:
        if supabase.enabled:
            supabase.upload_file_to_storage(
                bucket="notes",
                path=storage_path,
                file_content=file_content,
                content_type=file.content_type or "application/octet-stream"
            )
    except Exception as e:
        print(f"Warning: Supabase storage upload skipped/failed: {e}")
    
    # Process file in background
    background_tasks.add_task(
        process_file_background,
        file_path=file_path,
        file_id=file_id,
        subject_id=subject_id,
        file_name=file.filename,
        file_extension=file_extension,
        storage_path=storage_path,
        file_size=file_size,
        file_hash=file_hash
    )
    
    # Prepare response message
    message = "File uploaded and processing started"
    if storage_check and storage_check.get("warning"):
        message += f" | {storage_check['message']}"
    
    return FileResponse(
        file_id=file_id,
        status="processing",
        message=message,
        duplicate_info=duplicate_info
    )

@router.post("/upload-multiple", response_model=MultiFileResponse)
async def upload_multiple_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    subject_id: str = Form(...),
    authorization: Optional[str] = Header(None),
    guest_session_id: Optional[str] = Header(None, alias="X-Guest-Session-ID")
):
    """Upload and process multiple files at once."""
    if not subject_id:
        raise HTTPException(status_code=400, detail="subject_id is required")
    
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="At least one file is required")
    
    # Get user info
    from app.services.auth_service import AuthService
    auth = AuthService()
    user = auth.get_user_from_header(authorization)
    user_id = user.get("user_id") if user else None
    
    # Ensure subject exists before uploading files
    from app.services.supabase_service import SupabaseService
    supabase = SupabaseService.get_instance()
    try:
        # Verify subject exists
        subjects = supabase.get_subjects(user_id=user_id, guest_session_id=guest_session_id)
        subject_exists = any(s.get("id") == subject_id for s in subjects)
        if not subject_exists:
            raise HTTPException(status_code=404, detail="Subject not found")
    except Exception as e:
        print(f"Error verifying subject: {e}")
        # Continue anyway - might be a guest session
    
    file_responses: List[FileResponse] = []
    successful = 0
    failed = 0
    
    # Process each file
    for file in files:
        try:
            # Validate file size (50MB limit per file)
            max_file_size = 50 * 1024 * 1024
            file_content = await file.read()
            file_size = len(file_content)
            
            if file_size > max_file_size:
                file_responses.append(FileResponse(
                    file_id="",
                    status="failed",
                    message=f"File {file.filename} exceeds 50MB limit",
                    duplicate_info=None
                ))
                failed += 1
                continue
            
            # Check storage cap for logged users (500MB total)
            storage_check = None
            if user_id and not guest_session_id:
                current_storage = supabase.get_storage_used(user_id)
                storage_check = StorageService.check_storage_limit(
                    current_storage=current_storage,
                    new_file_size=file_size,
                    user_id=user_id
                )
                
                if not storage_check["allowed"]:
                    file_responses.append(FileResponse(
                        file_id="",
                        status="failed",
                        message=storage_check["message"],
                        duplicate_info=None
                    ))
                    failed += 1
                    continue
            
            # Validate file extension
            file_extension = os.path.splitext(file.filename)[1].lower()
            allowed_extensions = ['.pdf', '.docx', '.pptx', '.xlsx', '.xls', '.csv', '.txt', '.md']
            if file_extension not in allowed_extensions:
                file_responses.append(FileResponse(
                    file_id="",
                    status="failed",
                    message=f"File type {file_extension} not supported",
                    duplicate_info=None
                ))
                failed += 1
                continue
            
            # Generate file ID
            file_id = str(uuid.uuid4())
            
            # Determine storage path based on user type
            if guest_session_id:
                guest_path = os.path.join(GUEST_UPLOAD_DIR, "temp", guest_session_id, subject_id)
                os.makedirs(guest_path, exist_ok=True)
                file_path = os.path.join(guest_path, f"{file_id}{file_extension}")
                storage_path = f"guest/temp/{guest_session_id}/{subject_id}/{file_id}{file_extension}"
            else:
                user_path = os.path.join(UPLOAD_DIR, "user", user_id or "anonymous", subject_id)
                os.makedirs(user_path, exist_ok=True)
                file_path = os.path.join(user_path, f"{file_id}{file_extension}")
                storage_path = f"user/{user_id or 'anonymous'}/{subject_id}/{file_id}{file_extension}"
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # Calculate file hash
            file_hash = calculate_file_hash(file_path)
            
            # Check for duplicates
            duplicate_info = None
            try:
                existing_file = supabase.get_file_by_hash(file_hash, subject_id)
                if existing_file:
                    from app.models.schemas import DuplicateDetectionResult, FileDuplicateInfo
                    duplicate_info = DuplicateDetectionResult(
                        file_duplicate=FileDuplicateInfo(
                            is_duplicate=True,
                            existing_file_id=existing_file["id"],
                            existing_file_name=existing_file["name"],
                            similarity=1.0
                        ),
                        chunk_duplicates=[],
                        has_duplicates=True
                    )
            except Exception as e:
                print(f"Error checking duplicates: {e}")
            
            # Save file record to database
            try:
                supabase.create_file({
                    "id": file_id,
                    "subject_id": subject_id,
                    "name": file.filename,
                    "storage_path": storage_path,
                    "storage_size": file_size,
                    "file_hash": file_hash,
                    "status": "pending"
                })
            except Exception as e:
                print(f"Error creating file record: {e}")
                file_responses.append(FileResponse(
                    file_id=file_id,
                    status="failed",
                    message=f"Failed to save file record: {str(e)}",
                    duplicate_info=None
                ))
                failed += 1
                continue

            # Upload file binary to Supabase Storage bucket
            try:
                if supabase.enabled:
                    supabase.upload_file_to_storage(
                        bucket="notes",
                        path=storage_path,
                        file_content=file_content,
                        content_type=file.content_type or "application/octet-stream"
                    )
            except Exception as e:
                print(f"Warning: Supabase storage upload skipped/failed: {e}")
            
            # Process file in background
            background_tasks.add_task(
                process_file_background,
                file_path=file_path,
                file_id=file_id,
                subject_id=subject_id,
                file_name=file.filename,
                file_extension=file_extension,
                storage_path=storage_path,
                file_size=file_size,
                file_hash=file_hash
            )
            
            # Prepare response message
            message = f"File {file.filename} uploaded and processing started"
            if storage_check and storage_check.get("warning"):
                message += f" | {storage_check['message']}"
            
            file_responses.append(FileResponse(
                file_id=file_id,
                status="processing",
                message=message,
                duplicate_info=duplicate_info
            ))
            successful += 1
            
        except Exception as e:
            print(f"Error processing file {file.filename}: {e}")
            file_responses.append(FileResponse(
                file_id="",
                status="failed",
                message=f"Error: {str(e)}",
                duplicate_info=None
            ))
            failed += 1
    
    return MultiFileResponse(
        files=file_responses,
        total=len(files),
        successful=successful,
        failed=failed
    )

@router.get("/{file_id}/status", response_model=FileStatus)
async def get_file_status(file_id: str):
    """Get file processing status."""
    # In production, check status from database
    # For now, return a default status
    return FileStatus(status="processing")

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """Delete a file and its chunks."""
    # Delete from ChromaDB
    # Delete from storage
    # Delete from database
    return {"message": "File deleted"}


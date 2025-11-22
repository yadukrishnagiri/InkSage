from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatQuery, ChatResponse, PDFExportRequest
from app.services.rag_service import RAGService
from app.services.embedding_service import EmbeddingService
from app.services.chromadb_service import ChromaDBService
from app.services.groq_service import GroqService
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
import json
import asyncio

router = APIRouter()

# Initialize services
_embedding_service = EmbeddingService()
_chromadb_service = ChromaDBService()
_groq_service = GroqService()
_rag_service = RAGService(
    _embedding_service,
    _chromadb_service,
    _groq_service
)

@router.post("/query", response_model=ChatResponse)
async def query_chat(query: ChatQuery):
    """Send a query to the RAG system."""
    try:
        print(f"Chat query received - Subject: {query.subject_id}, Query: {query.query[:100]}")
        result = _rag_service.query(
            subject_id=query.subject_id,
            query=query.query,
            chat_history=query.chat_history
        )
        print(f"Chat response generated - Text length: {len(result.get('text', ''))}, Citations: {len(result.get('citations', []))}")
        return ChatResponse(
            text=result["text"],
            citations=result["citations"]
        )
    except Exception as e:
        error_message = str(e)
        print(f"Error in chat query: {error_message}")
        import traceback
        traceback.print_exc()
        
        # Provide user-friendly error messages
        if "API key" in error_message.lower() or "GROQ_API_KEY" in error_message:
            return ChatResponse(
                text="⚠️ Configuration Error: Groq API key is missing or invalid. Please check your backend .env file and ensure GROQ_API_KEY is set correctly.",
                citations=[]
            )
        elif "rate limit" in error_message.lower():
            return ChatResponse(
                text="⚠️ Rate limit exceeded. Please wait a moment and try again.",
                citations=[]
            )
        else:
            return ChatResponse(
                text=f"I encountered an error: {error_message}. Please check the backend logs for more details.",
                citations=[]
            )

@router.post("/query-stream")
async def query_chat_stream(query: ChatQuery):
    """Send a query to the RAG system with streaming response."""
    async def generate():
        try:
            print(f"Chat query stream received - Subject: {query.subject_id}, Query: {query.query[:100]}")
            
            for chunk in _rag_service.query_stream(
                subject_id=query.subject_id,
                query=query.query,
                chat_history=query.chat_history
            ):
                yield f"data: {chunk}\n\n"
            
            # Send completion signal
            yield "data: " + json.dumps({"type": "done"}) + "\n\n"
            
        except Exception as e:
            error_message = str(e)
            print(f"Error in chat query stream: {error_message}")
            import traceback
            traceback.print_exc()
            
            error_response = {
                "type": "error",
                "text": f"I encountered an error: {error_message}. Please check the backend logs for more details.",
                "citations": []
            }
            
            # Provide user-friendly error messages
            if "API key" in error_message.lower() or "GROQ_API_KEY" in error_message:
                error_response["text"] = "⚠️ Configuration Error: Groq API key is missing or invalid. Please check your backend .env file and ensure GROQ_API_KEY is set correctly."
            elif "rate limit" in error_message.lower():
                error_response["text"] = "⚠️ Rate limit exceeded. Please wait a moment and try again."
            
            yield f"data: {json.dumps(error_response)}\n\n"
            yield "data: " + json.dumps({"type": "done"}) + "\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/export-pdf")
async def export_chat_to_pdf(request: PDFExportRequest):
    """Export chat conversation to PDF."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    story.append(Paragraph("InkSage Chat Export", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Messages
    for msg in request.messages:
        role = "User" if msg.role == "user" else "InkSage"
        story.append(Paragraph(f"<b>{role}:</b>", styles['Heading3']))
        story.append(Paragraph(msg.text, styles['Normal']))
        story.append(Spacer(1, 12))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=chat_export.pdf"}
    )


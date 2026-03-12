## InkSage — Project Explanation (Architecture, Pipelines, and Why These Tools)

InkSage is a **private AI study workspace**: you upload your notes (PDF/DOCX/PPTX/XLSX/CSV/TXT/MD), organize them by **Subject**, and chat with an AI that answers **only from your own content** (with citations).

This document explains the full pipeline end-to-end (frontend → backend → retrieval → generation), the project structure, and *why* each tool/library was chosen.

---

## What problem InkSage solves

- **Problem**: Students have notes scattered across files. Traditional chatbots answer from the internet and can hallucinate.
- **Goal**: Build an assistant that answers from *your uploaded notes only*, with **proof/citations**, fast UI feedback, and a clean UX (subjects, uploads, history).

---

## High-level architecture

### Components

- **Frontend (React + Vite + TypeScript)**: UI, authentication via Supabase, uploads, chat streaming, persistence.
- **Backend (FastAPI)**: REST endpoints for subjects/files/chat, ingestion pipeline, retrieval pipeline, and streaming (SSE).
- **Supabase**:
  - **Auth**: Email/password + Google OAuth (client-side session)
  - **Postgres DB**: Subjects, files metadata, user storage usage, guest sessions
  - **Storage**: Optional file storage APIs (project has helpers for this)
- **ChromaDB (local persistent)**: Vector store for embeddings (per-subject collections).
- **Embeddings (sentence-transformers)**: Convert chunks → vectors for semantic retrieval.
- **LLM (Groq)**: Generates the final answer using retrieved context.

### Data flow (diagram)

```mermaid
flowchart LR
  U[User] --> FE[Frontend: React + Vite]
  FE -->|Supabase session| SA[Supabase Auth]
  FE -->|REST + headers| BE[Backend: FastAPI]
  BE -->|metadata| DB[Supabase Postgres]
  BE -->|upload bytes| FS[Local uploads/]
  BE -->|chunk + embed| EMB[Sentence-Transformers]
  EMB -->|vectors| CH[ChromaDB (per Subject)]
  BE -->|retrieve chunks| CH
  BE -->|context + prompt| LLM[Groq LLM]
  LLM -->|text / stream| BE
  BE -->|SSE or JSON| FE
  FE -->|persist| LS[localStorage chat history]
```

---

## Project structure (how it’s organized)

This repo is intentionally split into **frontend/** and **backend/**, and the backend is further split into **routes** vs **services**.

```text
InkSage/
├─ frontend/
│  ├─ src/
│  │  ├─ components/         UI building blocks + modals
│  │  ├─ services/           API client + Supabase client helpers
│  │  ├─ types.ts            shared TypeScript types
│  │  └─ App.tsx             main app state + view routing
│  └─ package.json
│
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ main.py          FastAPI app + CORS + routers
│  │  │  └─ routes/          HTTP endpoints (files/subjects/chat/guest/user)
│  │  ├─ services/           business logic (RAG, embeddings, storage, etc.)
│  │  ├─ models/             Pydantic schemas for request/response
│  │  └─ utils/              file handling helpers
│  ├─ requirements.txt
│  └─ run.py                 server entrypoint
│
├─ database/migrations/      Supabase SQL schema migrations
└─ chroma_db/                ChromaDB persistence (local)
```

- **Why this structure**:
  - Routes stay thin (request parsing + calling services).
  - Services hold logic you can test, reuse, and evolve (RAG pipeline, chunking, embeddings).
  - Clear separation makes it easier to explain and maintain.

---

## Key pipelines (end-to-end)

### 1) Authentication pipeline (Supabase)

**Frontend**
- Uses `@supabase/supabase-js` to sign up/in and get a session.
- Session provides an `access_token` (JWT) used for backend requests.
- The frontend attaches headers:
  - **Authorization**: `Bearer <access_token>`
  - Or **X-Guest-Session-ID** for guest mode (no login).

**Backend**
- Uses `AuthService` (`backend/app/services/auth_service.py`) to:
  - Parse `Authorization: Bearer ...`
  - Verify token via the Supabase Python client (`client.auth.get_user(token)`)

**Why Supabase Auth**
- Saves time vs building password storage + OAuth flows.
- Provides hardened auth, session refresh, OAuth providers (Google).
- Works cleanly for a React SPA + FastAPI API.

---

### 2) Subjects pipeline (workspace isolation)

**What “Subject” means**
- A subject is a workspace boundary for:
  - Uploaded files metadata in Supabase
  - A dedicated ChromaDB collection: `subject_<subject_id>`
  - Chat history in the frontend (stored per subject)

**Backend flow (from `backend/app/api/routes/subjects.py`)**
- `POST /api/subjects`:
  - Creates a ChromaDB collection for a new UUID.
  - Ensures the user exists in the `users` table (prevents FK issues).
  - Inserts the subject into Supabase.

**Why per-subject isolation**
- Prevents cross-topic mixing during retrieval.
- Makes explanations and citations cleaner (“this answer is from your Biology notes”).
- Enables scaling later (per-subject quotas, sharing, deletion).

---

### 3) File upload pipeline (single + batch)

**Frontend**
- Builds `FormData` and sends to:
  - `POST /api/files/upload` (single file)
  - `POST /api/files/upload-multiple` (batch)
- Includes `subject_id` as a multipart field.

**Backend (`backend/app/api/routes/files.py`)**
- Validates:
  - **Size**: 50MB per file
  - **Type**: `.pdf .docx .pptx .xlsx .xls .csv .txt .md`
  - **Storage cap**: 500MB for logged-in users (guests are unlimited in current logic)
- Saves file under:
  - Guest: `./uploads/guest/temp/<guest_session>/<subject_id>/...`
  - User: `./uploads/user/<user_id>/<subject_id>/...`
- Computes `file_hash` (SHA-256) for duplicate detection.
- Writes a `files` record in Supabase with status `pending`.
- Schedules ingestion using FastAPI `BackgroundTasks`.

**Why BackgroundTasks**
- Upload endpoint returns quickly (better UX).
- Heavy processing (PDF parsing, embeddings) runs asynchronously.
- Avoids blocking the API request thread.

---

### 4) Ingestion pipeline (extract → chunk → embed → store)

**Where it happens**
- Background task calls `FileProcessor.process_file()` (`backend/app/services/file_processor.py`).

**Steps**
- **Extract text** from the file via utilities (`extract_text_from_file`).
  - Multiple libraries support real-world student formats:
    - `pypdf` + `pdfplumber` (PDF)
    - `python-docx` (DOCX)
    - `python-pptx` (PPTX)
    - `pandas` + `openpyxl` + `xlrd` (CSV/XLS/XLSX)
- **Chunk** the text with `langchain` `RecursiveCharacterTextSplitter`
  - Default: chunk size 512, overlap 50
  - Attaches metadata (file_id, file_name, type, page_number, etc.)
- **Embed** chunks using `sentence-transformers`
  - Model default: `all-MiniLM-L6-v2` (384-dim vectors)
- **Store** embeddings + text + metadata into **ChromaDB**, per subject.

**Why these tools**
- **langchain splitter**: battle-tested chunking logic; fast to tune chunk sizes/overlap.
- **sentence-transformers MiniLM**: strong quality/speed tradeoff for semantic search, runs locally.
- **ChromaDB persistent client**: simple local vector DB; no extra infra required while developing.

---

### 5) Retrieval + RAG pipeline (hybrid search)

**Backend service**
- `RAGService` (`backend/app/services/rag_service.py`)

**Hybrid retrieval**
- Semantic search:
  - Embed the user query
  - Query ChromaDB for nearest chunks
- Keyword ranking:
  - Run BM25 (`rank-bm25`) over the semantic candidate texts
- Combine scores:
  - `semantic_weight = 0.7`, `bm25_weight = 0.3`
  - Return top results (optimized to `top_k=7` for speed)

**Why hybrid search**
- Pure embeddings can miss exact keywords (formulas, names, code terms).
- Pure keyword search misses paraphrases.
- Hybrid makes student note search more reliable.

---

### 6) Generation pipeline (Groq LLM) + citations

**Backend service**
- `GroqService` (`backend/app/services/groq_service.py`)

**Prompting**
- System instruction: answer **only from provided context**; if missing, say so.
- Context is built from retrieved chunks and includes `[File: ..., Page: ...]`.

**Citations**
- Citations returned are derived from chunk metadata (`file_name`, and page if available).

**Why Groq**
- Very fast inference (good for “feels instant” study chat).
- Simple Python SDK (`groq`), clean streaming support.

---

### 7) Streaming chat pipeline (SSE)

**Backend**
- `POST /api/chat/query-stream` returns `text/event-stream`
- Sends messages as SSE lines:
  - `data: {"type":"citations",...}`
  - `data: {"type":"chunk","text":"..."}`
  - `data: {"type":"done"}`

**Frontend**
- Uses `fetch()` + `ReadableStream` reader + `TextDecoder`
- Parses lines starting with `data: `
- Updates the “bot message” incrementally (better perceived speed).

**Why SSE instead of WebSockets**
- SSE is simpler for server → client streaming.
- Works well with FastAPI `StreamingResponse`.
- No extra connection management complexity.

---

### 8) Chat history persistence (frontend)

- Chat is persisted in `localStorage`, keyed by user/guest and subject.
- Result: refresh and re-login restore context without extra backend storage.

**Why localStorage**
- Easiest reliable persistence for a SPA.
- Avoids storing private chat content server-side early in development.

---

## Libraries and tools (what they do, and why they’re here)

### Frontend (from `frontend/package.json`)
- **React + React DOM**: UI rendering + component model.
- **Vite**: fast dev server and build pipeline.
- **TypeScript**: safer refactors, fewer runtime errors in complex state flows.
- **Tailwind CSS** (present in project setup): consistent modern styling with utility classes.
- **@supabase/supabase-js**: auth + session handling on the client.
- **axios**: standard JSON API calls (upload uses `FormData` + progress).
- **lucide-react**: clean icon set.

### Backend (from `backend/requirements.txt`)
- **FastAPI**: clean API design + typed request/response + async-friendly.
- **uvicorn**: ASGI server.
- **python-multipart**: needed for file uploads.
- **python-dotenv**: load `.env` at startup (`load_dotenv()` in `backend/app/api/main.py`).
- **Supabase Python client (`supabase==2.3.0`)**: DB operations, storage helpers, token verification.
- **ChromaDB**: vector database persisted locally to `./chroma_db`.
- **sentence-transformers**: embeddings model.
- **langchain**: text chunking utilities.
- **rank-bm25**: keyword scoring for hybrid retrieval.
- **groq**: LLM client + streaming.
- **pypdf / pdfplumber / python-docx / python-pptx / pandas / openpyxl / xlrd**: robust document parsing.
- **reportlab**: PDF export of chat.
- **aiofiles**: async-friendly file operations (useful for uploads/processing).

---

## Environment variables (configuration)

### Backend (`backend/.env`)
- `SUPABASE_URL`
- `SUPABASE_KEY` (anon/public JWT-style key used by Python client)
- `SUPABASE_SERVICE_KEY` (service_role key — keep server-only)
- `GROQ_API_KEY`
- `GROQ_MODEL` (default: `llama-3.3-70b-versatile`)
- `CHROMADB_PATH` (default used: `./chroma_db`)

### Frontend (`frontend/.env.local`)
- `VITE_API_URL` (e.g. `http://localhost:8000`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Why this design works well for a “private study assistant”

- **Privacy boundary**: The model is instructed to answer only from your uploaded content.
- **Explainability**: Citations come from retrieved chunk metadata.
- **Speed**:
  - Streaming responses (SSE)
  - Limited context length and fewer retrieved chunks (`top_k=7`)
  - Groq low-latency inference
- **UX**:
  - Subject workspaces
  - Batch uploads
  - Duplicate detection hooks
  - Persistent chat history

---

## What I would improve next (optional talking points)

- **Stronger authorization checks** on file upload endpoints (ensure uploads map to the authenticated user via JWT, not a user-provided header).
- **Job queue** (Celery/RQ/Redis) for ingestion at scale instead of in-process background tasks.
- **Server-side chat persistence** for multi-device sync (optional).
- **Better PDF page mapping** so citations always show accurate page numbers.
- **Chunk-level semantic duplicate detection** (cosine similarity) rather than hash-only checks.
- **Observability**: structured logs + request IDs, timing per pipeline stage.

---

## “Explain it in 30 seconds” (quick summary)

InkSage is a subject-based RAG system: the frontend (React) authenticates via Supabase and sends uploads/chat requests to a FastAPI backend. Files are processed asynchronously: extracted, chunked with LangChain, embedded using sentence-transformers, and stored in ChromaDB per subject. For chat, the backend retrieves relevant chunks using hybrid semantic+BM25 search, then sends the context to Groq to generate an answer with citations, streamed back to the UI via SSE for fast feedback.


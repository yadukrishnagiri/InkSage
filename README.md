# InkSage - Private AI Study Workspace

A RAG-based private study workspace for students. Upload your notes, organize them by subject, and get AI-powered answers backed by exact citations from your content.

## Features

- **Multi-file Support**: PDF, DOCX, PPTX, XLSX, XLS, CSV, TXT, MD
- **Subject-based Organization**: Each subject has its own chat workspace
- **Proof-based Answers**: All answers include citations from your notes
- **Hybrid Search**: Combines semantic (vector) and keyword (BM25) search
- **Guest Mode**: Try without signing up (auto-deletes on close)
- **PDF Export**: Export chat conversations as PDF

## Tech Stack

### Frontend
- React 19.2.0 + Vite 6.2.0
- TypeScript
- Tailwind CSS
- Lucide React (icons)

### Backend
- FastAPI (Python)
- Groq API (LLM)
- ChromaDB (Vector Database)
- sentence-transformers (Embeddings)
- langchain (Text Chunking)
- Supabase (Auth, Database, Storage)

## Project Structure

```
InkSage/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API routes
│   │   ├── services/  # Business logic
│   │   ├── models/    # Pydantic models
│   │   └── utils/     # Utilities
│   └── requirements.txt
├── database/
│   └── migrations/    # SQL migrations
└── chroma_db/         # ChromaDB storage
```

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase account
- Groq API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file (copy from `.env.example`):
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
CHROMADB_PATH=./chroma_db
```

5. Run database migrations in Supabase SQL editor (see `database/migrations/001_initial_schema.sql`)

6. Start the server:
```bash
python run.py
```

Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (copy from `.env.local.example`):
```bash
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173` (Vite default port)

## Usage

1. Start both backend and frontend servers
2. Open `http://localhost:5173` in your browser
3. Click "Try Guest Mode" or sign up
4. Create a subject
5. Upload files (PDF, DOCX, PPTX, etc.)
6. Wait for files to process
7. Start chatting with your notes!

## API Endpoints

### Files
- `POST /api/files/upload` - Upload a file
- `GET /api/files/{file_id}/status` - Get file processing status
- `DELETE /api/files/{file_id}` - Delete a file

### Subjects
- `GET /api/subjects` - List subjects
- `POST /api/subjects` - Create subject
- `DELETE /api/subjects/{subject_id}` - Delete subject

### Chat
- `POST /api/chat/query` - Send query to RAG system
- `POST /api/chat/export-pdf` - Export chat as PDF

### Guest
- `POST /api/guest/session` - Create guest session
- `GET /api/guest/session/{session_id}` - Get session info

## Development

### Backend
- Main entry: `backend/run.py`
- API routes: `backend/app/api/routes/`
- Services: `backend/app/services/`

### Frontend
- Main component: `frontend/src/App.tsx`
- API service: `frontend/src/services/apiService.ts`

## Testing Connections

### Test Database Connection

```bash
cd backend
python test_db_connection.py
```

This will test your Supabase database connection and verify tables are accessible.

### Test Groq API Key

```bash
cd backend
python test_groq_key.py
```

This will verify your Groq API key is valid and test the model connection.

### Test API Connection

First, make sure the backend is running:
```bash
cd backend
python run.py
```

Then in another terminal:
```bash
cd backend
python test_api_connection.py
```

### Run All Tests

```bash
cd backend
python run_tests.py
```

### Frontend Connection Test

Open `frontend/test-connection.html` in your browser to test:
- Environment variables
- Backend API connection
- Supabase connection
- Full integration

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
CHROMADB_PATH=./chroma_db
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting API Keys

### Groq API Key
1. Go to https://console.groq.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and add to `backend/.env` as `GROQ_API_KEY`

### Supabase Keys
1. Go to https://supabase.com/
2. Create a new project or use existing
3. Go to Project Settings > API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_KEY` (frontend) and `SUPABASE_KEY` (backend)
   - service_role key → `SUPABASE_SERVICE_KEY` (backend only)

## Troubleshooting

### Backend Issues

**"Invalid API Key" error:**
- Verify your `GROQ_API_KEY` in `backend/.env` is correct
- Make sure the backend server is restarted after updating `.env`
- Test the key with: `python backend/test_groq_key.py`

**"Model decommissioned" error:**
- Update `GROQ_MODEL` in `backend/.env` to `llama-3.3-70b-versatile`
- Check Groq documentation for current available models

**Database connection errors:**
- Verify Supabase credentials in `backend/.env`
- Run `python backend/test_db_connection.py` to diagnose
- Ensure database migrations are run in Supabase SQL editor

### Frontend Issues

**White screen on load:**
- Check browser console (F12) for errors
- Verify `.env.local` exists in `frontend/` directory
- Ensure all environment variables are set correctly

**API connection errors:**
- Verify backend is running on `http://localhost:8000`
- Check `VITE_API_URL` in `frontend/.env.local`
- Test connection with `frontend/test-connection.html`

## License

MIT


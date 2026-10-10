# InkSage

InkSage is a local study workspace. Create a subject such as Chemistry or Maths, upload its text based PDFs, select that subject, and ask questions grounded in only those PDFs. Answers show PDF and page references.

This version has **no login and no database**. Subject metadata, uploaded PDFs, and extracted page text are stored under `local_data/` (ignored by Git). Chat history is kept in the current browser's local storage. Nothing is automatically deleted when a tab closes.

## Run locally

Use Python 3.10+ and Node.js 18+.

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe run.py
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The landing page opens on every visit; choose **Start studying** to resume your local workspace. Create a subject, upload its PDFs, and ask questions in that subject. The frontend proxies API calls to the local backend on port 8000. You can also run `npm run build` and serve the built app from the backend on [http://127.0.0.1:8000](http://127.0.0.1:8000).

For generated AI answers, put `GROQ_API_KEY=...` in `backend/.env`. Optionally set `GROQ_MODEL`. Without a key, chat returns matching passages from the selected subject so the upload and retrieval flow can be tested offline. A Groq key sends selected PDF excerpts and the question to Groq; do not set it if that transfer is unwanted.

## Scope and limits

- PDF only, up to 20 MB and 300 pages per file. PDFs need selectable text; scanned pages need OCR before upload.
- Retrieval uses local keyword overlap. It is intentionally lightweight for local testing and may miss semantic matches or synonyms.
- The server binds to `127.0.0.1`; local files are not protected by accounts. Do not expose this API to a network.
- Deleting a subject deletes its PDFs and extracted text. Deleting a PDF deletes its extracted text too.
- The old Supabase and ChromaDB modules remain in the repository for reference but are not loaded by the active app. Existing `uploads/`, `chroma_db/`, and remote Supabase data were not deleted or migrated.

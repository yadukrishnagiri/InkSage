# InkSage

InkSage is a local study workspace. Create a subject such as Chemistry or Maths, upload its PDFs, select that subject, and ask questions grounded in only those PDFs. Answers show PDF and page references; selecting a reference opens the cited page with the supporting passage highlighted when it can be matched.

This version has **no login and no database**. Subject metadata, uploaded PDFs, and extracted page text are stored under `local_data/` (ignored by Git). Multiple named chats can be created and searched within each subject; their history is kept in the current browser's local storage. Nothing is automatically deleted when a tab closes.

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

- PDF only, up to 20 MB and 300 pages per file. PDFs with embedded text are read directly. Image-only pages use local OCR when [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) is installed; without it, those uploads fail with an installation message. OCR accuracy depends on scan quality.
- Upload progress reports the current transfer, text extraction, or OCR step using measured bytes or completed pages. The percentage resets for each step.
- Retrieval uses local keyword overlap. It is intentionally lightweight for local testing and may miss semantic matches or synonyms.
- The server binds to `127.0.0.1`; local files are not protected by accounts. Do not expose this API to a network.
- Deleting a subject deletes its PDFs and extracted text. Deleting a PDF deletes its extracted text too.
- The old Supabase and ChromaDB modules remain in the repository for reference but are not loaded by the active app. Existing `uploads/`, `chroma_db/`, and remote Supabase data were not deleted or migrated.

## Portfolio demo edit

The optional `portfolio_demo/build_demo.py` script cuts a screen recording into a silent, 25-second, full-frame walkthrough with explanatory pop-ups. Install its separate editing dependencies with `python -m pip install Pillow imageio-ffmpeg`, then run:

```powershell
python portfolio_demo/build_demo.py "C:\path\to\your\recording.mp4"
```

The cut points in `SHOTS` were selected for the original InkSage recording, so adjust them for another recording. Generated videos, poster images, and temporary render files are ignored by Git; the source recording is not included in this repository.

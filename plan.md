Understood.
We will **not pick front-end style now** — instead, we will build a **full bullet-proof product blueprint** (from UX to RAG to DB to security) that works regardless of design choices.

Below is the **complete end-to-end plan for your platform**.

---

# 📌 **Full Bullet-Proof Product Plan**

### **RAG-Based Private Study Workspace for Students**

---

## 🧠 1) Core Product Pillars (Non-Negotiable Rules)

✔️ **User’s notes only** — no internet mixing unless user enables
✔️ **Multi-file per subject (PDF, PPT, DOC, Excel, CSV)**
✔️ **Subject = Chat Workspace (mini model context)**
✔️ **Privacy-first: Auto delete if guest**
✔️ **Duplicate Upload Intelligence**
✔️ **Proof-Based Outputs = cite exact text snippets**
✔️ **Download outputs (PDF) only** (Phase 1)

---

## 🏗️ 2) System Architecture Overview

### 🔹 **Frontend**

* React / Next.js (SSR optional)
* File upload + chat client
* PDF export client side or server side

### 🔹 **Backend + Storage**

| Component           | Choice                               |
| ------------------- | ------------------------------------ |
| Auth                | Supabase Auth                        |
| DB                  | Supabase Postgres                    |
| File Storage        | Supabase Buckets                     |
| RAG Processing      | Python Service (FastAPI)             |
| Embeddings          | OpenAI / Ollama local optional       |
| Vector DB           | `pgvector` in Supabase               |
| Deduplication Model | Local cosine similarity + chunk hash |

### 🔗 **Data Flow**

```
Frontend → Supabase Auth → Upload Files → Supabase Storage
                          ↓
                Backend (FastAPI)
     - Convert files to text
     - Chunk text + embed
     - Store embeddings in pgvector + metadata
                          ↓
                Chat Query → Retrieval → LLM
                          ↓
                  Answer + Citations
```

---

## 🗂️ 3) Data Structure (Database + Storage)

### **📁 Table: users**

| Column       | Type      |
| ------------ | --------- |
| id           | uuid      |
| email        | text      |
| storage_used | bigint    |
| created_at   | timestamp |

### **📂 Table: subjects**

| Column     | Type      |
| ---------- | --------- |
| id         | uuid      |
| user_id    | uuid      |
| name       | text      |
| created_at | timestamp |

### **📄 Table: files**

| Column       | Type                           |
| ------------ | ------------------------------ |
| id           | uuid                           |
| subject_id   | uuid                           |
| name         | text                           |
| storage_size | bigint                         |
| status       | `processed / pending / failed` |
| version      | int                            |
| created_at   | timestamp                      |

### **🔍 Table: embeddings**

| Column      | Type                |
| ----------- | ------------------- |
| id          | uuid                |
| file_id     | uuid                |
| chunk_text  | text                |
| vector      | `vector` (pgvector) |
| page_number | int                 |
| char_start  | int                 |
| char_end    | int                 |

---

## 🔐 4) Duplicate Detection Strategy

### How it works:

1. After text extraction → Generate **chunk-level hashes**
2. Compare **hash matches + cosine similarity**
3. If >70% match → Trigger popup:

```
“We found very similar content in your existing file ‘Unit 2 Notes’. 
Replace it or keep both?”
[Replace] [Keep Both]
```

### Tech:

* Jaccard similarity (raw text)
* Cosine similarity (embedding vectors)
* Store hash in DB to reduce repeated compute

---

## 💬 5) Chat + RAG Logic

### **Query Flow**

```
→ Retrieve top chunks for subject (not full DB)
→ Rank by scoring:
     relevance_score = cosine + metadata match (file name priority)
→ Construct context prompt:
     - Include snippets
     - Include citations link
→ Output formatted answer
```

### **Anti-Hallucination Rules**

* If retrieval score < threshold → Answer:

```
“I don’t see this in your notes. Try uploading related files.”
```

* Strict Mode: Block general knowledge response completely
* Smart Mode: Allow + label externally sourced info clearly.

---

## 📎 6) Answer Formats (Dynamic Prompting)

The system should detect question type using a classifier:

* MCQ?
* Theory?
* Numerical?
* Short Note?

It adjusts output template automatically.
Example pseudocode:

```
if type == "numerical":
   provide steps + final answer
if type == "mcq":
   provide correct option + explanation using note citations
```

---

## ⛑️ 7) Privacy + Security Strategy

### Guest Users

* No account → Temporary session ID
* Files stored under `guest/temp/<uuid>`
* Auto delete:

  * When tab closed OR
  * 2 hours inactivity

### Logged Users

* Storage cap: **500MB**
* Soft warning at 450MB
* Automatic duplicate cleanup suggestion

### Encryption

* Supabase does at rest + transit automatically
* Store embeddings without raw content leakage by chunk reference (IDs only)

---

## 📄 8) PDF Export Logic

Only export **chat responses tied to citations**:

```
Answer text
---
References (with page + snippet)
```

Server-side generation recommended (Python + ReportLab).

---
we will use groq api as llm model
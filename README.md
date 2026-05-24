<div align="center">

# 📄 DocuMind AI — Intelligent Document Chatbot

**A production-ready RAG chatbot that lets you chat with your documents using AI.**  
Upload PDFs, Word docs, spreadsheets, and CSVs — ask anything and get cited answers streamed in real time.

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat-square)](https://console.groq.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Live-10b981?style=flat-square)]()

[Live Demo](https://documind-frontend.onrender.com)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [How It Works](#-how-it-works)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**DocuMind AI** is a full-stack Retrieval-Augmented Generation (RAG) chatbot. Upload your documents once and ask any question — the AI retrieves the most relevant sections, injects them as context, and streams a cited answer back to you in real time.

Built with a **Next.js 14** frontend and **FastAPI** backend, powered by **Groq's free LLaMA 3.3 70B** model and **FAISS** vector search. No login required — open straight to chat.

### Example Conversation

```
User  : What are the main themes in the uploaded document?
Bot   : Based on the document, the three main themes are... [Source: Chapter 1, Page 4]

User  : Summarize the conclusion
Bot   : The conclusion states that... [Source: Conclusion, Page 47]

User  : What did the author recommend?
Bot   : The author recommended the following steps... [Source: Page 49]
```

---

## ✨ Features

### Core
- 📂 **Multi-format Upload** — PDF, DOCX, TXT, CSV, XLSX up to 50 MB
- ⚡ **Real-time Streaming** — Tokens stream instantly via Server-Sent Events
- 🔍 **Semantic Search** — FAISS vector index + MiniLM sentence embeddings
- 💬 **Chat History** — Sessions persist in SQLite across page refreshes
- 📌 **Source Citations** — Every answer links back to the exact document section used
- 🧠 **Multi-turn Memory** — Bot remembers context across the full conversation

### Pages / Views
- **Chat** — Main AI chat interface with streaming responses
- **Documents** — Upload, view, and delete your knowledge base files

### Quality
- 📱 Fully responsive — works on mobile and desktop
- 🌙 Dark glassmorphism UI with Framer Motion animations
- ⚡ Fast responses via Groq free-tier inference
- 🔓 No login required — opens straight to chat
- 🆓 Completely free to run and deploy

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14, Tailwind CSS, Framer Motion | UI, chat view, document manager |
| **Backend** | FastAPI, SQLAlchemy | REST API + SSE streaming |
| **AI Model** | Groq — LLaMA 3.3 70B | Response generation |
| **Embeddings** | sentence-transformers (MiniLM-L6-v2) | Text → vectors (free, CPU) |
| **Vector DB** | FAISS | Semantic similarity search |
| **Database** | SQLite | Sessions, messages, document metadata |
| **Deployment** | Render.com | Free cloud hosting |

---

## 📁 Project Structure

```
documind-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── chat.py          # SSE streaming, session CRUD
│   │   │   ├── documents.py     # Upload, list, delete
│   │   │   └── health.py        # GET /health
│   │   ├── core/
│   │   │   ├── config.py        # All settings via pydantic-settings
│   │   │   └── logging.py       # Structured logging
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── file_parser_service.py   # PDF / DOCX / CSV / XLSX parsing
│   │   │   ├── embedding_service.py     # sentence-transformers
│   │   │   ├── vector_db_service.py     # FAISS index management
│   │   │   ├── llm_service.py           # Groq streaming API
│   │   │   └── rag_service.py           # Full RAG pipeline
│   │   ├── database.py          # SQLAlchemy engine + session factory
│   │   └── main.py              # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout (dark theme)
│   │   │   ├── page.tsx         # App shell
│   │   │   └── globals.css      # Tailwind + CSS variables
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header
│   │   │   ├── chat/            # ChatInterface, MessageBubble,
│   │   │   │                    # ChatInput, SourceCard, TypingIndicator
│   │   │   └── documents/       # DocumentUpload, DocumentCard, DocumentList
│   │   ├── hooks/               # useChat, useDocuments
│   │   ├── lib/                 # api.ts (axios + SSE), utils.ts
│   │   ├── store/               # Zustand chat store
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   ├── next.config.js
│   └── Dockerfile
│
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Python](https://python.org) 3.11 or higher
- [Node.js](https://nodejs.org) 20 or higher
- A free [Groq API key](https://console.groq.com) (no credit card required)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/documind-ai.git
cd documind-ai
```

**2. Set up the Backend**
```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and add your GROQ_API_KEY

# Start the backend
uvicorn app.main:app --reload --port 8000
```

API explorer available at: `http://localhost:8000/docs`

**3. Set up the Frontend**
```bash
cd frontend
npm install
npm run dev
```

**4. Open in browser**
```
http://localhost:3000
```

### Docker (both services at once)

```bash
echo "GROQ_API_KEY=gsk_your_key_here" > .env
docker-compose up --build
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
# Groq API Key — get yours free at https://console.groq.com
GROQ_API_KEY=gsk_your_key_here

# LLM Model
GROQ_MODEL=llama-3.3-70b-versatile

# Database
DATABASE_URL=sqlite:///./documind.db

# CORS — add your frontend URL
ALLOWED_ORIGINS=["http://localhost:3000"]

# File storage
UPLOAD_DIR=uploads
VECTOR_STORE_DIR=vector_stores
MAX_FILE_SIZE_MB=50

# RAG tuning
SIMILARITY_THRESHOLD=0.1
```

**Getting a Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Go to **API Keys → Create API Key**
4. Copy the key starting with `gsk_...`

> 🔒 Never commit your `.env` file. It is already in `.gitignore`.

---

## 📡 API Reference

### `GET /health`
Returns service health including Groq API status.

**Response**
```json
{ "status": "healthy", "groq": "connected" }
```

---

### `POST /api/documents/upload`
Upload a document for RAG ingestion.

**Request** — `multipart/form-data`
```
file: <your PDF / DOCX / TXT / CSV / XLSX>
```

**Response**
```json
{
  "id": 1,
  "original_filename": "report.pdf",
  "file_type": "pdf",
  "file_size": 204800,
  "status": "processing",
  "chunk_count": 0
}
```

---

### `GET /api/documents/`
Returns all uploaded documents.

**Response**
```json
{
  "documents": [
    {
      "id": 1,
      "original_filename": "report.pdf",
      "status": "ready",
      "chunk_count": 42
    }
  ],
  "total": 1
}
```

---

### `DELETE /api/documents/{id}`
Delete a document from the DB, disk, and FAISS index.

**Response** — `204 No Content`

---

### `POST /api/chat/sessions`
Create a new chat session.

**Request Body**
```json
{ "title": "My Research Chat" }
```

**Response**
```json
{ "id": 1, "title": "My Research Chat", "created_at": "2024-01-01T00:00:00Z" }
```

---

### `POST /api/chat/stream`
Stream an AI response via Server-Sent Events.

**Request Body**
```json
{
  "session_id": 1,
  "message": "What are the main findings?",
  "document_ids": [1, 2]
}
```

**SSE Events**
```
event: sources
data: [{"filename": "report.pdf", "chunk_text": "...", "relevance_score": 0.87}]

event: token
data: "The main"

event: token
data: " findings are..."

event: done
data: {"message_id": 42}
```

---

## ☁️ Deployment

### Deploy to Render (Recommended)

**1. Push your code to GitHub**

**2. Deploy Backend**
- Go to [render.com](https://render.com) → **New → Web Service**
- Connect your GitHub repo
- Set:

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

- Add **Environment Variables:**

| Key | Value |
|---|---|
| `GROQ_API_KEY` | your key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `DATABASE_URL` | `sqlite:///./data/documind.db` |
| `UPLOAD_DIR` | `data/uploads` |
| `VECTOR_STORE_DIR` | `data/vector_stores` |
| `ALLOWED_ORIGINS` | `["https://your-frontend.onrender.com"]` |

- Add **Persistent Disk** → Mount path: `/app/data` → Size: `1 GB`

**3. Deploy Frontend**
- New → Web Service → same repo
- Set:

| Field | Value |
|---|---|
| Root Directory | `frontend` |
| Runtime | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

- Add **Environment Variable:**

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` |

> ⚠️ Free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30s to wake up.

---

## 🔍 How It Works

```
+-----------------------------------------------------------+
|                  Browser (Next.js 14)                      |
|                                                           |
|  Sidebar --> Chat View          Documents View             |
|              |   ^                   |                    |
|        SSE tokens |                  | drag-and-drop      |
+--------------|---|------------------  |------------------+
               |   |                   |
               v   |                   v
+-------------------------------------------------------------+
|                    FastAPI Backend                           |
|                                                             |
|  POST /api/chat/stream      POST /api/documents/upload      |
|         |                            |                      |
|         v                            v                      |
|  +-------------+          +------------------+             |
|  |  RAG Service |          |  File Parser     |             |
|  |              |          |  PDF/DOCX/CSV/.. |             |
|  | 1. Embed Q   |          +--------+---------+             |
|  | 2. FAISS     |                   | text chunks           |
|  |    search    |          +--------v---------+             |
|  | 3. Build     |<---------| Embedding Service|             |
|  |    prompt    |          |  MiniLM-L6-v2    |             |
|  | 4. Stream    |          +--------+---------+             |
|  |    via Groq  |                   | vectors               |
|  +------+-------+          +--------v---------+             |
|         |                  |   FAISS Index    |             |
|         v                  +------------------+             |
|  +-------------+                                           |
|  |   Groq API  |    SQLite (sessions, messages, docs)      |
|  | LLaMA 3.3   |                                           |
|  |   70B       |                                           |
|  +-------------+                                           |
+-------------------------------------------------------------+
```

### RAG Pipeline (Step by Step)
1. **Upload** — File is parsed into text chunks and embedded using MiniLM
2. **Store** — Embeddings saved to FAISS index; metadata saved to SQLite
3. **Query** — User message is embedded and matched against FAISS index
4. **Retrieve** — Top-K most relevant chunks are fetched
5. **Generate** — Chunks injected into Groq prompt; response streamed token by token
6. **Cite** — Source document and page shown alongside the answer

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ using FastAPI, Next.js, FAISS, and Groq

**[⬆ Back to Top](#-documind-ai--intelligent-document-chatbot)**

</div>

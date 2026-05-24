// ─── Document Types ──────────────────────────────────────────────────────────

export type DocumentStatus = "uploading" | "processing" | "ready" | "failed";

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: DocumentStatus;
  error_message?: string;
  created_at: string;
}

// ─── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface SourceReference {
  document_id: number;
  filename: string;
  chunk_text: string;
  relevance_score: number;
  page?: number;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  created_at: string;
}

export interface ChatHistory {
  session: ChatSession;
  messages: ChatMessage[];
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}

// Local streaming message (not yet saved to DB)
export interface StreamingMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  isStreaming?: boolean;
}

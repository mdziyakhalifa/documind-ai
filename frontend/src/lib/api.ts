// ─── Axios API client with base URL from env ─────────────────────────────────

import axios from "axios";
import { Document, ChatSession, ChatHistory, ChatMessage } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentsApi = {
  list: () => api.get<{ documents: Document[]; total: number }>("/documents/"),

  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<Document>("/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },

  delete: (id: number) => api.delete(`/documents/${id}`),

  get: (id: number) => api.get<Document>(`/documents/${id}`),
};

// ─── Chat Sessions ────────────────────────────────────────────────────────────

export const chatApi = {
  createSession: (title?: string) =>
    api.post<ChatSession>("/chat/sessions", { title: title || "New Chat" }),

  listSessions: () => api.get<ChatSession[]>("/chat/sessions"),

  getSession: (id: number) => api.get<ChatHistory>(`/chat/sessions/${id}`),

  deleteSession: (id: number) => api.delete(`/chat/sessions/${id}`),

  renameSession: (id: number, title: string) =>
    api.patch<ChatSession>(`/chat/sessions/${id}`, { title }),

  // Returns the raw SSE URL — consumed by useChat hook with EventSource/fetch
  streamUrl: () => `${API_URL}/api/chat/stream`,
};

// ─── Streaming helper ─────────────────────────────────────────────────────────

export async function* streamChat(
  sessionId: number,
  message: string,
  documentIds?: number[]
): AsyncGenerator<{ event: string; data: string }> {
  const response = await fetch(`${API_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      document_ids: documentIds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    let currentEvent = "message";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        yield { event: currentEvent, data: line.slice(6).trim() };
        currentEvent = "message";
      }
    }
  }
}

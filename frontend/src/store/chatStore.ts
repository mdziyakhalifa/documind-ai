// ─── Global chat state via Zustand ───────────────────────────────────────────

import { create } from "zustand";
import { ChatSession, StreamingMessage, SourceReference } from "@/types";

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: number | null;
  messages: StreamingMessage[];
  isStreaming: boolean;
  selectedDocIds: number[];

  setSessions: (s: ChatSession[]) => void;
  addSession: (s: ChatSession) => void;
  removeSession: (id: number) => void;
  setActiveSession: (id: number | null) => void;
  setMessages: (m: StreamingMessage[]) => void;
  appendToken: (token: string) => void;
  setSources: (sources: SourceReference[]) => void;
  addUserMessage: (content: string) => void;
  startStreaming: () => void;
  stopStreaming: () => void;
  setSelectedDocs: (ids: number[]) => void;
  toggleDocSelection: (id: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  selectedDocIds: [],

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((s) => ({ sessions: [session, ...s.sessions] })),

  removeSession: (id) =>
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== id),
      activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
      messages: s.activeSessionId === id ? [] : s.messages,
    })),

  setActiveSession: (id) => set({ activeSessionId: id, messages: [] }),

  setMessages: (messages) => set({ messages }),

  addUserMessage: (content) =>
    set((s) => ({
      messages: [...s.messages, { role: "user", content, isStreaming: false }],
    })),

  startStreaming: () =>
    set((s) => ({
      isStreaming: true,
      messages: [
        ...s.messages,
        { role: "assistant", content: "", isStreaming: true },
      ],
    })),

  appendToken: (token) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + token };
      }
      return { messages: msgs };
    }),

  setSources: (sources) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, sources };
      }
      return { messages: msgs };
    }),

  stopStreaming: () =>
    set((s) => {
      const msgs = s.messages.map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m
      );
      return { isStreaming: false, messages: msgs };
    }),

  setSelectedDocs: (ids) => set({ selectedDocIds: ids }),

  toggleDocSelection: (id) =>
    set((s) => ({
      selectedDocIds: s.selectedDocIds.includes(id)
        ? s.selectedDocIds.filter((d) => d !== id)
        : [...s.selectedDocIds, id],
    })),
}));

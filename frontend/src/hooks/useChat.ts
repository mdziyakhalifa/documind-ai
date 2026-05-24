// ─── Chat hook: creates sessions, sends messages, handles SSE streaming ───────

import { useCallback } from "react";
import { chatApi, streamChat } from "@/lib/api";
import { useChatStore } from "@/store/chatStore";
import { ChatMessage, SourceReference } from "@/types";

export function useChat() {
  const store = useChatStore();

  const createSession = useCallback(async (title?: string) => {
    const { data } = await chatApi.createSession(title);
    store.addSession(data);
    store.setActiveSession(data.id);
    store.setMessages([]);
    return data;
  }, [store]);

  const loadSession = useCallback(async (sessionId: number) => {
    store.setActiveSession(sessionId);
    const { data } = await chatApi.getSession(sessionId);
    const mapped = data.messages.map((m: ChatMessage) => ({
      role: m.role,
      content: m.content,
      sources: m.sources,
      isStreaming: false,
    }));
    store.setMessages(mapped);
  }, [store]);

  const loadSessions = useCallback(async () => {
    const { data } = await chatApi.listSessions();
    store.setSessions(data);
  }, [store]);

  const deleteSession = useCallback(async (id: number) => {
    await chatApi.deleteSession(id);
    store.removeSession(id);
  }, [store]);

  const sendMessage = useCallback(
    async (message: string) => {
      const sessionId = store.activeSessionId;
      if (!sessionId || store.isStreaming) return;

      // Optimistically render user message
      store.addUserMessage(message);
      store.startStreaming();

      try {
        for await (const { event, data } of streamChat(
          sessionId,
          message,
          store.selectedDocIds.length > 0 ? store.selectedDocIds : undefined
        )) {
          if (event === "sources") {
            const sources: SourceReference[] = JSON.parse(data);
            store.setSources(sources);
          } else if (event === "token") {
            const token: string = JSON.parse(data);
            store.appendToken(token);
          } else if (event === "done" || event === "error") {
            break;
          }
        }
      } catch (err) {
        store.appendToken("\n\n⚠️ Connection error. Please try again.");
      } finally {
        store.stopStreaming();

        // Refresh session list to show updated title
        loadSessions();
      }
    },
    [store, loadSessions]
  );

  return {
    sessions: store.sessions,
    activeSessionId: store.activeSessionId,
    messages: store.messages,
    isStreaming: store.isStreaming,
    selectedDocIds: store.selectedDocIds,
    createSession,
    loadSession,
    loadSessions,
    deleteSession,
    sendMessage,
    toggleDocSelection: store.toggleDocSelection,
    setSelectedDocs: store.setSelectedDocs,
  };
}

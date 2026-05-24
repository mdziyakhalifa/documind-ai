"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";

const SUGGESTED_PROMPTS = [
  "Summarize the key points from my documents",
  "What are the main topics covered?",
  "Find any dates or deadlines mentioned",
  "List all action items or tasks",
];

export default function ChatInterface() {
  const { messages, isStreaming, activeSessionId, createSession, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = async (message: string) => {
    let sid = activeSessionId;
    if (!sid) {
      const session = await createSession(message.slice(0, 40));
      sid = session.id;
    }
    sendMessage(message);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState onSuggest={handleSend} />
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} index={i} />
              ))}
            </AnimatePresence>
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <TypingIndicator />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto w-full px-6">
        <ChatInput onSend={handleSend} isStreaming={isStreaming} />
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6 py-16"
    >
      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center mb-10"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 font-medium">
          Document Intelligence
        </p>
        <h2 className="text-4xl font-serif italic text-foreground/90 leading-tight mb-3">
          What would you like<br />to know?
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Upload your documents and ask anything. I'll search through them and answer with sources.
        </p>
      </motion.div>

      {/* Suggestion pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex flex-col gap-2 w-full max-w-sm"
      >
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSuggest(prompt)}
            className="group flex items-center justify-between px-5 py-3.5 rounded-xl border border-border bg-card hover:border-warm/40 hover:bg-warm/5 transition-all duration-200 text-left shadow-soft"
          >
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {prompt}
            </span>
            <span className="text-muted-foreground/30 group-hover:text-warm transition-colors text-xs ml-3">
              →
            </span>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

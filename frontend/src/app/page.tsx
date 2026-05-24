"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ChatInterface from "@/components/chat/ChatInterface";
import DocumentList from "@/components/documents/DocumentList";

type View = "chat" | "documents";

const VIEW_CONFIG: Record<View, { title: string; subtitle: string }> = {
  chat: {
    title: "AI Chat",
    subtitle: "Ask questions across your uploaded documents",
  },
  documents: {
    title: "Document Library",
    subtitle: "Upload and manage your knowledge base",
  },
};

export default function Home() {
  const [activeView, setActiveView] = useState<View>("chat");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={VIEW_CONFIG[activeView].title}
          subtitle={VIEW_CONFIG[activeView].subtitle}
        />

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeView === "chat" ? <ChatInterface /> : <DocumentList />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight,
  BookOpen, Clock
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatSession } from "@/types";
import { formatDate, truncate, cn } from "@/lib/utils";

interface SidebarProps {
  activeView: "chat" | "documents";
  onViewChange: (v: "chat" | "documents") => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { sessions, activeSessionId, createSession, loadSession, deleteSession, loadSessions } = useChat();

  useEffect(() => { loadSessions(); }, []);

  const handleNewChat = async () => {
    onViewChange("chat");
    await createSession();
  };

  const handleSessionClick = async (session: ChatSession) => {
    onViewChange("chat");
    await loadSession(session.id);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 248 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="sidebar-panel relative flex flex-col h-full border-r overflow-hidden flex-shrink-0"
    >
      {/* Brand */}
      <div className="sb-border flex items-center gap-3 px-4 py-5 border-b">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'hsl(28, 52%, 50%)' }}>
          <span className="text-xs font-bold text-white">D</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-serif italic text-base leading-none pt-0.5"
              style={{ color: 'hsl(36, 30%, 90%)' }}
            >
              DocuMind
            </motion.span>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[22px] w-6 h-6 rounded-full border flex items-center justify-center z-10 transition-colors"
          style={{
            backgroundColor: 'hsl(20, 18%, 14%)',
            borderColor: 'hsl(20, 12%, 22%)',
          }}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" style={{ color: 'hsl(36,30%,90%/0.4)' }} />
            : <ChevronLeft className="w-3 h-3" style={{ color: 'hsl(36,30%,90%/0.4)' }} />}
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={handleNewChat}
          className={cn(
            "sb-new-btn w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : ""
          )}
        >
          <Plus className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 pb-3 space-y-0.5">
        {[
          { id: "chat", label: "Chat", icon: MessageSquare },
          { id: "documents", label: "Documents", icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id as "chat" | "documents")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              collapsed ? "justify-center" : "",
            )}
            style={
              activeView === id
                ? { backgroundColor: 'hsl(28,52%,50%,0.18)', color: 'hsl(28,52%,72%)', border: '1px solid hsl(28,52%,50%,0.25)' }
                : { color: 'hsl(36,30%,90%,0.45)' }
            }
            onMouseEnter={e => {
              if (activeView !== id) (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(20,12%,20%)';
              if (activeView !== id) (e.currentTarget as HTMLElement).style.color = 'hsl(36,30%,90%)';
            }}
            onMouseLeave={e => {
              if (activeView !== id) (e.currentTarget as HTMLElement).style.backgroundColor = '';
              if (activeView !== id) (e.currentTarget as HTMLElement).style.color = 'hsl(36,30%,90%,0.45)';
            }}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="mx-3 border-t sb-border" style={{ borderColor: 'hsl(20,12%,17%)' }} />

      {/* History */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: 'hsl(36,30%,90%,0.2)' }} />
              <p className="text-xs" style={{ color: 'hsl(36,30%,90%,0.25)' }}>No history yet</p>
            </div>
          ) : (
            <>
              <p
                className="text-[10px] uppercase tracking-widest px-2 mb-2 font-medium"
                style={{ color: 'hsl(36,30%,90%,0.25)' }}
              >
                Recent
              </p>
              <AnimatePresence>
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group relative"
                  >
                    <button
                      onClick={() => handleSessionClick(session)}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors"
                      style={
                        activeSessionId === session.id
                          ? { backgroundColor: 'hsl(20,12%,20%)', color: 'hsl(36,30%,90%)' }
                          : { color: 'hsl(36,30%,90%,0.45)' }
                      }
                      onMouseEnter={e => {
                        if (activeSessionId !== session.id) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(20,12%,18%)';
                          (e.currentTarget as HTMLElement).style.color = 'hsl(36,30%,90%)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (activeSessionId !== session.id) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                          (e.currentTarget as HTMLElement).style.color = 'hsl(36,30%,90%,0.45)';
                        }
                      }}
                    >
                      <p className="text-xs truncate pr-5 font-medium">
                        {truncate(session.title, 30)}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'hsl(36,30%,90%,0.3)' }}>
                        {formatDate(session.created_at)}
                      </p>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                      style={{ color: 'hsl(36,30%,90%,0.3)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'hsl(0,70%,65%)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'hsl(36,30%,90%,0.3)'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      )}

      {/* Status */}
      <div
        className={cn("px-4 py-4 border-t", collapsed ? "flex justify-center" : "")}
        style={{ borderColor: 'hsl(20,12%,17%)' }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[11px]" style={{ color: 'hsl(36,30%,90%,0.3)' }}>Groq · Connected</span>
          </div>
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        )}
      </div>
    </motion.aside>
  );
}

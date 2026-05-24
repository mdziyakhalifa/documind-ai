"use client";

import { motion } from "framer-motion";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { SourceReference } from "@/types";
import { getFileIcon } from "@/lib/utils";

interface SourceCardProps {
  sources: SourceReference[];
}

export default function SourceCard({ sources }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!sources.length) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-warm transition-colors font-medium"
      >
        <FileText className="w-3 h-3" />
        {sources.length} source{sources.length > 1 ? "s" : ""} referenced
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 space-y-1.5"
        >
          {sources.map((source, idx) => (
            <div key={idx} className="border border-border rounded-xl overflow-hidden bg-card shadow-soft">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base">{getFileIcon(source.filename.split(".").pop() || "")}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{source.filename}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {source.page ? `Page ${source.page} · ` : ""}
                      {(source.relevance_score * 100).toFixed(0)}% match
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 ml-3 flex-shrink-0">
                  <div className="w-14 h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warm rounded-full"
                      style={{ width: `${source.relevance_score * 100}%` }}
                    />
                  </div>
                  {openIdx === idx
                    ? <ChevronUp className="w-3 h-3 text-muted-foreground" />
                    : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </div>
              </button>

              {openIdx === idx && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 pb-3 border-t border-border"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2.5">
                    {source.chunk_text}
                  </p>
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

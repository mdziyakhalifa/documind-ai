"use client";

import { motion } from "framer-motion";
import { Trash2, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Document } from "@/types";
import { formatFileSize, formatDate, getFileIcon, cn } from "@/lib/utils";

interface DocumentCardProps {
  document: Document;
  onDelete: (id: number) => void;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}

const statusConfig = {
  uploading: { icon: Loader2, color: "text-blue-500", label: "Uploading", spin: true },
  processing: { icon: Loader2, color: "text-warm", label: "Processing", spin: true },
  ready: { icon: CheckCircle, color: "text-green-600", label: "Ready", spin: false },
  failed: { icon: AlertCircle, color: "text-red-500", label: "Failed", spin: false },
};

export default function DocumentCard({ document, onDelete, selected, onToggleSelect }: DocumentCardProps) {
  const status = statusConfig[document.status] ?? statusConfig.processing;
  const StatusIcon = status.icon;
  const isReady = document.status === "ready";

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "border rounded-xl p-4 transition-all cursor-pointer group bg-card shadow-soft",
        selected
          ? "border-warm/50 ring-1 ring-warm/20"
          : "border-border hover:border-warm/25 hover:shadow-card"
      )}
      onClick={() => onToggleSelect?.(document.id)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
            selected ? "bg-warm/10" : "bg-secondary"
          )}>
            {getFileIcon(document.file_type)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{document.original_filename}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {document.file_type}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(document.id); }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-all flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
        <span>{formatFileSize(document.file_size)}</span>
        {isReady && <span>{document.chunk_count} chunks</span>}
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatDate(document.created_at)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-2.5">
        <StatusIcon className={cn("w-3 h-3", status.color, status.spin && "animate-spin")} />
        <span className={cn("text-[11px] font-medium", status.color)}>{status.label}</span>
        {document.error_message && (
          <span className="text-[11px] text-red-500/70 truncate">— {document.error_message.slice(0, 40)}</span>
        )}
      </div>

      {selected && (
        <div className="mt-2.5 pt-2.5 border-t border-warm/15 flex items-center gap-1.5 text-[11px] text-warm font-medium">
          <CheckCircle className="w-3 h-3" />
          Selected for chat
        </div>
      )}
    </motion.div>
  );
}

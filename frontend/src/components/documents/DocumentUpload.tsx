"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

interface UploadFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<any>;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

export default function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const newFiles = accepted.map((f) => ({ file: f, status: "pending" as const }));
    setFiles((prev) => [...prev, ...newFiles]);

    for (const item of newFiles) {
      setFiles((prev) => prev.map((f) => f.file === item.file ? { ...f, status: "uploading" } : f));
      try {
        await onUpload(item.file);
        setFiles((prev) => prev.map((f) => f.file === item.file ? { ...f, status: "done" } : f));
      } catch (err: any) {
        setFiles((prev) => prev.map((f) =>
          f.file === item.file ? { ...f, status: "error", error: err?.response?.data?.detail || "Upload failed" } : f
        ));
      }
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED_TYPES, maxSize: 50 * 1024 * 1024,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-warm/60 bg-warm/5"
            : "border-border hover:border-warm/30 hover:bg-secondary/60"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
            isDragActive ? "bg-warm/15" : "bg-secondary"
          )}>
            <Upload className={cn("w-5 h-5", isDragActive ? "text-warm" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? "Drop to upload" : "Drag & drop files"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or <span className="text-warm underline underline-offset-2">browse</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {["PDF", "DOCX", "TXT", "CSV", "XLSX"].map((ext) => (
              <span key={ext} className="px-2 py-0.5 rounded-md border border-border bg-background text-[10px] text-muted-foreground font-mono">
                .{ext.toLowerCase()}
              </span>
            ))}
            <span className="text-[11px] text-muted-foreground/60">· Max 50MB</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {files.map(({ file, status, error }) => (
          <motion.div
            key={file.name + file.lastModified}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="border border-border rounded-xl px-4 py-3 flex items-center gap-3 bg-card shadow-soft"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <File className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</p>
                {status === "error" && <p className="text-[11px] text-red-500">{error}</p>}
              </div>
              {status === "uploading" && (
                <div className="mt-2 h-0.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-warm rounded-full"
                    initial={{ width: "5%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              {status === "uploading" && <Loader2 className="w-4 h-4 text-warm animate-spin" />}
              {status === "done" && <CheckCircle className="w-4 h-4 text-green-600" />}
              {status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
              {status === "pending" && (
                <button onClick={() => setFiles((prev) => prev.filter((f) => f.file !== file))} className="p-0.5 rounded hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

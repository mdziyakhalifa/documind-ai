"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useChatStore } from "@/store/chatStore";
import DocumentCard from "./DocumentCard";
import DocumentUpload from "./DocumentUpload";

export default function DocumentList() {
  const { documents, isLoading, fetchDocuments, uploadFile, deleteDocument } = useDocuments();
  const { selectedDocIds, toggleDocSelection } = useChatStore();

  useEffect(() => { fetchDocuments(); }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

          {/* Upload */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-3.5 h-3.5 text-warm" />
              <h3 className="text-sm font-semibold text-foreground">Upload Documents</h3>
            </div>
            <DocumentUpload onUpload={uploadFile} />
          </div>

          {/* Library */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-warm" />
                <h3 className="text-sm font-semibold text-foreground">
                  Your Library
                  {documents.length > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">({documents.length})</span>
                  )}
                </h3>
              </div>
              {selectedDocIds.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs text-warm bg-warm/10 border border-warm/20 px-3 py-1 rounded-full font-medium"
                >
                  {selectedDocIds.length} selected
                </motion.span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border border-border rounded-xl p-4 h-24 animate-pulse bg-card" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-14">
                <FileText className="w-9 h-9 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No documents yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Upload files above to get started</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onDelete={deleteDocument}
                      selected={selectedDocIds.includes(doc.id)}
                      onToggleSelect={toggleDocSelection}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {selectedDocIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-warm/25 bg-warm/5 rounded-xl px-5 py-3.5 text-sm text-warm/80"
            >
              Switch to <strong className="font-semibold text-warm">Chat</strong> — selected documents will be used as context.
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

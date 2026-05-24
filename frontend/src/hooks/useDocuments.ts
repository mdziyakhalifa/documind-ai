// ─── Documents hook: upload, list, delete, poll status ───────────────────────

import { useState, useCallback } from "react";
import { documentsApi } from "@/lib/api";
import { Document } from "@/types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await documentsApi.list();
      setDocuments(data.documents);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<Document | null> => {
      const key = file.name + Date.now();
      setUploadProgress((p) => ({ ...p, [key]: 0 }));

      try {
        const { data } = await documentsApi.upload(file, (pct) => {
          setUploadProgress((p) => ({ ...p, [key]: pct }));
        });

        // Optimistically add to list as "processing"
        setDocuments((prev) => [data, ...prev]);

        // Poll until status is ready or failed
        pollDocumentStatus(data.id);

        return data;
      } catch (err) {
        console.error("Upload failed", err);
        return null;
      } finally {
        setUploadProgress((p) => {
          const next = { ...p };
          delete next[key];
          return next;
        });
      }
    },
    []
  );

  const pollDocumentStatus = useCallback((docId: number) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await documentsApi.get(docId);
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? data : d))
        );
        if (data.status === "ready" || data.status === "failed") {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000); // poll every 2 seconds
  }, []);

  const deleteDocument = useCallback(async (id: number) => {
    await documentsApi.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return {
    documents,
    isLoading,
    uploadProgress,
    fetchDocuments,
    uploadFile,
    deleteDocument,
  };
}

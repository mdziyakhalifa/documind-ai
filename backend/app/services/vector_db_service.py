#! Vector Database Service — FAISS-based per-user vector store
#! Each user gets their own FAISS index stored on disk

import os
import json
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger("documind")


class VectorDBService:
    """Manages FAISS indices per user. Each user has an isolated vector store."""

    def __init__(self, user_id: int):
        from app.core.config import settings
        self.user_id = user_id
        self.store_dir = settings.vector_store_path / str(user_id)
        self.store_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.store_dir / "index.faiss"
        self.metadata_path = self.store_dir / "metadata.json"

        self.index = None
        self.metadata: List[Dict] = []  #! parallel list to FAISS vectors
        self._load_index()

    def _load_index(self):
        """Load existing FAISS index and metadata from disk."""
        try:
            import faiss
            if self.index_path.exists() and self.metadata_path.exists():
                self.index = faiss.read_index(str(self.index_path))
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded FAISS index for user {self.user_id}: {self.index.ntotal} vectors")
            else:
                self._create_new_index()
        except Exception as e:
            logger.warning(f"Could not load index for user {self.user_id}: {e}. Creating new one.")
            self._create_new_index()

    def _create_new_index(self):
        """Initialize a new flat L2 FAISS index."""
        import faiss
        from app.core.config import settings
        #! IndexFlatIP = Inner Product (cosine similarity with normalized vectors)
        self.index = faiss.IndexFlatIP(settings.EMBEDDING_DIMENSION)
        self.metadata = []
        logger.info(f"Created new FAISS index for user {self.user_id}")

    def _save_index(self):
        """Persist the FAISS index and metadata to disk."""
        import faiss
        faiss.write_index(self.index, str(self.index_path))
        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, ensure_ascii=False)

    def add_chunks(self, chunks: List[str], embeddings: np.ndarray, doc_meta: dict) -> int:
        """Add text chunks with their embeddings to the index. Returns count added."""
        if len(chunks) != len(embeddings):
            raise ValueError("chunks and embeddings must have same length")

        embeddings = embeddings.astype(np.float32)
        self.index.add(embeddings)

        for i, chunk in enumerate(chunks):
            self.metadata.append({
                "chunk_text": chunk,
                "document_id": doc_meta.get("document_id"),
                "filename": doc_meta.get("filename"),
                "page": doc_meta.get("page"),
                "sheet": doc_meta.get("sheet"),
            })

        self._save_index()
        logger.info(f"Added {len(chunks)} chunks for user {self.user_id}")
        return len(chunks)

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        document_ids: Optional[List[int]] = None,
        score_threshold: float = 0.3,
    ) -> List[Dict]:
        """Semantic similarity search. Optionally filter by document IDs."""
        if self.index.ntotal == 0:
            return []

        query = query_embedding.astype(np.float32).reshape(1, -1)
        #! Search more than needed so we can filter by document_ids
        search_k = min(self.index.ntotal, top_k * 10)
        scores, indices = self.index.search(query, search_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or score < score_threshold:
                continue
            meta = self.metadata[idx]
            if document_ids and meta.get("document_id") not in document_ids:
                continue
            results.append({**meta, "relevance_score": float(score)})
            if len(results) >= top_k:
                break

        return results

    def delete_document(self, document_id: int):
        """Remove all chunks for a given document_id and rebuild the index."""
        #! FAISS doesn't support deletion natively — we rebuild without those vectors
        import faiss
        from app.core.config import settings
        from app.services.embedding_service import generate_embeddings

        keep_meta = [m for m in self.metadata if m.get("document_id") != document_id]
        if len(keep_meta) == len(self.metadata):
            return  # nothing to delete

        if not keep_meta:
            self._create_new_index()
        else:
            #! Re-embed all kept chunks (expensive but necessary for FAISS)
            texts = [m["chunk_text"] for m in keep_meta]
            embeddings = generate_embeddings(texts).astype(np.float32)
            new_index = faiss.IndexFlatIP(settings.EMBEDDING_DIMENSION)
            new_index.add(embeddings)
            self.index = new_index

        self.metadata = keep_meta
        self._save_index()
        logger.info(f"Deleted document {document_id} from user {self.user_id}'s index")

    def get_chunk_count(self) -> int:
        return self.index.ntotal if self.index else 0

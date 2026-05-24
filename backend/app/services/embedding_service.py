#! Embedding Service — generates vector embeddings using fastembed (ONNX-based)
#! Much lighter than sentence-transformers — no PyTorch, only ~80MB RAM on Render
#! Model: BAAI/bge-small-en-v1.5 (384 dimensions, same as MiniLM-L6-v2)

from typing import List
import numpy as np
import logging

logger = logging.getLogger("documind")

#! Lazy-loaded singleton — model downloads once on first use
_model = None


def get_embedding_model():
    """Load and cache the fastembed model."""
    global _model
    if _model is None:
        logger.info("Loading embedding model...")
        from fastembed import TextEmbedding
        _model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        logger.info("Embedding model loaded successfully")
    return _model


def generate_embeddings(texts: List[str]) -> np.ndarray:
    """Generate normalized embeddings for a list of texts."""
    model = get_embedding_model()
    embeddings = list(model.embed(texts))   # fastembed returns a generator
    return np.array(embeddings, dtype=np.float32)


def generate_single_embedding(text: str) -> np.ndarray:
    """Generate a single embedding vector for a query string."""
    return generate_embeddings([text])[0]

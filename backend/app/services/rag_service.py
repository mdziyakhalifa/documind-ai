#! RAG Service — orchestrates the full Retrieve-Augment-Generate pipeline

from typing import List, Optional, AsyncGenerator
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging

from app.core.config import settings
from app.services.file_parser_service import parse_file
from app.services.embedding_service import generate_embeddings, generate_single_embedding
from app.services.vector_db_service import VectorDBService
from app.services.llm_service import stream_chat

logger = logging.getLogger("documind")

#! Text splitter shared across all ingestion calls
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.CHUNK_SIZE,
    chunk_overlap=settings.CHUNK_OVERLAP,
    separators=["\n\n", "\n", ".", "!", "?", ",", " "],
)


def ingest_document(
    user_id: int,
    document_id: int,
    file_path: str,
    file_type: str,
    filename: str,
) -> int:
    """
    Full ingestion pipeline:
    1. Parse file → raw text pages
    2. Split into chunks
    3. Generate embeddings
    4. Store in FAISS
    Returns total chunk count.
    """
    logger.info(f"Starting ingestion: user={user_id}, doc={document_id}, file={filename}")

    #! Step 1: Parse the file into (text, metadata) pairs
    raw_pages = parse_file(file_path, file_type)

    #! Step 2: Split text into chunks
    all_chunks = []
    all_chunk_meta = []

    for text, page_meta in raw_pages:
        chunks = text_splitter.split_text(text)
        for chunk in chunks:
            if len(chunk.strip()) < 20:  # skip tiny fragments
                continue
            all_chunks.append(chunk)
            all_chunk_meta.append(page_meta)

    if not all_chunks:
        raise ValueError(f"No text could be extracted from {filename}")

    logger.info(f"Split into {len(all_chunks)} chunks")

    #! Step 3: Generate embeddings in batches of 64
    batch_size = 64
    all_embeddings = []
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        embs = generate_embeddings(batch)
        all_embeddings.extend(embs)

    import numpy as np
    embeddings_array = np.array(all_embeddings)

    #! Step 4: Add to the user's FAISS vector store
    vector_db = VectorDBService(user_id)
    doc_meta = {"document_id": document_id, "filename": filename}

    #! Merge page metadata into each chunk's metadata
    enriched_chunks = []
    for chunk, chunk_meta in zip(all_chunks, all_chunk_meta):
        enriched_chunks.append(chunk)
        doc_meta_copy = {**doc_meta, **chunk_meta}

    #! Pass all chunks as one batch
    count = vector_db.add_chunks(all_chunks, embeddings_array, {**doc_meta})
    logger.info(f"Ingestion complete: {count} chunks stored")
    return count


async def query_rag(
    user_id: int,
    query: str,
    chat_history: List[dict],
    document_ids: Optional[List[int]] = None,
) -> AsyncGenerator[str, None]:
    """
    Full RAG query pipeline:
    1. Embed the user query
    2. Retrieve relevant chunks from FAISS
    3. Stream answer from Ollama with context injected

    Yields (token_or_event, sources_or_None) tuples as strings for SSE.
    """
    #! Step 1: Embed the query
    query_embedding = generate_single_embedding(query)

    #! Step 2: Retrieve relevant chunks
    vector_db = VectorDBService(user_id)
    results = vector_db.search(
        query_embedding=query_embedding,
        top_k=settings.TOP_K_RESULTS,
        document_ids=document_ids,
        score_threshold=settings.SIMILARITY_THRESHOLD,
    )

    logger.info(f"Retrieved {len(results)} chunks for query: '{query[:50]}...'")

    #! Step 3: Stream the LLM response
    async for token in stream_chat(query, results, chat_history):
        yield token, results  #! yield tuple so caller can extract sources


async def delete_document_from_index(user_id: int, document_id: int):
    """Remove a document's chunks from the user's FAISS index."""
    vector_db = VectorDBService(user_id)
    vector_db.delete_document(document_id)

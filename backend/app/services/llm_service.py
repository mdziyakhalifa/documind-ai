#! LLM Service — uses Groq's FREE API for fast inference
#! Sign up at: https://console.groq.com  (no credit card needed)
#! Free tier: 14,400 requests/day, 30 req/min

import json
import httpx
from typing import AsyncGenerator, List, Dict
import logging
from app.core.config import settings

logger = logging.getLogger("documind")

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

#! System prompt for the enterprise document assistant persona
SYSTEM_PROMPT = """You are DocuMind, an expert enterprise AI assistant specialized in analyzing company documents.

Rules:
- Answer ONLY based on the provided document context
- Cite source documents when referencing specific information
- If information is not in the context, clearly state that
- Format responses with markdown for readability (headers, bullets, code blocks)
- Be concise yet thorough

Response style:
- Professional and confident
- Use bullet points for lists
- Use **bold** for key terms
- If unsure, say so explicitly"""


def build_messages(query: str, context_chunks: List[Dict], chat_history: List[Dict]) -> List[Dict]:
    """Construct the messages array with injected RAG context."""
    if context_chunks:
        context_text = "\n\n---\n\n".join(
            f"**[{c.get('filename', 'Document')}, Page {c.get('page', 'N/A')}]**\n{c['chunk_text']}"
            for c in context_chunks
        )
        user_content = f"Document context:\n{context_text}\n\n---\n\nQuestion: {query}"
    else:
        user_content = (
            f"Question: {query}\n\n"
            "(No relevant document sections found. Answer based on general knowledge if appropriate, "
            "or let the user know they should upload relevant documents.)"
        )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    #! Include last 8 turns for conversational memory
    for msg in chat_history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_content})
    return messages


async def stream_chat(
    query: str,
    context_chunks: List[Dict],
    chat_history: List[Dict],
) -> AsyncGenerator[str, None]:
    """Stream tokens from Groq API. Yields raw token strings."""
    if not settings.GROQ_API_KEY:
        yield "\n\n⚠️ **GROQ_API_KEY is not set.** Please add it to your environment variables."
        return

    messages = build_messages(query, context_chunks, chat_history)

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "max_tokens": settings.GROQ_MAX_TOKENS,
        "temperature": 0.1,
        "stream": True,
    }

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("POST", GROQ_CHAT_URL, json=payload, headers=headers) as response:
                if response.status_code == 401:
                    yield "\n\n⚠️ **Invalid GROQ_API_KEY.** Get a free key at https://console.groq.com"
                    return
                if response.status_code == 429:
                    yield "\n\n⚠️ **Groq rate limit reached.** Free tier allows 30 req/min. Please wait a moment."
                    return

                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data["choices"][0].get("delta", {})
                        token = delta.get("content", "")
                        if token:
                            yield token
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

    except httpx.ConnectError:
        yield "\n\n⚠️ **Cannot connect to Groq API.** Check your internet connection."
    except Exception as e:
        logger.error(f"Groq streaming error: {e}")
        yield f"\n\n⚠️ LLM error: {str(e)}"


async def check_groq_health() -> bool:
    """Ping Groq API to verify the key and connection are valid."""
    if not settings.GROQ_API_KEY:
        return False
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            )
            return resp.status_code == 200
    except Exception:
        return False

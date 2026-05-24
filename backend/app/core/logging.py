#! Centralized logging configuration for the application

import io
import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    """Configure and return the root application logger."""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # On Windows, sys.stdout uses the system codepage (often cp1252) which
    # cannot encode Unicode characters found in documents (curly quotes, em
    # dashes, etc.).  Wrap the raw buffer in a UTF-8 writer so log output
    # never raises UnicodeEncodeError during PDF ingestion.
    if hasattr(sys.stdout, "buffer"):
        stream = io.TextIOWrapper(
            sys.stdout.buffer,
            encoding="utf-8",
            errors="replace",   # replace unencodable chars with ? rather than crash
            line_buffering=True,
        )
    else:
        stream = sys.stdout

    handler = logging.StreamHandler(stream)
    handler.setFormatter(formatter)

    logger = logging.getLogger("documind")
    logger.setLevel(log_level)
    logger.addHandler(handler)
    logger.propagate = False

    return logger


logger = setup_logging()

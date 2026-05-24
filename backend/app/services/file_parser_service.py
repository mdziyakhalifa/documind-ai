#! File Parser Service — extracts text from PDF, DOCX, TXT, CSV, XLSX files

import io
from pathlib import Path
from typing import List, Tuple
import logging

logger = logging.getLogger("documind")


def _clean_text(text: str) -> str:
    """Remove control characters that can appear in PDFs and cause encoding errors.
    Keeps all valid Unicode (curly quotes, em dashes, accented chars, etc.) — only
    strips ASCII control chars below 0x20 except tab and newline."""
    return "".join(
        c for c in text
        if c >= " " or c in ("\n", "\t")
    )


def parse_pdf(file_path: str) -> List[Tuple[str, dict]]:
    """Extract text from PDF. Returns list of (text, metadata) tuples per page."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        pages = []
        for i, page in enumerate(reader.pages):
            text = _clean_text(page.extract_text() or "")
            if text.strip():
                pages.append((text, {"page": i + 1, "source": Path(file_path).name}))
        return pages
    except Exception as e:
        logger.error(f"PDF parse error: {e}")
        raise


def parse_docx(file_path: str) -> List[Tuple[str, dict]]:
    """Extract text from DOCX files paragraph by paragraph."""
    try:
        from docx import Document
        doc = Document(file_path)
        full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return [(full_text, {"source": Path(file_path).name})]
    except Exception as e:
        logger.error(f"DOCX parse error for {file_path}: {e}")
        raise


def parse_txt(file_path: str) -> List[Tuple[str, dict]]:
    """Read plain text files."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return [(text, {"source": Path(file_path).name})]
    except Exception as e:
        logger.error(f"TXT parse error for {file_path}: {e}")
        raise


def parse_csv(file_path: str) -> List[Tuple[str, dict]]:
    """Convert CSV rows to readable text representation."""
    try:
        import pandas as pd
        df = pd.read_csv(file_path)
        #! Convert dataframe to a text format that the LLM can understand
        text = f"CSV file with {len(df)} rows and {len(df.columns)} columns.\n"
        text += f"Columns: {', '.join(df.columns.tolist())}\n\n"
        text += df.to_string(index=False)
        return [(text, {"source": Path(file_path).name, "rows": len(df)})]
    except Exception as e:
        logger.error(f"CSV parse error for {file_path}: {e}")
        raise


def parse_xlsx(file_path: str) -> List[Tuple[str, dict]]:
    """Convert Excel sheets to readable text."""
    try:
        import pandas as pd
        xl = pd.ExcelFile(file_path)
        pages = []
        for sheet_name in xl.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            text = f"Sheet: {sheet_name} | {len(df)} rows, {len(df.columns)} columns.\n"
            text += f"Columns: {', '.join(str(c) for c in df.columns.tolist())}\n\n"
            text += df.to_string(index=False)
            pages.append((text, {"source": Path(file_path).name, "sheet": sheet_name}))
        return pages
    except Exception as e:
        logger.error(f"XLSX parse error for {file_path}: {e}")
        raise


def parse_file(file_path: str, file_type: str) -> List[Tuple[str, dict]]:
    """Dispatch to the correct parser based on file extension."""
    parsers = {
        "pdf": parse_pdf,
        "docx": parse_docx,
        "txt": parse_txt,
        "csv": parse_csv,
        "xlsx": parse_xlsx,
    }
    parser = parsers.get(file_type.lower())
    if not parser:
        raise ValueError(f"Unsupported file type: {file_type}")
    return parser(file_path)

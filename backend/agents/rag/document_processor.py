"""
Document Processor for RAG-based Personalized Interviews

Handles:
- Document parsing (PDF, DOCX, TXT)
- Text chunking for RAG
- Content summarization
"""

import hashlib
import re
from typing import List, Dict, Tuple
import os

# Optional imports - gracefully handle missing packages
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

try:
    from docx import Document as DocxDocument
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


# Chunking configuration
DEFAULT_CHUNK_SIZE = 1000  # characters
DEFAULT_CHUNK_OVERLAP = 200  # characters


def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text content from a PDF file."""
    if not HAS_PYPDF2:
        raise ImportError("PyPDF2 is required for PDF processing. Install with: pip install PyPDF2")

    text = ""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        raise

    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    """Extracts text content from a DOCX file."""
    if not HAS_DOCX:
        raise ImportError("python-docx is required for DOCX processing. Install with: pip install python-docx")

    try:
        doc = DocxDocument(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        raise


def extract_text_from_txt(file_path: str) -> str:
    """Extracts text content from a TXT file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin-1') as file:
            return file.read().strip()


def extract_text(file_path: str, file_type: str = None) -> str:
    """
    Extracts text from a file based on its type.

    Args:
        file_path: Path to the file
        file_type: Optional file type override ('pdf', 'docx', 'txt')

    Returns:
        Extracted text content
    """
    if not file_type:
        _, ext = os.path.splitext(file_path)
        file_type = ext.lower().lstrip('.')

    extractors = {
        'pdf': extract_text_from_pdf,
        'docx': extract_text_from_docx,
        'doc': extract_text_from_docx,
        'txt': extract_text_from_txt,
        'text': extract_text_from_txt,
    }

    extractor = extractors.get(file_type)
    if not extractor:
        raise ValueError(f"Unsupported file type: {file_type}")

    return extractor(file_path)


def clean_text(text: str) -> str:
    """Cleans and normalizes extracted text."""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep punctuation
    text = re.sub(r'[^\w\s.,;:!?\'"-]', '', text)
    # Fix multiple periods
    text = re.sub(r'\.{2,}', '.', text)
    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
) -> List[Dict]:
    """
    Splits text into overlapping chunks for RAG processing.

    Args:
        text: The text to chunk
        chunk_size: Maximum characters per chunk
        chunk_overlap: Number of overlapping characters between chunks

    Returns:
        List of chunk dictionaries with index and text
    """
    if not text:
        return []

    # Clean the text first
    text = clean_text(text)

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(text):
        # Find the end of this chunk
        end = start + chunk_size

        # Try to break at sentence boundary
        if end < len(text):
            # Look for sentence endings near the chunk boundary
            sentence_end = text.rfind('. ', start + chunk_size - 100, end + 100)
            if sentence_end > start:
                end = sentence_end + 1

        chunk_text = text[start:end].strip()

        if chunk_text:
            chunks.append({
                'index': chunk_index,
                'text': chunk_text,
                'start_char': start,
                'end_char': end,
                'tokens': len(chunk_text.split())  # Approximate token count
            })
            chunk_index += 1

        # Move start position with overlap
        start = end - chunk_overlap
        if start <= 0 or end >= len(text):
            break

    return chunks


def compute_document_hash(content: str) -> str:
    """Computes a hash of document content for deduplication."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]


def extract_key_topics(text: str, max_topics: int = 10) -> List[str]:
    """
    Extracts key topics/keywords from text.
    Uses simple frequency analysis without external NLP libraries.
    """
    # Common stop words to filter out
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
        'this', 'that', 'these', 'those', 'it', 'its', 'as', 'if', 'when', 'than',
        'so', 'can', 'just', 'our', 'your', 'their', 'we', 'they', 'i', 'you', 'he',
        'she', 'who', 'which', 'what', 'where', 'how', 'all', 'each', 'every',
        'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'same',
        'then', 'now', 'also', 'well', 'very', 'not', 'no', 'any', 'my'
    }

    # Tokenize and filter
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    filtered = [w for w in words if w not in stop_words]

    # Count frequencies
    freq = {}
    for word in filtered:
        freq[word] = freq.get(word, 0) + 1

    # Sort by frequency and return top topics
    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, count in sorted_words[:max_topics]]


def process_document(
    file_path: str = None,
    text_content: str = None,
    file_type: str = None,
    source_name: str = None
) -> Dict:
    """
    Main function to process a document for RAG.

    Args:
        file_path: Path to the document file
        text_content: Direct text content (alternative to file_path)
        file_type: Type of file ('pdf', 'docx', 'txt', 'text')
        source_name: Name to identify the source

    Returns:
        Dict with chunks, topics, hash, and metadata
    """
    if file_path:
        text = extract_text(file_path, file_type)
        source_name = source_name or os.path.basename(file_path)
        source_type = file_type or os.path.splitext(file_path)[1].lstrip('.')
    elif text_content:
        text = text_content
        source_name = source_name or 'Direct Input'
        source_type = 'text'
    else:
        raise ValueError("Either file_path or text_content must be provided")

    if not text:
        raise ValueError("No text content extracted from document")

    # Process the document
    chunks = chunk_text(text)
    topics = extract_key_topics(text)
    doc_hash = compute_document_hash(text)

    return {
        'source_name': source_name,
        'source_type': source_type,
        'source_hash': doc_hash,
        'total_characters': len(text),
        'total_chunks': len(chunks),
        'chunks': chunks,
        'key_topics': topics,
        'preview': text[:500] + '...' if len(text) > 500 else text
    }

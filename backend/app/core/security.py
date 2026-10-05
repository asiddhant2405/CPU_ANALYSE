"""
Security and validation utilities.
Enforces execution constraints, input validation, and secure process sandboxing boundaries.
"""

import os
import shutil
import tempfile
import re
from typing import List, Tuple
from fastapi import HTTPException

MAX_SOURCE_SIZE_BYTES = 65536  # 64 KB
MAX_OUTPUT_SIZE_CHARS = 32768  # 32 KB per stream
ALLOWED_LANGUAGES = {"python", "c", "cpp"}
ALLOWED_COMPILER_FLAGS = {
    "-O0", "-O1", "-O2", "-O3", "-Os", "-Ofast",
    "-Wall", "-Wextra", "-std=c99", "-std=c11", "-std=c++11", "-std=c++14", "-std=c++17",
    "-lm"
}


def validate_source_code(source_code: str, language: str) -> None:
    """Validate source code size and language."""
    if not source_code or not source_code.strip():
        raise HTTPException(status_code=400, detail="Source code cannot be empty.")
    
    encoded_len = len(source_code.encode("utf-8"))
    if encoded_len > MAX_SOURCE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Source code exceeds maximum allowed size of {MAX_SOURCE_SIZE_BYTES} bytes."
        )

    if language not in ALLOWED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{language}'. Supported languages: {list(ALLOWED_LANGUAGES)}"
        )


def sanitize_compiler_flags(flags: List[str]) -> List[str]:
    """Ensure compiler flags are safe and strictly whitelisted."""
    sanitized = []
    for flag in flags:
        flag = flag.strip()
        if flag in ALLOWED_COMPILER_FLAGS:
            sanitized.append(flag)
        elif re.match(r"^-O[0-3]$", flag):
            sanitized.append(flag)
    return sanitized


def truncate_output(text: str, max_chars: int = MAX_OUTPUT_SIZE_CHARS) -> str:
    """Truncate execution output to prevent memory exhaustion."""
    if len(text) > max_chars:
        return text[:max_chars] + f"\n... [Output truncated to {max_chars} characters]"
    return text


class SecureExecutionDirectory:
    """Context manager for temporary benchmark execution directory with guaranteed cleanup."""

    def __init__(self, prefix: str = "cpu_bench_"):
        self.prefix = prefix
        self.path = None

    def __enter__(self) -> str:
        self.path = tempfile.mkdtemp(prefix=self.prefix)
        return self.path

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.path and os.path.exists(self.path):
            try:
                shutil.rmtree(self.path, ignore_errors=True)
            except Exception:
                pass

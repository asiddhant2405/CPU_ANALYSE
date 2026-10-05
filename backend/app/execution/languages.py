"""
Language specifications and runner configurations.
"""

import sys
import shutil
from typing import Dict, Any, List

LANGUAGE_CONFIGS: Dict[str, Dict[str, Any]] = {
    "python": {
        "name": "Python",
        "extension": ".py",
        "is_compiled": False,
        "default_compiler_flags": [],
        "command_generator": lambda binary_or_script, args: [sys.executable, "-u", binary_or_script] + (args or []),
    },
    "c": {
        "name": "C",
        "extension": ".c",
        "is_compiled": True,
        "compiler_binary": "gcc",
        "default_compiler_flags": ["-O2", "-std=c11", "-Wall"],
        "command_generator": lambda binary_or_script, args: [binary_or_script] + (args or []),
    },
    "cpp": {
        "name": "C++",
        "extension": ".cpp",
        "is_compiled": True,
        "compiler_binary": "g++",
        "default_compiler_flags": ["-O2", "-std=c++14", "-Wall"],
        "command_generator": lambda binary_or_script, args: [binary_or_script] + (args or []),
    },
}


def get_language_config(language: str) -> Dict[str, Any]:
    """Retrieve configuration for a given language."""
    cfg = LANGUAGE_CONFIGS.get(language.lower())
    if not cfg:
        raise ValueError(f"Unsupported language: {language}")
    return cfg


def is_language_available(language: str) -> bool:
    """Check if the compiler/interpreter for the language is available on this system."""
    if language == "python":
        return True
    cfg = LANGUAGE_CONFIGS.get(language)
    if not cfg:
        return False
    if cfg["is_compiled"]:
        return shutil.which(cfg["compiler_binary"]) is not None
    return True

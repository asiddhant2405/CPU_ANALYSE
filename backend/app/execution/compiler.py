"""
Compiler service for compiled languages (C and C++).
Safely orchestrates compilation, timing, and artifact generation.
"""

import os
import time
import subprocess
import platform
from typing import List, Optional
from app.models.schemas import CompilationResult
from app.execution.languages import get_language_config
from app.core.security import sanitize_compiler_flags, truncate_output


def compile_source(
    language: str,
    source_code: str,
    workspace_dir: str,
    implementation_name: str,
    custom_flags: Optional[List[str]] = None,
    timeout_seconds: float = 15.0,
) -> CompilationResult:
    """
    Compile source code inside the designated workspace directory.
    Uses shell=False, captures stdout/stderr, and returns detailed timing and status.
    """
    cfg = get_language_config(language)
    if not cfg["is_compiled"]:
        # Interpreted language does not require separate compilation
        script_path = os.path.join(workspace_dir, f"main{cfg['extension']}")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(source_code)
        return CompilationResult(
            implementation_name=implementation_name,
            language=language,
            success=True,
            compilation_time_ms=0.0,
            compiler_output="Interpreted language; no compilation step required.",
            compiler_flags=[],
            binary_path=script_path,
        )

    # Prepare paths
    src_filename = f"source{cfg['extension']}"
    src_path = os.path.join(workspace_dir, src_filename)
    exe_suffix = ".exe" if platform.system() == "Windows" else ""
    out_filename = f"binary_{abs(hash(implementation_name))}{exe_suffix}"
    out_path = os.path.join(workspace_dir, out_filename)

    with open(src_path, "w", encoding="utf-8") as f:
        f.write(source_code)

    flags = custom_flags if custom_flags else cfg["default_compiler_flags"]
    sanitized_flags = sanitize_compiler_flags(flags)
    compiler_bin = cfg["compiler_binary"]

    # Command array: e.g. ["gcc", "source.c", "-O2", "-std=c11", "-Wall", "-o", "binary.exe"]
    cmd = [compiler_bin, src_path] + sanitized_flags + ["-o", out_path]

    start_ns = time.perf_counter_ns()
    try:
        proc = subprocess.run(
            cmd,
            cwd=workspace_dir,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            shell=False,
        )
        end_ns = time.perf_counter_ns()
        comp_time_ms = round((end_ns - start_ns) / 1_000_000.0, 3)

        compiler_output = truncate_output((proc.stdout + "\n" + proc.stderr).strip())
        success = proc.returncode == 0 and os.path.exists(out_path)

        return CompilationResult(
            implementation_name=implementation_name,
            language=language,
            success=success,
            compilation_time_ms=comp_time_ms,
            compiler_output=compiler_output or "Compilation succeeded with no warnings.",
            compiler_flags=sanitized_flags,
            binary_path=out_path if success else None,
        )

    except subprocess.TimeoutExpired:
        end_ns = time.perf_counter_ns()
        comp_time_ms = round((end_ns - start_ns) / 1_000_000.0, 3)
        return CompilationResult(
            implementation_name=implementation_name,
            language=language,
            success=False,
            compilation_time_ms=comp_time_ms,
            compiler_output=f"Compilation timed out after {timeout_seconds} seconds.",
            compiler_flags=sanitized_flags,
            binary_path=None,
        )
    except Exception as e:
        end_ns = time.perf_counter_ns()
        comp_time_ms = round((end_ns - start_ns) / 1_000_000.0, 3)
        return CompilationResult(
            implementation_name=implementation_name,
            language=language,
            success=False,
            compilation_time_ms=comp_time_ms,
            compiler_output=f"Failed to execute compiler: {str(e)}",
            compiler_flags=sanitized_flags,
            binary_path=None,
        )

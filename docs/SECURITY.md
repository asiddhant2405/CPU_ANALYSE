# Security Architecture & Execution Safety

## 1. Threat Model & Execution Assumptions

The **CPU Energy Efficiency Analyzer** is designed as a local-first engineering and educational benchmarking tool. Because the system compiles and executes C/C++ source code and Python scripts, security is treated as a foundational requirement:

```
[ User Input Source Code ]
           │
           ▼
[ Parameter Validation & Sanitization ] ──> (Rejects shell characters, invalid types)
           │
           ▼
[ Compiler Flag Whitelist ]            ──> (Blocks arbitrary linker scripts, file redirection)
           │
           ▼
[ Isolated Temporary Workspace ]       ──> (Unique UUID folder, non-persistent)
           │
           ▼
[ Subprocess Runner (shell=False) ]    ──> (Hard Timeout, Bounded Output Capture)
           │
           ▼
[ Automatic Workspace Cleanup ]        ──> (Directory purged immediately)
```

---

## 2. Process Isolation vs Containerization

### Honest Disclosure on Container Sandboxing:
- **Docker Status:** Docker is **NOT installed** on the host development machine.
- **Strict Policy:** The application **does NOT claim to run inside a secure container sandbox**.
- **Isolation Mode:** The system operates under `restricted_local_subprocess` mode. Subprocesses run with the privileges of the active local user account.
- **Safety Warning:** Benchmark programs are restricted to reviewed, preconfigured workloads by default. Users should only execute code from trusted sources.

---

## 3. Defense-in-Depth Mechanisms

### 1. Direct Execution via Argument Arrays (`shell=False`)
All compiler invocations (`gcc`, `g++`) and program runners avoid shell interpreters:
```python
# Safe invocation: No command-line interpolation or shell interpretation
subprocess.run(
    [compiler_bin, src_path] + sanitized_flags + ["-o", out_path],
    cwd=workspace_dir,
    capture_output=True,
    text=True,
    timeout=timeout_seconds,
    shell=False,
)
```
This guarantees immunity against classic shell injection attacks (such as `; rm -rf /` or `&& calc.exe`).

### 2. Compiler Flag Whitelisting
Users or preset tasks can supply compiler flags (e.g. `-O0`, `-O2`, `-std=c11`). However, all flags are passed through a strict regex whitelist in `backend/app/core/security.py`:
- Allowed: `-O0`, `-O1`, `-O2`, `-O3`, `-Os`, `-Ofast`, `-std=c11`, `-std=c99`, `-std=c++11`, `-std=c++14`, `-Wall`, `-Wextra`, `-march=*`, `-mtune=*`, `-fverbose-asm`.
- Disallowed: Any flag containing path traversal (`/`, `\`), file outputs (`-o`), include paths (`-I`), library paths (`-L`), or linker directives (`-Wl`).

### 3. Hard Execution Timeouts
Every subprocess execution is wrapped with a strict timeout limit (configurable between 0.5 and 60.0 seconds, default 10.0s). If a program contains an infinite loop (e.g. `while(1);`), the runner terminates the process group via `subprocess.TimeoutExpired`, marking the run as timed out without crashing the API backend.

### 4. Bounded Output Capture
To prevent Denial of Service (DoS) attacks via memory exhaustion caused by infinite output loops (e.g. `while(1) printf("spam");`), standard output and standard error capture is capped at **16,384 bytes (16 KB)**. Any excess output is safely truncated with a disclosure notice.

### 5. Ephemeral Workspace Isolation
All source files and compiled binaries are written to a uniquely generated temporary directory inside the system temp path:
```python
workspace_dir = tempfile.mkdtemp(prefix="cpu_bench_")
try:
    # compilation and execution
finally:
    shutil.rmtree(workspace_dir, ignore_errors=True)
```
The temporary directory is purged in a `finally` block upon completion, leaving no lingering executable binaries on disk.

# CPU Energy Efficiency Analyzer: Understanding the Hidden Cost of Program Execution

> **Tagline:** *Same output. Different implementations. Different computational costs.*

An academic systems engineering, benchmarking, and visualization platform designed for second-year B.Tech Computer Science students studying **Computer Organization and Architecture (COA)**.

---

## 1. Project Overview & Research Question

In computer systems engineering, functional correctness is only half the story. Two distinct implementations can solve the exact same mathematical problem and produce the exact same output, yet impose vastly different computational, architectural, and energy burdens on the physical processor.

### Core Research Question:
> *How do different algorithms, instruction-execution patterns, memory-access patterns, and CPU architecture characteristics affect execution time, processor workload, and energy consumption?*

The **CPU Energy Efficiency Analyzer** provides an empirical, reproducible benchmarking and educational environment to explore this reality through:
1. **Four Core COA Experiments:**
   - **Experiment A:** Integer Summation — Iterative Loop $O(N)$ vs Gauss Formula $O(1)$.
   - **Experiment B:** Memory Access & Cache Locality — Sequential Stride 1 vs Strided Stride 4/16 across a 16 MB array.
   - **Experiment C:** Compiler Optimization Levels — Polynomial Accumulator under `-O0` vs `-O2`.
   - **Experiment D:** CPU-Bound vs Memory-Bound Workloads — Pure register ALU math vs memory-intensive table lookups.
2. **Correctness Verification:** Programmatic validation that compared implementations produce mathematically equivalent output before comparing speedup or performance.
3. **Assembly & Opcode Disassembly:** Native MinGW GCC disassembly (`gcc -S -fverbose-asm`) with opcode classification (ALU, Data Transfer, Control Transfer, Comparison) and static vs dynamic instruction analysis.
4. **Memory & Cache Hierarchy Lab:** Interactive 64-byte cache line simulator with variable stride slider ($1 \dots 64$), memory latency pyramid, and spatial locality metrics.
5. **CPU Performance Equation Simulator:** Interactive sliders for Instruction Count ($IC$), CPI, and Clock Frequency ($f_{\text{GHz}}$) calculating execution time.
6. **5-Stage CPU Pipeline Hazard Simulator:** Interactive IF, ID, EX, MEM, WB cycle stepping with Structural, RAW Data (with and without Forwarding), and Control Branch penalties.
7. **Transparent Energy Accounting:** Grounded reporting of hardware energy counters (Intel RAPL) where supported by the OS (Linux `/sys/class/powercap`), with honest disclosure when unavailable (Windows user-space) and an optional educational TDP-activity scaling model.
8. **Academic Presentation Mode:** Dedicated slide tour for faculty evaluation panels with full keyboard navigation and an interactive 21-question viva preparation guide.

---

## 2. Environment Capability Audit (Host Machine)

An automated hardware and software capability audit was performed on the host development machine:
- **Operating System:** Microsoft Windows 11 Home 64-bit (NT 10.0.26200, AMD64)
- **Processor:** 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz (Tiger Lake microarchitecture)
- **Cores & Threads:** 4 Physical Cores, 8 Logical Processors
- **Memory:** 16.0 GB Total RAM (~8.15 GB available)
- **Python Runtime:** Python 3.14.0 (with FastAPI, Uvicorn, Pydantic v2, psutil, pytest, anyio)
- **C/C++ Compilers:** MinGW.org GCC 6.3.0 & G++ 6.3.0
- **Node.js & npm:** Node.js v24.14.1 & npm 11.11.0
- **Hardware Energy Telemetry:** Linux RAPL counters require `/sys/class/powercap/intel-rapl` or a ring-0 kernel driver on Windows. Therefore, physical hardware energy is **honestly reported as unavailable** on this Windows host, with process-level telemetry and an uncalibrated educational TDP model supported.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Bundler & Tooling:** Vite 6
- **Styling:** Tailwind CSS (Dark-first technical dashboard aesthetic)
- **Charts & Telemetry:** Recharts (responsive bar and line charts)
- **Icons:** Lucide React

### Backend
- **Framework:** Python 3.14 with FastAPI
- **ASGI Server:** Uvicorn
- **Validation:** Pydantic v2 models
- **System Telemetry:** `psutil` and `time.perf_counter_ns()`
- **Persistence:** SQLite (`backend/app/storage/benchmarks.db`)
- **Testing:** `pytest` (23/23 tests passing)

---

## 4. Quick Startup Instructions

### Option A: Unified 1-Click Launch (Windows)
Double-click `start.bat` in the root repository folder, or run:
```cmd
start.bat
```
*(This launches the backend API on port 8000 and the frontend dev server on port 5173 in dedicated windows.)*

### Option B: Manual Launch

#### 1. Start the Backend API:
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

#### 2. Start the Frontend UI:
```cmd
cd frontend
npm run dev
```
- Frontend Web App: `http://127.0.0.1:5173`

---

## 5. Automated Test Suite

The test suite validates input parsing, security boundaries, compiler error handling, timeouts, statistical algorithms, equivalence verification, assembly disassembly, and REST endpoints:

```powershell
cd backend
python -m pytest tests/ -v
```

### Test Results:
- **Total Tests:** 23
- **Passed:** 23 (100%)
- **Failed:** 0
- **Duration:** ~14.4s

### Frontend Build Validation:
```cmd
cd frontend
npm run build
```
- **TypeScript (`tsc`):** 0 errors
- **Vite Production Build:** Successfully compiled and minified bundle.

---

## 6. Complete Documentation Index

For complete academic, architectural, and evaluation details, consult the documentation suite in `docs/`:

1. [`docs/ARCHITECTURE.md`](file:///c:/Users/asidd/Desktop/Coding/antigravity/CPU_ANALYSE/docs/ARCHITECTURE.md) — System design, directory structure, and component responsibilities.
2. [`docs/COA_CONCEPTS.md`](file:///c:/Users/asidd/Desktop/Coding/antigravity/CPU_ANALYSE/docs/COA_CONCEPTS.md) — In-depth explanations of all COA principles demonstrated.
3. [`docs/METHODOLOGY.md`](file:///c:/Users/asidd/Desktop/Coding/antigravity/CPU_ANALYSE/docs/METHODOLOGY.md) — High-res timing, warm-up protocol, statistical methods, and metric provenance.
4. [`docs/EXPERIMENTS.md`](file:///c:/Users/asidd/Desktop/Coding/antigravity/CPU_ANALYSE/docs/EXPERIMENTS.md) — Protocols, hypotheses, C source code, and interpretations for Experiments A, B, C, and D.
5. [`docs/TESTING.md`](file:///c:/Users/asidd/Desktop/Coding/antigravity/CPU_ANALYSE/docs/TESTING.md) — Test environment, test commands, coverage table, and validation results.
6. [`docs/SECURITY.md`](file:///c:/Users/asidd/Desktop/Coding/antigravity/CPU_ANALYSE/docs/SECURITY.md) — Subprocess execution safety, flag whitelisting, timeouts, and sandboxing disclosures.
7. [`docs/VIVA_GUIDE.md`](file:///c:/Users/asidd/Desktop/Coding/antigravity/CPU_ANALYSE/docs/VIVA_GUIDE.md) — 21 comprehensive viva voce questions and answers prepared for the faculty evaluation panel.

# Application Architecture & Component Responsibilities

## 1. System Overview

The **CPU Energy Efficiency Analyzer** is built as a modular, local-first engineering platform designed for Computer Organization and Architecture (COA) education and experimentation. It follows a decoupled client-server architecture:

```
+-----------------------------------------------------------------------------------+
|                           FRONTEND (React 18 + Vite)                             |
|  - Dashboard: Real Hardware Telemetry, CPU Model, OS, Capabilities                |
|  - Experiment Lab: 4 COA Benchmarks, C/C++/Python, Optimization Presets           |
|  - Comparison Lab: Speedup, Statistical Variability, Output Verification          |
|  - Memory & Cache Lab: 64-Byte Line Stride Simulator, Hierarchy Pyramid           |
|  - Energy Analysis: Power (W) vs Energy (J), CMOS Physics, Windows Disclosures    |
|  - Architecture Explorer: CPU Equation Calculator, 5-Stage Pipeline Hazard Sim   |
|  - Presentation Mode: Guided Slide Deck for Viva with 21+ Curated Questions        |
+-----------------------------------------------------------------------------------+
                                         │  HTTP / REST (JSON)
                                         ▼
+-----------------------------------------------------------------------------------+
|                           BACKEND API (FastAPI + Python)                          |
|  - routes.py: Endpoints for Benchmarks, Telemetry, Disassembly, Exports          |
|  - core/system_capabilities.py: Hardware Detection (Cores, Freq, RAM, GCC)        |
|  - core/security.py: Parameter Sanitization, Flag Whitelisting, Output Bounding   |
|  - storage/database.py: Local SQLite Persistence (benchmarks.db)                  |
+-----------------------------------------------------------------------------------+
             │                                              │
             ▼                                              ▼
+-----------------------------+               +-----------------------------+
|    COMPILATION & DISASSEMBLY |               |      BENCHMARK ENGINE       |
|  - execution/compiler.py    |               |  - orchestrator.py          |
|  - execution/assembly.py    |               |  - measurement/manager.py   |
|  - MinGW GCC 6.3.0 (-S)     |               |  - runner.py (Subprocess)   |
|  - CPython Bytecode dis     |               |  - High-res perf_counter_ns |
+-----------------------------+               +-----------------------------+
             │                                              │
             └──────────────────────┬───────────────────────┘
                                    ▼
+-----------------------------------------------------------------------------------+
|                        ANALYSIS & SYNTHESIS PIPELINE                              |
|  - analysis/statistics.py: Median, IQR, Mean, Min/Max, StdDev                     |
|  - analysis/static_analyzer.py: AST Inspection (Loops, Complexity, Branches)      |
|  - analysis/comparison.py: Output Equivalence Check, Speedup Calculation          |
|  - analysis/insights_generator.py: 10-Point Rule-Based Architecture Insights      |
|  - export/exporter.py: CSV, JSON, and Standalone Print-Ready HTML Reports         |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Structure and Module Responsibilities

### `backend/app/`
- **`core/system_capabilities.py`**: Queries host CPU information via `platform`, `psutil`, and compiler binaries (`gcc`, `g++`). Probes hardware energy interfaces and detects operating system environment.
- **`core/security.py`**: Enforces strict execution safety by whitelisting compiler arguments (preventing shell injection like `-o /dev/...` or arbitrary linker flags), bounding stdout/stderr capture to 16 KB, and validating parameter types.
- **`execution/compiler.py`**: Compiles C and C++ source code into native executables in temporary workspace directories using `subprocess.run(shell=False)`. Measures separate compilation latency.
- **`execution/assembly.py`**: Invokes `gcc -S -fverbose-asm` to extract native x86 machine assembly code. Categorizes opcodes into ALU, Data Transfer, Control Transfer, and Comparison instructions, calculating static instruction counts and explaining compile-time transformations.
- **`execution/runner.py`**: Executes native binaries or Python scripts under controlled conditions, enforcing hard execution timeouts (`timeout_seconds`), capturing return codes, and recording standard output for verification.
- **`measurement/manager.py`**: Collects execution metrics per trial. Employs monotonic `time.perf_counter_ns()`, samples process CPU times, tracks peak resident set memory (RSS), and checks hardware energy providers.
- **`benchmark/sample_tasks.py`**: Contains the four core mathematically verified COA experiments with C, C++, and Python implementations.
- **`benchmark/orchestrator.py`**: Coordinates multi-trial benchmark execution: separates warm-up runs from measured trials, aggregates statistics, verifies output equivalence, calls comparison synthesis, and persists records.
- **`analysis/insights_generator.py`**: Generates curriculum-aligned 10-point Architecture Insights detailing what the experiment investigated, which COA concepts apply, and strictly delineating "What this proves / What this does not prove".
- **`storage/database.py`**: Manages local SQLite relational persistence in `backend/app/storage/benchmarks.db` with schema serialization.
- **`export/exporter.py`**: Exports completed benchmark sessions into machine-readable CSV, JSON, and self-contained HTML evaluation reports suitable for faculty submission.

---

## 3. Frontend Architecture

### `frontend/src/`
- **`components/Navbar.tsx`**: Top navigation header providing direct access to all 8 core analysis modules plus the highlighted **Presentation Mode**.
- **`components/AssemblyViewer.tsx`**: Interactive machine instruction inspector with opcode category filtering (ALU, Data Transfer, Control, Comparison) and architectural commentary.
- **`components/ArchitectureInsightsCard.tsx`**: 10-point viva evaluation card displaying objective, variables, relevant COA concepts, microarchitectural mechanisms, and explicit "What this proves / What this does not prove" callouts.
- **`pages/DashboardPage.tsx`**: Main overview reporting detected hardware specifications, telemetry status, quick-start experiment links, and performance equation summary.
- **`pages/WorkbenchPage.tsx`**: Interactive experiment laboratory allowing selection of 4 COA experiments, C/C++/Python runtimes, compiler optimization flags (`-O0`, `-O2`, `-O3`), warm-up/repetition counts, and real-time execution progress.
- **`pages/ComparisonPage.tsx`**: Side-by-side comparative analysis of execution times, trial variability distributions, speedup factors, memory footprints, and assembly comparisons.
- **`pages/MemoryCachePage.tsx`**: Memory hierarchy lab featuring an interactive 64-byte cache line simulator with variable strides ($1 \dots 64$), memory pyramid latencies, and spatial locality analysis.
- **`pages/EnergyPage.tsx`**: Comprehensive energy and power analysis explaining CMOS dynamic power physics ($P = \alpha C V^2 f$), why faster does not always mean lower energy, and honest Windows user-space RAPL disclosures.
- **`pages/ArchitectureExplorerPage.tsx`**: Microarchitectural simulator with an interactive CPU Performance Equation calculator, a 5-stage pipeline hazard simulator (IF, ID, EX, MEM, WB) with cycle stepping, and an ALU dataflow schematic.
- **`pages/PresentationMode.tsx`**: Guided slide tour for college evaluation panels with full keyboard navigation and an interactive 21-question viva preparation guide.
- **`pages/HistoryPage.tsx`**: Historical experiment browser with filtering, trial inspection, and export triggers.
- **`pages/MethodologyPage.tsx`**: In-depth academic methodology documentation explaining timing sources, statistical formulas, and measurement limitations.

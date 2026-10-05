# Scientific Measurement Methodology — CPU Energy Efficiency Analyzer

This document defines the scientific measurement principles, hardware counter mechanisms, mathematical formulas, and experimental disclosures used throughout the **CPU Energy Efficiency Analyzer**.

---

## 1. Wall-Clock Monotonic Timing

### 1.1 Timer Mechanism
All trial execution durations are measured using Python's `time.perf_counter_ns()`:
- Provides a monotonic clock that cannot be set backwards and is immune to NTP time synchronizations.
- Operates at nanosecond resolution, queried immediately before process creation and immediately after child process exit.

### 1.2 Isolation of Compilation from Execution
Compilation time for compiled languages (C and C++) is strictly measured as an isolated pre-execution phase. Compilation latency is recorded in the metadata but is **never** added to the execution latency of benchmark trials.

---

## 2. Warm-Up Repetitions & Statistical Summarization

### 2.1 Why Warm-Up Runs are Mandatory
Modern computer architectures rely on aggressive caching and speculative execution:
1. **Instruction Cache (L1I) and Data Cache (L1D/L2/L3):** Initial executions incur cold-cache misses while lines are brought into cache from main memory.
2. **Translation Lookaside Buffer (TLB):** Virtual-to-physical memory page mappings must be established during the initial page faults.
3. **Interpreter / JIT Warm-Up:** Runtimes (such as Python) initialize internal bytecodes, modules, and memory allocators on first execution.

Warm-up runs (typically 1 to 2 trials) are recorded separately and are **excluded** from summary statistics.

### 2.2 Why Medians are Preferred Over Means
On multitasking operating systems (Windows, Linux), background daemons, system interrupts (DPCs/ISRs), and context switches create sporadic, positive latency spikes.
- **Arithmetic Mean:** Highly sensitive to outlier spikes caused by background OS activity.
- **Median:** Represents the true 50th percentile central tendency of program latency.
- **Interquartile Range (IQR):** Measures spread ($Q_3 - Q_1$), reflecting the variability of the middle 50% of runs.

---

## 3. Process CPU & Memory Accounting

### 3.1 Resident Set Size (Peak RSS)
Memory consumption is measured via `psutil.Process.memory_info().rss`:
- Reports **Resident Set Size (RSS)**: the non-swapped physical RAM currently allocated to the process.
- Does **not** confuse virtual memory allocation (`vms`) with physical memory consumption.
- Tracks the peak RSS observed across sampling intervals during execution.

### 3.2 Sampled Process CPU Utilization
Sampled periodically during active execution:
- Represents the percentage of a single CPU core utilized by the process during its active timeslice.
- On multi-core systems, multi-threaded processes can exceed 100% utilization.

---

## 4. Hardware Energy Measurement (Intel/AMD RAPL)

### 4.1 RAPL Architecture
Intel and AMD processors feature Running Average Power Limit (RAPL) circuitry. RAPL uses hardware energy status Model-Specific Registers (MSRs) accumulated by on-die energy sensors:
- **`MSR_PKG_ENERGY_STATUS`:** Measures total socket/package energy consumption (all cores, memory controller, and uncore).
- **`MSR_PP0_ENERGY_STATUS`:** Measures power plane 0 (CPU execution cores).
- **`MSR_DRAM_ENERGY_STATUS`:** Measures DRAM memory controller power (on supported server platforms).

### 4.2 Linux Powercap Interface
On Linux, the kernel exposes RAPL registers through `/sys/class/powercap/intel-rapl/`:
- Energy is reported in microjoules (`energy_uj`).
- Counter wraparound is handled via `max_energy_range_uj`:
  $$\Delta E = \begin{cases} E_{\text{end}} - E_{\text{start}}, & \text{if } E_{\text{end}} \ge E_{\text{start}} \\ (E_{\text{max}} - E_{\text{start}}) + E_{\text{end}}, & \text{otherwise} \end{cases}$$
- Energy in Joules: $E_{\text{Joules}} = \frac{\Delta E_{\text{uJ}}}{1{,}000{,}000}$.

### 4.3 Why Hardware Energy Counters are Unavailable on Windows
Microsoft Windows does not provide an unprivileged user-mode API for reading Intel RAPL MSRs. Accessing MSRs on Windows requires a signed, kernel-mode device driver operating in ring 0 (such as Intel PCM or WinRing0).
In compliance with Rule 5, 6, and 7, our system:
- **Never fabricates hardware energy readings.**
- Honestly reports: *"Hardware energy counters are unavailable on Windows without ring-0 kernel driver permissions."*

---

## 5. Educational Modeled Energy Estimation (TDP Activity Model)

When native hardware energy telemetry is absent, an optional educational model can be enabled in settings:

### 5.1 Mathematical Model
$$P_{\text{active}} = P_{\text{idle}} + (P_{\text{tdp}} - P_{\text{idle}}) \times \left( \frac{\text{CPU}_{\%}}{100} \right)$$
$$E_{\text{model}} = P_{\text{active}} \times \left( \frac{t_{\text{ms}}}{1000} \right) \quad [\text{Joules}]$$

### 5.2 Model Parameters & Assumptions
- **$P_{\text{tdp}}$:** Configurable Thermal Design Power (default: 28.0 Watts for Intel Core i5-1135G7).
- **$P_{\text{idle}}$:** Estimated baseline socket idle power (5.0 Watts).
- **Assumptions:** Assumes linear power scaling between idle and full TDP; ignores Dynamic Voltage and Frequency Scaling (DVFS), thermal throttling, and instruction-specific energy variations (e.g. AVX-512 vs integer arithmetic).
- **Labeling:** Always prominently labeled as **"Model-estimated energy (UNVERIFIED / UNCALIBRATED)"**.

---

## 6. Output Equivalence & Fair Comparison Rules

1. **Equivalence Precondition:** Implementations are compared only if their outputs match textually or mathematically. Non-equivalent outputs are flagged as an invalid comparison.
2. **Speedup Factor:** Defined as $\frac{\text{Baseline Median Time}}{\text{Candidate Median Time}}$.
3. **No Mislabeled Comparisons:** Hardware-measured energy is never compared directly with modeled estimates. If energy telemetry is unavailable, no energy-savings percentage is generated.

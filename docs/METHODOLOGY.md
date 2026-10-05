# Benchmark Methodology & Measurement Provenance

## 1. Timing Architecture

The benchmark engine employs the host operating system's highest-resolution monotonic clock:

- **Timing Function:** Python `time.perf_counter_ns()`
- **Monotonic Guarantee:** Non-decreasing; immune to system clock adjustments (NTP sync or user time changes).
- **Resolution:** Sub-microsecond (typically < 100 nanoseconds on modern Windows/Linux platforms).
- **Separation of Concerns:** Compilation latency is measured as an independent phase and is strictly separated from runtime benchmark execution latency.

---

## 2. Benchmark Protocol: Warm-Up & Repetitions

Measuring microarchitectural events on general-purpose multitasking operating systems requires strict controls against cold-start contamination:

```
[ Trial 1: Warmup ]  ──>  [ Trial 2: Warmup ]  ──>  [ Trial 1: Measured ] ──> ... ──> [ Trial 10: Measured ]
 (Cache cold, TLB fault,     (Frequency ramp-up,        (Recorded in dataset, evaluated for statistical summary)
  discarded from stats)       discarded from stats)
```

### Why Warm-Up Runs are Mandatory:
1. **Cache Priming:** On cold start, instructions and working data reside in DRAM or disk cache. Initial execution incurs cold compulsory misses. Warm-up iterations load working sets into L1/L2 caches.
2. **Virtual Memory TLB Fault Avoidance:** The operating system allocates virtual pages lazily. First accesses cause page table faults and TLB misses.
3. **CPU Frequency Governor Stabilization:** Modern processors utilize dynamic frequency scaling (Intel Speed Shift / P-states). Processors often begin in low-power C-states and take several milliseconds to transition to maximum performance frequency.
4. **Discard Policy:** Warm-up runs are recorded in trial logs for complete audit transparency but are strictly excluded from summary statistics.

---

## 3. Statistical Summarization

To prevent transient operating system background interrupts from distorting performance analysis, summary metrics are computed using robust statistics:

### Primary Metric: Median Execution Time
$$\text{Median} = Q_2 = \text{50th percentile of measured trials}$$

The arithmetic mean is vulnerable to positive outliers caused by operating system thread preemption, context switching, or background Antivirus scans. The **median** provides a robust, non-parametric measure of central tendency.

### Dispersion Metric: Interquartile Range (IQR)
$$\text{IQR} = Q_3 - Q_1$$

The IQR represents the spread of the middle 50% of trials, isolating consistent benchmark behavior from external system noise.

### Supporting Metrics:
- **Sample Standard Deviation ($s$):**
  $$s = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N} (x_i - \bar{x})^2}$$
- **Minimum and Maximum Observed Times:** Identifies best-case execution under minimum contention and worst-case interruption.

---

## 4. Correctness & Output Verification

Under scientific benchmark principles, **performance comparison without verified correctness is invalid**.

Before any speedup or relative metric is computed:
1. Standard output of the baseline program is captured and trimmed.
2. Standard output of the candidate program is captured and trimmed.
3. Outputs are compared textually and numerically:
   - Integer exact equality check.
   - Floating-point epsilon tolerance check ($|a - b| < 10^{-9}$).
4. If outputs do not match, the session is flagged as `Output Mismatch`. Relative speedup metrics are blocked from claiming legitimate performance gains.

---

## 5. Metric Provenance Taxonomy

To uphold strict academic integrity, every metric displayed in the dashboard is categorized under one of four distinct provenance tiers:

| Tier | Classification | Description | Dashboard Display |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Directly Measured** | Obtained from physical hardware sensors or verified OS timers (`perf_counter_ns`, peak RSS). | Green "Measured" Badge |
| **Tier 2** | **Derived / Calculated** | Mathematically computed from verified Tier 1 inputs (e.g. Speedup = $T_{\text{base}} / T_{\text{cand}}$, Median, IQR). | Blue "Calculated" Badge |
| **Tier 3** | **Modeled Estimate** | Generated using an explicit, documented theoretical model (e.g. Educational TDP Scaling Model). | Amber "Modeled (Unverified)" Badge |
| **Tier 4** | **Unavailable** | Hardware interfaces or permissions do not exist on the current platform (e.g. Windows user-space RAPL). | Gray / Red "Unavailable" Badge |

---

## 6. Energy Measurement Methodology

### Linux Platforms (`LinuxRaplProvider`)
On Linux systems with readable sysfs powercap nodes, energy is directly measured from the Intel/AMD Running Average Power Limit (RAPL) driver:
- **Sysfs Path:** `/sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj`
- **Unit:** Micro-Joules ($\mu\text{J}$) converted to Joules ($J = \frac{\mu\text{J}}{1,000,000}$).
- **Rollover Protection:** 32-bit hardware register rollover is detected and compensated using `MAX_ENERGY_UJ = 2^{32} - 1`.
- **Domain:** Package-0 (Entire CPU package including cores, uncore, and L3 cache).

### Windows Platforms (`WindowsRaplProvider`)
- **Limitation:** Windows restricts MSR reads (MSR 0x611) to Ring-0 kernel drivers. User-space programs cannot read physical energy without custom kernel drivers.
- **Academic Policy:** The analyzer honestly declares RAPL energy as `UNAVAILABLE` on Windows.
- **Strict Prohibition:** The system refuses to fabricate fake Joules or apply arbitrary scaling multipliers to simulate real power readings.

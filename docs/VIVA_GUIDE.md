# Computer Organization & Architecture Viva Voce Guide

### Comprehensive Faculty Panel Preparation • 21 Essential Questions & Detailed Answers

---

### Q1. What is the fundamental CPU Performance Equation, and what does each term represent?
**Answer:**
The CPU Performance Equation defines program execution time as:
$$\text{CPU Execution Time} = \text{Instruction Count } (IC) \times \text{CPI} \times t_c = \frac{IC \times \text{CPI}}{f}$$
- **Instruction Count ($IC$):** The total number of dynamic machine instructions executed during program run.
- **Cycles Per Instruction ($\text{CPI}$):** The average number of clock cycles required to execute and retire one instruction.
- **Clock Cycle Time ($t_c$) / Clock Frequency ($f$):** $t_c$ is the duration of a single clock tick, equal to $\frac{1}{f}$.
Execution time can only be reduced by decreasing $IC$ (algorithmic design, compiler), decreasing $\text{CPI}$ (pipelining, superscalar issue, cache hits), or increasing clock frequency $f$ (semiconductor scaling).

---

### Q2. What is the crucial difference between static instruction count and dynamic instruction count?
**Answer:**
Static instruction count is the number of machine instructions in the compiled binary file on disk. Dynamic instruction count is the actual number of instructions executed by the CPU pipeline at runtime. A loop with 4 static instructions executed 1,000,000 times generates 4,000,000 dynamic instruction executions. In performance evaluation, dynamic instruction count determines execution time, not static code size.

---

### Q3. Does a lower CPI always mean a program runs faster? Why or why not?
**Answer:**
No. Execution time is the product of $IC \times \text{CPI} / f$. An unoptimized program executing 10,000,000 instructions with a low CPI of 0.8 takes 8,000,000 cycles. An optimized algorithm executing only 10,000 instructions with a higher CPI of 2.0 takes only 20,000 cycles—making it 400x faster despite having a higher CPI.

---

### Q4. Why is clock frequency (GHz) alone an inadequate metric for comparing processor performance?
**Answer:**
Clock frequency only measures the rate of clock pulses, not the amount of work completed per cycle. Modern processors feature varying Instruction-Level Parallelism (ILP), superscalar execution widths, and out-of-order execution engines. A 2.4 GHz processor that retires 4 instructions per cycle (IPC = 4.0) delivers 9.6 billion instructions per second, easily outperforming a 3.5 GHz in-order processor that retires 1 instruction per cycle.

---

### Q5. Explain the principles of Spatial Locality and Temporal Locality with concrete examples.
**Answer:**
- **Spatial Locality:** If a memory address is accessed, nearby memory addresses are likely to be accessed soon. Demonstrated by sequentially traversing an array, where loading a 64-byte cache line brings 16 contiguous integers into L1 cache for immediate subsequent use.
- **Temporal Locality:** If a memory address is accessed, the exact same address is likely to be accessed again in the near future. Demonstrated by loop index variables (`i`) or accumulator variables (`sum`) kept in registers or L1 cache throughout a loop.

---

### Q6. Why does strided array access execute significantly slower than sequential access?
**Answer:**
Main memory transfers data into CPU caches in blocks of 64 bytes (16 32-bit integers). In sequential access (stride 1), one 64-byte fetch satisfies 16 consecutive read operations. In strided access (stride $\ge 16$), each read lands on a different 64-byte cache line. The CPU must fetch 64 bytes across the memory bus only to use 4 bytes, wasting 93.75% of memory bus bandwidth and causing repeated L1/L2 cache misses that stall the CPU execution pipeline for hundreds of cycles.

---

### Q7. What are the five stages of a classic RISC instruction pipeline?
**Answer:**
1. **IF (Instruction Fetch):** Fetch instruction from L1 I-cache using Program Counter (PC); increment PC.
2. **ID (Instruction Decode):** Decode instruction opcode and read operand registers from the register file.
3. **EX (Execute / ALU):** Perform ALU arithmetic/logic operation or compute memory address.
4. **MEM (Memory Access):** Read or write data from/to L1 Data Cache for load/store instructions.
5. **WB (Write Back):** Write resulting computation back into the destination register in the register file.

---

### Q8. What are the three primary types of pipeline hazards, and how are they resolved?
**Answer:**
1. **Structural Hazards:** Hardware resource contention (e.g. unified memory port). Resolved by using separate L1 instruction and data caches (Harvard architecture).
2. **Data Hazards (RAW):** An instruction depends on the result of an earlier instruction that has not yet completed stage WB. Resolved by hardware forwarding (bypassing) or inserting stall bubbles.
3. **Control Hazards:** Branch outcome is unknown when the next instruction must be fetched. Resolved by branch prediction (static/dynamic), speculative execution, and pipeline flushing if mispredicted.

---

### Q9. What is Hardware Forwarding (Bypassing), and how does it prevent pipeline stalls?
**Answer:**
Without forwarding, an instruction must stall until a preceding instruction completes stage WB (Cycle 5) before reading the updated register value, inserting 2 stall cycles. A forwarding unit uses multiplexers to route the computed ALU result directly from the EX/MEM pipeline register to the ALU input at stage EX in Cycle 4, completely eliminating the stall bubbles and maintaining CPI = 1.0.

---

### Q10. How does compiler optimization (-O0 vs -O2) transform generated assembly and performance?
**Answer:**
Under `-O0`, the compiler generates naive code where all local variables reside on the memory stack frame. Every operation requires a `movl` from stack memory to register, ALU calculation, and `movl` back to stack memory. Under `-O2`, the compiler performs register allocation (pinning variables in registers `eax`, `ebx`, `ecx`), loop-invariant code motion, and constant folding, completely eliminating redundant memory traffic.

---

### Q11. What is Constant Folding, and how was it demonstrated in this project?
**Answer:**
Constant folding is a compiler optimization pass that evaluates expressions with compile-time known constants during compilation rather than generating runtime instructions. In our Experiment A, GCC under `-O2` evaluated the 1,000,000-iteration arithmetic progression at compile-time directly into the constant `499999500000`, replacing 1,000,000 runtime loop cycles with immediate register loads (`movl $1783293664` and `movl $116`).

---

### Q12. What is the fundamental difference between Electrical Power and Electrical Energy?
**Answer:**
Power ($P$, measured in Watts) is the instantaneous rate of energy consumption ($1\text{ W} = 1\text{ J/s}$). Energy ($E$, measured in Joules) is the accumulated consumption over time ($E = \int P(t) \, dt$). A 50W processor running for 0.01 seconds consumes 0.5 Joules. A 10W processor running for 0.2 seconds consumes 2.0 Joules. The 50W processor draws more power, but consumes less total energy.

---

### Q13. Does a faster program always consume less energy? Explain the microarchitectural reason.
**Answer:**
Not necessarily. Modern processors utilize Turbo Boost to accelerate execution by dramatically raising clock frequency and supply voltage ($V$). Because dynamic CMOS switching power scales quadratically with voltage ($P_{\text{dynamic}} = \alpha C V^2 f$), operating at peak turbo boost can spike power consumption so steeply that total energy per task ($E = P \times t$) actually increases compared to running at an energy-efficient base frequency.

---

### Q14. Why is Intel RAPL unavailable in user-space on Windows 11 without a kernel driver?
**Answer:**
Intel Running Average Power Limit (RAPL) telemetry is accessed via Model-Specific Registers (MSRs, specifically MSR 0x611 `MSR_PKG_ENERGY_STATUS`). The x86 architecture restricts the `RDMSR` instruction to Ring-0 (kernel privilege). Unlike Linux, which exposes these counters to user-space via the sysfs `powercap` interface, Windows provides no built-in user-space API. Reading RAPL on Windows requires a signed Ring-0 kernel device driver (e.g. Intel PCM or WinRing0).

---

### Q15. Why must benchmark methodology include warm-up iterations prior to recorded trials?
**Answer:**
Warm-up iterations prime CPU instruction and data caches (bringing data from DRAM into L1/L2), populate virtual memory page table entries in the TLB to avoid page faults during measurement, and allow the CPU frequency governor (Intel Speed Shift / P-states) to transition from low-power idle states to active execution frequency.

---

### Q16. Why is the median execution time preferred over the arithmetic mean in performance benchmarks?
**Answer:**
On general-purpose operating systems, background system tasks, thread scheduling context switches, and interrupt service routines create extreme positive outliers. The arithmetic mean is heavily skewed by these non-deterministic interruptions. The median represents the 50th percentile and is robust against outlier contamination.

---

### Q17. Why must benchmark tools verify mathematical equivalence before comparing speedup?
**Answer:**
Performance comparisons are scientifically valid only if both programs compute the exact same mathematical function and produce equivalent outputs. If a program runs faster because it terminated early due to a bug or produced an erroneous result, claiming a speedup is fraudulent. Correctness is a strict prerequisite to performance evaluation.

---

### Q18. What is the "Memory Wall", and what distinguishes compute-bound from memory-bound workloads?
**Answer:**
The "Memory Wall" refers to the growing performance gap between rapid CPU clock speeds and relatively slow DRAM access latency (~200 cycles). A compute-bound workload has high arithmetic intensity, keeping ALU execution units saturated with low CPI. A memory-bound workload has low arithmetic intensity, repeatedly stalling execution units while waiting for memory bus transfers, resulting in high CPI.

---

### Q19. What is Amdahl’s Law, and how does it apply to software and architectural optimization?
**Answer:**
Amdahl's Law states that the overall speedup gained by optimizing a specific component is limited by the fraction of execution time that component accounts for:
$$\text{Speedup} = \frac{1}{(1 - f_{\text{enhanced}}) + \frac{f_{\text{enhanced}}}{S}}$$
Optimizing an instruction sequence that only takes 5% of program runtime can never yield more than a 5% overall speedup, even if that sequence is accelerated to run instantaneously ($S \to \infty$).

---

### Q20. Why does this project strictly refuse to fabricate energy readings on Windows?
**Answer:**
Scientific integrity and engineering honesty. Multiplying CPU utilization by execution time by an arbitrary constant produces a fictitious number with zero empirical basis. Academic engineering requires truthful provenance: directly measured values must originate from calibrated physical sensors or hardware counters; when unavailable, the limitation must be openly declared.

---

### Q21. What role does the Translation Lookaside Buffer (TLB) play in memory hierarchy?
**Answer:**
The TLB is a dedicated hardware cache inside the CPU Memory Management Unit (MMU) that stores recent virtual-to-physical address translations. When a program strides across memory spanning multiple 4 KB virtual pages, TLB misses occur, forcing expensive multi-level page table walks in DRAM that add dozens of stall cycles to memory access latency.

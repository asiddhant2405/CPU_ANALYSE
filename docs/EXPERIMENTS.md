# Experiment Guide & Benchmark Protocols

This document details the objective, mathematical formulation, controls, source code, expected outputs, and architectural interpretation for all built-in experiments.

---

## Experiment A: Integer Summation (Iterative Loop vs Gauss Formula)

### 1. Objective
Compare the computational and architectural cost of calculating the arithmetic series sum $\sum_{i=0}^{N} i$ using an $O(N)$ iterative loop versus Carl Friedrich Gauss's $O(1)$ closed-form formula.

### 2. Mathematical Formulation
$$\text{Sum} = \sum_{i=0}^{N} i = \frac{N \times (N + 1)}{2}$$

For the standard benchmark upper bound $N = 999,999$:

$$\text{Sum} = \frac{999999 \times 1000000}{2} = 499,999,500,000$$

### 3. Implementation Controls
- **Data Types:** 64-bit signed integers (`long long` in C/C++, arbitrary precision in Python) to prevent intermediate 32-bit arithmetic overflow ($4.99 \times 10^{11} > 2^{31} - 1$).
- **Verified Output:** Exactly `499999500000`.

### 4. Source Implementations (C)
**Method A (Iterative Loop):**
```c
#include <stdio.h>
int main(void) {
    long long sum = 0;
    for (int i = 0; i < 1000000; i++) {
        sum += i;
    }
    printf("%lld\n", sum);
    return 0;
}
```

**Method B (Gauss Formula):**
```c
#include <stdio.h>
int main(void) {
    long long n = 999999;
    long long sum = n * (n + 1) / 2;
    printf("%lld\n", sum);
    return 0;
}
```

### 5. Architectural Interpretation
- **CPU Performance Equation:** Method A executes $1,000,000$ loop increments, conditional branches, and additions. Method B executes 1 register add, 1 integer multiplication (`imul`), and 1 shift. Reducing dynamic Instruction Count (IC) by $100,000\times$ provides massive execution speedup.
- **Compiler Optimization Effect:** When compiling with GCC under `-O2`, the compiler's loop optimizer detects the arithmetic progression and constant-folds the entire loop into immediate constants at compile time.

---

## Experiment B: Memory Access & Cache Locality

### 1. Objective
Investigate how memory layout and spatial locality govern memory bus traffic, cache line utilization, and execution latency.

### 2. Experimental Design
- **Working Dataset:** An array of $4,000,000$ 32-bit integers ($16\text{ MB}$ footprint), exceeding typical L1 ($48\text{ KB}$) and L2 ($1.25\text{ MB}$) cache sizes.
- **Operation Count:** Both implementations perform exactly $1,000,000$ integer additions.
- **Initialization:** `arr[i] = (i % 7) + 1;`
- **Verified Output Checksum:** Because $\gcd(4, 7) = 1$, the residue class frequencies match exactly over $1,000,000$ elements, producing the exact identical sum: `3999997`.

### 3. Source Implementations (C)
**Sequential Traversal (Stride = 1):**
```c
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    const int total = 4000000;
    int *arr = (int *)malloc(total * sizeof(int));
    for (int i = 0; i < total; i++) arr[i] = (i % 7) + 1;
    long long sum = 0;
    for (int i = 0; i < 1000000; i++) {
        sum += arr[i]; // Stride 1
    }
    printf("%lld\n", sum);
    free(arr);
    return 0;
}
```

**Strided Traversal (Stride = 4):**
```c
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    const int total = 4000000;
    int *arr = (int *)malloc(total * sizeof(int));
    for (int i = 0; i < total; i++) arr[i] = (i % 7) + 1;
    long long sum = 0;
    for (int i = 0; i < 1000000; i++) {
        sum += arr[i * 4]; // Stride 4
    }
    printf("%lld\n", sum);
    free(arr);
    return 0;
}
```

### 4. Architectural Interpretation
- **64-Byte Cache Line Utilization:** Main memory transfers data in 64-byte blocks (16 integers). Sequential access satisfies 16 consecutive read operations per fetch.
- **Bandwidth Waste:** In strided access, every load accesses elements spaced 16 or 64 bytes apart, discarding up to $93.75\%$ of the fetched data and causing frequent L1/L2 cache misses that stall the CPU execution pipeline for hundreds of cycles.

---

## Experiment C: Compiler Optimization Levels

### 1. Objective
Demonstrate how compiler optimization flags (`-O0` vs `-O2`) transform code structure, register allocation, and assembly instructions without altering algorithmic outputs.

### 2. Workload Description
A polynomial accumulator loop running for $1,000,000$ iterations:

$$\text{Total} = \sum_{i=0}^{999999} (i \times 3 + 7) \pmod{1000003}$$

**Verified Output:** `500001499997`

### 3. Architectural Interpretation
- **Register Spilling:** Under `-O0`, the compiler stores local variables in the stack frame. Every iteration generates redundant memory `movl` instructions between registers and RAM.
- **Register Pinning:** Under `-O2`, variables are pinned inside high-speed registers (`eax`, `ebx`, `ecx`), and integer modulo is converted into high-speed reciprocal multiplication.

---

## Experiment D: CPU-Bound vs Memory-Bound Workloads

### 1. Objective
Compare the execution behavior of pure register-bound arithmetic against memory-bound cache-stressed buffer access.

### 2. Workload Description
Both implementations execute for exactly $1,000,000$ iterations:
- **Compute-Bound:** Tight bitwise rotation and ALU arithmetic kept strictly inside CPU registers.
- **Memory-Bound:** Strided array access across an allocated buffer, continuously stressing the memory bus.

### 3. Architectural Interpretation
- **Compute Intensity:** The compute-bound workload maintains high arithmetic intensity with low CPI.
- **The Memory Wall:** The memory-bound workload induces pipeline stall bubbles as execution units wait for memory controller bus transfers, demonstrating that memory latency is often the primary bottleneck in modern computing.

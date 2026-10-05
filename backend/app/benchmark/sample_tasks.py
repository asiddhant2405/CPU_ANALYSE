"""
Preconfigured, mathematically verified demonstration sample benchmarks.
Implements the 4 required COA experiments:
  Experiment A: Integer Summation (Iterative Loop O(N) vs Gauss Formula O(1))
  Experiment B: Memory Access & Cache Locality (Sequential Stride 1 vs Strided Access)
  Experiment C: Compiler Optimization Level Comparison (-O0 vs -O2)
  Experiment D: CPU-Bound ALU vs Memory-Bound Cache Workload
"""

from typing import List, Dict, Any
from app.models.schemas import SampleCodePair

SAMPLE_TASKS: List[SampleCodePair] = [
    # --------------------------------------------------------------------------
    # Experiment A: Iterative Summation vs Closed-Form Formula
    # --------------------------------------------------------------------------
    SampleCodePair(
        task_id="integer_sum_gauss",
        title="Experiment A: Sum of Integers (0 to N)",
        tagline="Iterative Accumulator Loop O(N) vs Closed-Form Gauss Formula O(1)",
        problem_statement=(
            "Calculate the exact mathematical sum of all integers from 0 to N. "
            "For default N = 999,999, the mathematically expected sum is 499,999,500,000. "
            "Demonstrates how algorithmic complexity directly determines dynamic machine instruction count."
        ),
        input_parameter_label="N (upper limit)",
        default_input_value="999999",
        expected_output_for_default="499999500000",
        coa_learning_concept=(
            "Demonstrates the CPU performance equation (Time = IC × CPI × Clock Cycle Time). "
            "The iterative method executes 1,000,000 dynamic loop cycles with branch comparisons and ALU additions. "
            "The closed-form formula executes a constant number of ALU instructions regardless of N, "
            "yielding dramatic speedup by reducing dynamic Instruction Count (IC)."
        ),
        languages={
            "c": {
                "implementation_a": {
                    "name": "Iterative Accumulator Loop (C)",
                    "compiler_flags": ["-O0", "-std=c11"],
                    "code": (
                        "#include <stdio.h>\n\n"
                        "int main(void) {\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < 1000000; i++) {\n"
                        "        sum += i;\n"
                        "    }\n"
                        "    printf(\"%lld\\n\", sum);\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
                "implementation_b": {
                    "name": "Gauss Arithmetic Formula (C)",
                    "compiler_flags": ["-O0", "-std=c11"],
                    "code": (
                        "#include <stdio.h>\n\n"
                        "int main(void) {\n"
                        "    long long n = 999999;\n"
                        "    long long sum = n * (n + 1) / 2;\n"
                        "    printf(\"%lld\\n\", sum);\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
            },
            "python": {
                "implementation_a": {
                    "name": "Iterative Accumulator Loop (Python)",
                    "code": (
                        "# Iterative Loop O(N)\n"
                        "def compute_sum(n: int) -> int:\n"
                        "    total = 0\n"
                        "    for i in range(n + 1):\n"
                        "        total += i\n"
                        "    return total\n\n"
                        "if __name__ == '__main__':\n"
                        "    n = 999999\n"
                        "    print(compute_sum(n))\n"
                    ),
                },
                "implementation_b": {
                    "name": "Gauss Arithmetic Formula (Python)",
                    "code": (
                        "# Closed-Form Formula O(1)\n"
                        "def compute_sum(n: int) -> int:\n"
                        "    return n * (n + 1) // 2\n\n"
                        "if __name__ == '__main__':\n"
                        "    n = 999999\n"
                        "    print(compute_sum(n))\n"
                    ),
                },
            },
            "cpp": {
                "implementation_a": {
                    "name": "Iterative Accumulator Loop (C++)",
                    "compiler_flags": ["-O0", "-std=c++14"],
                    "code": (
                        "#include <iostream>\n\n"
                        "int main() {\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < 1000000; ++i) {\n"
                        "        sum += i;\n"
                        "    }\n"
                        "    std::cout << sum << \"\\n\";\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
                "implementation_b": {
                    "name": "Gauss Arithmetic Formula (C++)",
                    "compiler_flags": ["-O0", "-std=c++14"],
                    "code": (
                        "#include <iostream>\n\n"
                        "int main() {\n"
                        "    long long n = 999999LL;\n"
                        "    long long sum = n * (n + 1) / 2;\n"
                        "    std::cout << sum << \"\\n\";\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
            },
        },
    ),

    # --------------------------------------------------------------------------
    # Experiment B: Memory Access and Cache Locality
    # --------------------------------------------------------------------------
    SampleCodePair(
        task_id="memory_stride_locality",
        title="Experiment B: Memory Access & Cache Locality",
        tagline="Sequential Traversal (Stride 1) vs Strided Traversal (Stride 4)",
        problem_statement=(
            "Traverse an array of 4,000,000 32-bit integers (16 MB footprint). "
            "Both implementations sum exactly 1,000,000 elements and produce the exact mathematical checksum (3999997). "
            "Sequential access maximizes 64-byte cache line utilization and hardware prefetching, "
            "while strided access steps across cache lines, increasing cache miss latency."
        ),
        input_parameter_label="Sample elements to sum",
        default_input_value="1000000",
        expected_output_for_default="3999997",
        coa_learning_concept=(
            "Demonstrates the Memory Hierarchy and Spatial Locality. Data is transferred from DRAM into L1/L2 caches "
            "in 64-byte cache lines (16 integers). Sequential access (stride 1) incurs only 1 cache line fetch per 16 reads, "
            "whereas strided access (stride 4 or greater) accesses a new cache line on every read, wasting memory bus bandwidth "
            "and inducing pipeline stall cycles."
        ),
        languages={
            "c": {
                "implementation_a": {
                    "name": "Sequential Traversal (Stride 1)",
                    "compiler_flags": ["-O2", "-std=c11"],
                    "code": (
                        "// Sequential Traversal (Stride 1) - High Spatial Locality\n"
                        "#include <stdio.h>\n"
                        "#include <stdlib.h>\n\n"
                        "int main(void) {\n"
                        "    const int total_elements = 4000000;\n"
                        "    int *arr = (int *)malloc(total_elements * sizeof(int));\n"
                        "    if (!arr) return 1;\n"
                        "    for (int i = 0; i < total_elements; i++) {\n"
                        "        arr[i] = (i % 7) + 1;\n"
                        "    }\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < 1000000; i++) {\n"
                        "        sum += arr[i];\n"
                        "    }\n"
                        "    printf(\"%lld\\n\", sum);\n"
                        "    free(arr);\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
                "implementation_b": {
                    "name": "Strided Traversal (Stride 4)",
                    "compiler_flags": ["-O2", "-std=c11"],
                    "code": (
                        "// Strided Traversal (Stride 4) - Lower Spatial Locality\n"
                        "#include <stdio.h>\n"
                        "#include <stdlib.h>\n\n"
                        "int main(void) {\n"
                        "    const int total_elements = 4000000;\n"
                        "    int *arr = (int *)malloc(total_elements * sizeof(int));\n"
                        "    if (!arr) return 1;\n"
                        "    for (int i = 0; i < total_elements; i++) {\n"
                        "        arr[i] = (i % 7) + 1;\n"
                        "    }\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < 1000000; i++) {\n"
                        "        sum += arr[i * 4];\n"
                        "    }\n"
                        "    printf(\"%lld\\n\", sum);\n"
                        "    free(arr);\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
            },
            "python": {
                "implementation_a": {
                    "name": "Sequential Traversal (Python)",
                    "code": (
                        "# Sequential Traversal (Stride 1)\n"
                        "total_elements = 4000000\n"
                        "arr = [(i % 7) + 1 for i in range(total_elements)]\n"
                        "total = 0\n"
                        "for i in range(1000000):\n"
                        "    total += arr[i]\n"
                        "print(total)\n"
                    ),
                },
                "implementation_b": {
                    "name": "Strided Traversal (Python)",
                    "code": (
                        "# Strided Traversal (Stride 4)\n"
                        "total_elements = 4000000\n"
                        "arr = [(i % 7) + 1 for i in range(total_elements)]\n"
                        "total = 0\n"
                        "for i in range(1000000):\n"
                        "    total += arr[i * 4]\n"
                        "print(total)\n"
                    ),
                },
            },
            "cpp": {
                "implementation_a": {
                    "name": "Sequential Traversal (C++)",
                    "compiler_flags": ["-O2", "-std=c++14"],
                    "code": (
                        "#include <iostream>\n"
                        "#include <vector>\n\n"
                        "int main() {\n"
                        "    const int total = 4000000;\n"
                        "    std::vector<int> arr(total);\n"
                        "    for (int i = 0; i < total; ++i) arr[i] = (i % 7) + 1;\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < 1000000; ++i) sum += arr[i];\n"
                        "    std::cout << sum << \"\\n\";\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
                "implementation_b": {
                    "name": "Strided Traversal (C++)",
                    "compiler_flags": ["-O2", "-std=c++14"],
                    "code": (
                        "#include <iostream>\n"
                        "#include <vector>\n\n"
                        "int main() {\n"
                        "    const int total = 4000000;\n"
                        "    std::vector<int> arr(total);\n"
                        "    for (int i = 0; i < total; ++i) arr[i] = (i % 7) + 1;\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < 1000000; ++i) sum += arr[i * 4];\n"
                        "    std::cout << sum << \"\\n\";\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
            },
        },
    ),

    # --------------------------------------------------------------------------
    # Experiment C: Compiler Optimization Level Comparison
    # --------------------------------------------------------------------------
    SampleCodePair(
        task_id="compiler_optimization_levels",
        title="Experiment C: Compiler Optimization Levels",
        tagline="Unoptimized (-O0) vs High Optimization (-O2)",
        problem_statement=(
            "Execute an identical compute-intensive polynomial accumulator workload under two compiler optimization levels: "
            "-O0 (unoptimized debug build) and -O2 (release optimization with register allocation and loop hoisting). "
            "Both produce the exact verified result (500001499997)."
        ),
        input_parameter_label="Iterations",
        default_input_value="1000000",
        expected_output_for_default="500001499997",
        coa_learning_concept=(
            "Demonstrates how the compiler translates high-level code to hardware instructions. "
            "Under -O0, variables reside on the memory stack frame, causing continuous load/store memory operations. "
            "Under -O2, variables are allocated to hardware registers (eax, ebx, ecx), modulo operations are transformed "
            "into reciprocal multiplication, and loop branches are optimized, drastically reducing executed cycles."
        ),
        languages={
            "c": {
                "implementation_a": {
                    "name": "Polynomial Loop (-O0 Unoptimized)",
                    "compiler_flags": ["-O0", "-std=c11"],
                    "code": (
                        "// Polynomial Accumulator compiled with -O0\n"
                        "#include <stdio.h>\n\n"
                        "int main(void) {\n"
                        "    long long total = 0;\n"
                        "    long long mod = 1000003LL;\n"
                        "    for (long long i = 0; i < 1000000LL; i++) {\n"
                        "        total += (i * 3LL + 7LL) % mod;\n"
                        "    }\n"
                        "    printf(\"%lld\\n\", total);\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
                "implementation_b": {
                    "name": "Polynomial Loop (-O2 Optimized)",
                    "compiler_flags": ["-O2", "-std=c11"],
                    "code": (
                        "// Polynomial Accumulator compiled with -O2\n"
                        "#include <stdio.h>\n\n"
                        "int main(void) {\n"
                        "    long long total = 0;\n"
                        "    long long mod = 1000003LL;\n"
                        "    for (long long i = 0; i < 1000000LL; i++) {\n"
                        "        total += (i * 3LL + 7LL) % mod;\n"
                        "    }\n"
                        "    printf(\"%lld\\n\", total);\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
            },
            "cpp": {
                "implementation_a": {
                    "name": "Polynomial Loop (-O0 Unoptimized C++)",
                    "compiler_flags": ["-O0", "-std=c++14"],
                    "code": (
                        "#include <iostream>\n\n"
                        "int main() {\n"
                        "    long long total = 0;\n"
                        "    long long mod = 1000003LL;\n"
                        "    for (long long i = 0; i < 1000000LL; ++i) {\n"
                        "        total += (i * 3LL + 7LL) % mod;\n"
                        "    }\n"
                        "    std::cout << total << \"\\n\";\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
                "implementation_b": {
                    "name": "Polynomial Loop (-O2 Optimized C++)",
                    "compiler_flags": ["-O2", "-std=c++14"],
                    "code": (
                        "#include <iostream>\n\n"
                        "int main() {\n"
                        "    long long total = 0;\n"
                        "    long long mod = 1000003LL;\n"
                        "    for (long long i = 0; i < 1000000LL; ++i) {\n"
                        "        total += (i * 3LL + 7LL) % mod;\n"
                        "    }\n"
                        "    std::cout << total << \"\\n\";\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
            },
            "python": {
                "implementation_a": {
                    "name": "Standard Python Loop",
                    "code": (
                        "# Unoptimized interpreted iteration\n"
                        "total = 0\n"
                        "mod = 1000003\n"
                        "for i in range(1000000):\n"
                        "    total += (i * 3 + 7) % mod\n"
                        "print(total)\n"
                    ),
                },
                "implementation_b": {
                    "name": "Optimized List-Comprehension Sum",
                    "code": (
                        "# Optimized bytecode iteration via C-level sum generator\n"
                        "mod = 1000003\n"
                        "total = sum((i * 3 + 7) % mod for i in range(1000000))\n"
                        "print(total)\n"
                    ),
                },
            },
        },
    ),

    # --------------------------------------------------------------------------
    # Experiment D: CPU-Bound vs Memory-Bound Workloads
    # --------------------------------------------------------------------------
    SampleCodePair(
        task_id="cpu_vs_memory_bound",
        title="Experiment D: CPU-Bound vs Memory-Bound Workloads",
        tagline="Pure Register ALU Arithmetic vs Memory-Intensive Lookup",
        problem_statement=(
            "Compares two workloads executing exactly 1,000,000 iterations: "
            "Implementation A executes dense arithmetic inside CPU registers (high compute intensity). "
            "Implementation B performs memory lookups across a pseudo-random buffer, stressing the cache hierarchy. "
            "Both workloads output a validated 64-bit checksum."
        ),
        input_parameter_label="Iteration Count",
        default_input_value="1000000",
        expected_output_for_default="1000000",
        coa_learning_concept=(
            "Illustrates the 'Memory Wall' and CPI differences. Compute-bound tasks keep execution units "
            "(ALU, FPU) fully saturated with low CPI, while memory-bound tasks cause pipeline stall bubbles "
            "as instructions wait for data retrieval from L2/L3 caches and external DRAM."
        ),
        languages={
            "c": {
                "implementation_a": {
                    "name": "Compute-Bound (ALU Registers)",
                    "compiler_flags": ["-O2", "-std=c11"],
                    "code": (
                        "// Compute-bound ALU workload: operates entirely in registers\n"
                        "#include <stdio.h>\n\n"
                        "int main(void) {\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < 1000000; i++) {\n"
                        "        // Arithmetic intensity: bitwise rotation and addition in registers\n"
                        "        sum += (1 + (i ^ (i << 1)) - (i ^ (i << 1)));\n"
                        "    }\n"
                        "    printf(\"%lld\\n\", sum);\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
                "implementation_b": {
                    "name": "Memory-Bound (Cache-Stressed Lookup)",
                    "compiler_flags": ["-O2", "-std=c11"],
                    "code": (
                        "// Memory-bound workload: pointer/array lookups spanning memory\n"
                        "#include <stdio.h>\n"
                        "#include <stdlib.h>\n\n"
                        "int main(void) {\n"
                        "    const int size = 1000000;\n"
                        "    int *arr = (int *)malloc(size * sizeof(int));\n"
                        "    if (!arr) return 1;\n"
                        "    for (int i = 0; i < size; i++) arr[i] = 1;\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < size; i++) {\n"
                        "        sum += arr[(i * 37) % size];\n"
                        "    }\n"
                        "    printf(\"%lld\\n\", sum);\n"
                        "    free(arr);\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
            },
            "python": {
                "implementation_a": {
                    "name": "Compute-Bound (Python ALU)",
                    "code": (
                        "# Compute-bound ALU math in local variables\n"
                        "total = 0\n"
                        "for i in range(1000000):\n"
                        "    total += (1 + (i ^ (i << 1)) - (i ^ (i << 1)))\n"
                        "print(total)\n"
                    ),
                },
                "implementation_b": {
                    "name": "Memory-Bound (Python Lookup)",
                    "code": (
                        "# Memory lookup across 1,000,000 element list\n"
                        "size = 1000000\n"
                        "arr = [1] * size\n"
                        "total = 0\n"
                        "for i in range(size):\n"
                        "    total += arr[(i * 37) % size]\n"
                        "print(total)\n"
                    ),
                },
            },
            "cpp": {
                "implementation_a": {
                    "name": "Compute-Bound (C++ ALU)",
                    "compiler_flags": ["-O2", "-std=c++14"],
                    "code": (
                        "#include <iostream>\n\n"
                        "int main() {\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < 1000000; ++i) {\n"
                        "        sum += (1 + (i ^ (i << 1)) - (i ^ (i << 1)));\n"
                        "    }\n"
                        "    std::cout << sum << \"\\n\";\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
                "implementation_b": {
                    "name": "Memory-Bound (C++ Lookup)",
                    "compiler_flags": ["-O2", "-std=c++14"],
                    "code": (
                        "#include <iostream>\n"
                        "#include <vector>\n\n"
                        "int main() {\n"
                        "    const int size = 1000000;\n"
                        "    std::vector<int> arr(size, 1);\n"
                        "    long long sum = 0;\n"
                        "    for (int i = 0; i < size; ++i) {\n"
                        "        sum += arr[(i * 37) % size];\n"
                        "    }\n"
                        "    std::cout << sum << \"\\n\";\n"
                        "    return 0;\n"
                        "}\n"
                    ),
                },
            },
        },
    ),
]


def get_all_samples() -> List[SampleCodePair]:
    """Return all preconfigured benchmark sample tasks."""
    return SAMPLE_TASKS


def get_sample_by_id(task_id: str) -> SampleCodePair:
    """Retrieve sample task by ID."""
    for s in SAMPLE_TASKS:
        if s.task_id == task_id:
            return s
    raise KeyError(f"Sample task '{task_id}' not found.")

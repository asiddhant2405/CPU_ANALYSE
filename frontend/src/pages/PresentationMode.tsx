import React, { useState, useEffect } from 'react';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Cpu,
  Layers,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ShieldCheck,
  Search,
  Sliders,
  Database,
  Terminal,
} from 'lucide-react';
import { SystemCapabilities } from '../types/api';

interface PresentationModeProps {
  capabilities: SystemCapabilities | null;
  onNavigateWorkbench?: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  capabilities,
  onNavigateWorkbench,
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const totalSlides = 8;
  const [vivaSearch, setVivaSearch] = useState<string>('');
  const [selectedVivaCategory, setSelectedVivaCategory] = useState<string>('all');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        setCurrentSlide((prev) => Math.min(totalSlides, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlide((prev) => Math.max(1, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  // 20+ Detailed Viva Questions & Answers
  const vivaQuestions = [
    {
      id: 1,
      category: 'cpu_equation',
      question: 'What is the fundamental CPU Performance Equation, and what does each term represent?',
      answer:
        'CPU Execution Time = Instruction Count (IC) × Cycles Per Instruction (CPI) × Clock Cycle Time (tc) = (IC × CPI) / f. ' +
        'IC is the total number of machine instructions executed for the program; CPI is the average number of clock cycles required to execute one instruction; ' +
        'tc is the duration of one clock cycle (the reciprocal of clock frequency f). Execution time can only be reduced by lowering IC, lowering CPI, or raising f.',
    },
    {
      id: 2,
      category: 'instruction_count',
      question: 'What is the crucial difference between static instruction count and dynamic instruction count?',
      answer:
        'Static instruction count is the number of instructions present in the compiled binary file on disk. ' +
        'Dynamic instruction count is the actual number of machine instructions fetched and executed by the CPU at runtime. ' +
        'For example, a loop containing 4 static instructions executed 1,000,000 times produces 4,000,000 dynamic instruction executions. ' +
        'Never confuse static assembly line count with runtime instruction workload.',
    },
    {
      id: 3,
      category: 'cpi',
      question: 'Does a lower CPI (Cycles Per Instruction) always mean a program runs faster?',
      answer:
        'No. Performance is the product of IC and CPI divided by f. If an unoptimized algorithm executes 10,000,000 instructions with a low CPI of 0.8 (e.g. tight register adds), ' +
        'it takes 8,000,000 cycles. An optimized algorithm that executes only 10,000 instructions with a higher CPI of 2.0 takes only 20,000 cycles—making it 400x faster despite having a higher CPI.',
    },
    {
      id: 4,
      category: 'clock_freq',
      question: 'Why is comparing clock frequency (GHz) alone an invalid measure of processor performance?',
      answer:
        'Clock frequency only tells how fast the clock ticks, not how much work is accomplished per tick. ' +
        'Different microarchitectures have different CPI and Instructions Per Cycle (IPC). An out-of-order 8-wide superscalar CPU at 2.4 GHz ' +
        'can retire up to 8 instructions per cycle, heavily outperforming an in-order pipeline at 3.5 GHz.',
    },
    {
      id: 5,
      category: 'cache',
      question: 'Explain the principles of Spatial Locality and Temporal Locality with concrete examples.',
      answer:
        'Spatial Locality states that if a memory location is accessed, nearby memory locations are likely to be accessed soon (e.g. sequential array traversal using 64-byte cache lines). ' +
        'Temporal Locality states that if a memory location is accessed, the same location is likely to be referenced repeatedly in the near future (e.g. loop index variable or accumulator variable).',
    },
    {
      id: 6,
      category: 'cache',
      question: 'Why does strided array traversal (e.g. stride = 16 or 64) execute slower than sequential traversal (stride = 1)?',
      answer:
        'Main memory transfers data into CPU caches in blocks of 64 bytes (16 32-bit integers). In sequential access, one 64-byte fetch satisfies 16 consecutive read operations (100% spatial locality). ' +
        'In strided access (stride >= 16), every read lands on a completely different 64-byte cache line. The CPU must fetch 64 bytes across the memory bus only to consume 4 bytes, wasting 93.75% of bandwidth ' +
        'and causing frequent L1/L2 cache misses that stall the pipeline.',
    },
    {
      id: 7,
      category: 'pipelining',
      question: 'What are the five classic stages of a RISC instruction pipeline, and what happens at each stage?',
      answer:
        '1. IF (Instruction Fetch): Fetch instruction from L1 I-cache using Program Counter (PC).\n' +
        '2. ID (Instruction Decode): Decode opcode, read source operands from the register file.\n' +
        '3. EX (Execute / ALU): Perform arithmetic/logic operation or calculate effective memory address.\n' +
        '4. MEM (Memory Access): Read or write data from/to L1 D-cache if instruction is load/store.\n' +
        '5. WB (Write Back): Write the resulting value back into the destination register in the register file.',
    },
    {
      id: 8,
      category: 'hazards',
      question: 'What are the three main types of pipeline hazards, and how are they handled?',
      answer:
        '1. Structural Hazard: Hardware resource conflict (e.g. single memory port for both instruction fetch and data access). Handled by duplicating resources (Harvard architecture).\n' +
        '2. Data Hazard (RAW): Instruction depends on the unwritten result of an earlier instruction. Handled by hardware forwarding/bypassing or inserting stall bubbles.\n' +
        '3. Control Hazard: Branch condition unknown when next instruction is fetched. Handled by branch prediction and speculative execution.',
    },
    {
      id: 9,
      category: 'hazards',
      question: 'What is Hardware Forwarding (Bypassing) and how does it prevent pipeline stalls?',
      answer:
        'Without forwarding, an instruction must wait until stage WB (Cycle 5) to read a register produced by a previous instruction, causing 2 stall cycles. ' +
        'Forwarding units use multiplexers to route the computed ALU result directly from the EX/MEM pipeline register to the ALU input of the dependent instruction at stage EX, ' +
        'eliminating the stall bubbles completely.',
    },
    {
      id: 10,
      category: 'compiler',
      question: 'How does GCC compiler optimization (-O0 vs -O2) change generated assembly and performance?',
      answer:
        'Under -O0, GCC generates unoptimized code where all variables reside in the stack frame (memory), generating redundant movl load/store instructions for every statement. ' +
        'Under -O2, GCC performs register allocation (pinning variables in registers eax, ebx, ecx), loop-invariant code motion, constant folding, and strength reduction. ' +
        'For simple algebraic loops, -O2 can even recognize the arithmetic progression and constant-fold the loop entirely.',
    },
    {
      id: 11,
      category: 'compiler',
      question: 'What is Constant Folding, and how was it demonstrated in this project?',
      answer:
        'Constant folding is an optimization pass where operations on compile-time constants are evaluated by the compiler rather than generating runtime machine instructions. ' +
        'In our Experiment A with GCC under -O2, the loop for i=0 to 1,000,000 was evaluated at compile-time directly to the constant 499,999,500,000 (represented in assembly as movl $1783293664 and movl $116 into registers), ' +
        'completely replacing 1,000,000 loop cycles with immediate loads!',
    },
    {
      id: 12,
      category: 'energy',
      question: 'What is the difference between Electrical Power and Electrical Energy in a CPU?',
      answer:
        'Power (P, Watts) is the instantaneous rate of energy consumption (Joules/sec). ' +
        'Energy (E, Joules) is the accumulated consumption over time (integral of Power dt). ' +
        'A high-performance CPU might draw 65 Watts for 0.01 seconds (0.65 Joules), while a low-power CPU draws 10 Watts for 0.2 seconds (2.0 Joules). ' +
        'The high-power CPU used more power, but less total energy.',
    },
    {
      id: 13,
      category: 'energy',
      question: 'Does a faster program always consume less energy? Explain why or why not.',
      answer:
        'Not necessarily. While "Race-to-Sleep" can save static leakage energy by returning to an idle state faster, ' +
        'modern CPUs often achieve peak speed by triggering Turbo Boost. Turbo Boost raises clock frequency and dramatically increases core voltage (V). ' +
        'Because dynamic CMOS switching power scales quadratically with voltage (P = α C V² f), running at turbo frequency can spike power consumption so steeply that total energy per task increases.',
    },
    {
      id: 14,
      category: 'energy',
      question: 'Why is Intel RAPL unavailable in user-space on Windows 11 without a kernel driver?',
      answer:
        'Intel Running Average Power Limit (RAPL) relies on Model-Specific Registers (MSRs, e.g. MSR_PKG_ENERGY_STATUS at 0x611). ' +
        'The x86 architecture restricts MSR read instructions (RDMSR) to Ring-0 (kernel privilege). Windows does not expose a user-space sysfs interface like Linux does. ' +
        'Reading RAPL on Windows requires a signed Ring-0 kernel device driver like Intel PCM or WinRing0.',
    },
    {
      id: 15,
      category: 'measurement',
      question: 'Why should benchmark measurements always include warm-up runs before recorded trials?',
      answer:
        'Warm-up runs prime the CPU instruction and data caches (bringing working sets from DRAM into L1/L2), ' +
        'allow the operating system to map virtual memory pages into TLB without page faults during measurement, ' +
        'and allow the CPU frequency governor (Intel Speed Shift / P-states) to transition from low-power sleep states to steady operating frequency.',
    },
    {
      id: 16,
      category: 'measurement',
      question: 'Why is the median execution time often preferred over the mean in performance engineering?',
      answer:
        'Mean execution time is sensitive to transient operating system interruptions (e.g. background context switches, disk I/O interrupts, or garbage collection). ' +
        'These create extreme positive outliers that artificially skew the average. ' +
        'The median represents the 50th percentile and is robust against one-off system interrupts.',
    },
    {
      id: 17,
      category: 'measurement',
      question: 'Why must benchmark comparisons strictly verify mathematical equivalence before comparing speedup?',
      answer:
        'Performance comparisons are only scientifically valid if both programs compute the exact same mathematical function and produce equivalent outputs. ' +
        'If an implementation is faster because it terminated early due to a bug or calculated an incorrect result, claiming a speedup is fraudulent. ' +
        'Correctness is a non-negotiable prerequisite to performance evaluation.',
    },
    {
      id: 18,
      category: 'bound',
      question: 'What distinguishes a CPU-bound workload from a Memory-bound workload?',
      answer:
        'A CPU-bound workload has high arithmetic intensity (many ALU/FPU operations per byte of memory accessed). It keeps execution units saturated with low CPI. ' +
        'A memory-bound workload has low arithmetic intensity, repeatedly stalling execution units while waiting for cache lines to be fetched across the memory controller bus, resulting in high CPI.',
    },
    {
      id: 19,
      category: 'architecture',
      question: 'What is Amdahl’s Law and how does it relate to instruction optimization?',
      answer:
        'Amdahl\'s Law states that the overall speedup gained by optimizing a single component is limited by the fraction of execution time that component actually consumes: ' +
        'Speedup = 1 / ((1 - f_enhanced) + (f_enhanced / S)). ' +
        'Optimizing an instruction sequence that only accounts for 2% of program runtime will never yield more than a 2% overall speedup, no matter how fast that sequence becomes.',
    },
    {
      id: 20,
      category: 'energy',
      question: 'Why does this project explicitly state that energy cannot be fabricated on Windows user-space?',
      answer:
        'Scientific integrity and academic rigor. Multiplying CPU utilization by execution time by an arbitrary constant creates a fictitious number with zero empirical basis. ' +
        'True performance engineering requires honest measurement provenance: directly measured values must come from calibrated sensors or official counters; ' +
        'when unavailable, the limitation must be openly declared.',
    },
    {
      id: 21,
      category: 'architecture',
      question: 'What is the role of the Translation Lookaside Buffer (TLB) in memory hierarchy?',
      answer:
        'The TLB is a specialized hardware cache inside the CPU Memory Management Unit (MMU) that stores recent virtual-to-physical address translations. ' +
        'When striding across large memory buffers (e.g. spanning multiple 4 KB virtual pages), TLB misses occur, forcing expensive multi-level page table walks in DRAM that add dozens of stall cycles to memory access.',
    },
  ];

  const filteredViva = vivaQuestions.filter((q) => {
    const matchesCat = selectedVivaCategory === 'all' || q.category === selectedVivaCategory;
    const matchesSearch =
      vivaSearch === '' ||
      q.question.toLowerCase().includes(vivaSearch.toLowerCase()) ||
      q.answer.toLowerCase().includes(vivaSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Presentation Top Control Bar */}
      <div className="bg-[#0C1222] border border-cyan-800/40 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-400">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              B.Tech Academic Presentation Mode
            </h1>
            <p className="text-xs text-slate-400">
              Computer Organization & Architecture • Viva & Faculty Panel Demonstration
            </p>
          </div>
        </div>

        {/* Slide Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(1, prev - 1))}
            disabled={currentSlide <= 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
            title="Previous Slide (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-3 py-1 rounded bg-[#090D1A] border border-slate-800 text-cyan-300 font-semibold">
            Slide {currentSlide} of {totalSlides}
          </span>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(totalSlides, prev + 1))}
            disabled={currentSlide >= totalSlides}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
            title="Next Slide (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide Carousel Dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx + 1)}
            className={`h-2 rounded-full transition-all ${
              currentSlide === idx + 1
                ? 'w-8 bg-cyan-400 shadow-sm'
                : 'w-2 bg-slate-800 hover:bg-slate-700'
            }`}
            title={`Jump to Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE 1: TITLE & PROJECT SCOPE */}
      {/* --------------------------------------------------------------------- */}
      {currentSlide === 1 && (
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" /> B.Tech Computer Science & Engineering • 2nd Year
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                CPU Energy Efficiency Analyzer
              </h1>
              <p className="text-xl text-cyan-400 font-medium mt-2">
                Understanding the Hidden Cost of Program Execution
              </p>
            </div>

            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              An experimental Computer Organization and Architecture laboratory platform designed to measure,
              compare, and explain how algorithm structure, memory access patterns, compiler optimizations,
              and CPU microarchitecture govern execution time, processor workload, and energy efficiency.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
              <div className="p-3 bg-[#090D1A] rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Target Subject:</span>
                <strong className="text-slate-200">Computer Organization & Architecture (COA)</strong>
              </div>
              <div className="p-3 bg-[#090D1A] rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Core Paradigm:</span>
                <strong className="text-slate-200">Same Output • Different Costs</strong>
              </div>
              <div className="p-3 bg-[#090D1A] rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Detected Hardware:</span>
                <strong className="text-slate-200">{capabilities?.cpu_model || 'Intel x86-64 CPU'}</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-6 border-t border-slate-800/80">
            <span>Use Right Arrow Key (→) or Next button to advance</span>
            <span>Presentation Slide 1 of 8</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE 2: RESEARCH QUESTION & 5 PRIMARY OBJECTIVES */}
      {/* --------------------------------------------------------------------- */}
      {currentSlide === 2 && (
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Research Question & Core Objectives
            </div>

            {/* Research Question Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-800/50">
              <div className="text-xs text-cyan-300 font-semibold mb-1">Core Research Question:</div>
              <p className="text-base text-white font-medium leading-relaxed italic">
                "How do different algorithms, instruction-execution patterns, memory-access patterns, and CPU
                architecture characteristics affect execution time, processor workload, and energy consumption?"
              </p>
            </div>

            {/* 5 Primary Objectives Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-[#090D1A] rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-cyan-300">1. Verify Equivalence</div>
                <p className="text-slate-400">Strictly verify identical output before accepting comparisons.</p>
              </div>

              <div className="p-3 bg-[#090D1A] rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-indigo-300">2. Demonstrate COA</div>
                <p className="text-slate-400">Make CPI, instruction count, cache lines, and pipelines tangible.</p>
              </div>

              <div className="p-3 bg-[#090D1A] rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-300">3. Analyze Performance</div>
                <p className="text-slate-400">Repeated trials, statistics, IQR, and CPU performance equation.</p>
              </div>

              <div className="p-3 bg-[#090D1A] rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-300">4. Energy Rigor</div>
                <p className="text-slate-400">Power vs Energy; honest telemetry disclosures; zero fake values.</p>
              </div>

              <div className="p-3 bg-[#090D1A] rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-purple-300">5. Architectural Insights</div>
                <p className="text-slate-400">Rule-based 10-point analysis: what this proves vs what it does not prove.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-6 border-t border-slate-800/80">
            <span>Section: Project Foundations</span>
            <span>Presentation Slide 2 of 8</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE 3: COA ARCHITECTURAL CONCEPTS */}
      {/* --------------------------------------------------------------------- */}
      {currentSlide === 3 && (
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Core COA Principles Demonstrated
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#090D1A] rounded-xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  CPU Performance Equation
                </h3>
                <p className="text-slate-300 leading-relaxed font-mono">
                  Time = (IC × CPI) / Clock_Frequency
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Demonstrates that algorithmic improvements reduce dynamic Instruction Count (IC),
                  providing orders of magnitude greater speedup than raising clock frequency.
                </p>
              </div>

              <div className="p-4 bg-[#090D1A] rounded-xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Memory Hierarchy & 64-Byte Cache Lines
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Registers (&lt;1 cycle) → L1 (4 cycles) → L2 (14 cycles) → L3 (45 cycles) → DRAM (~200 cycles).
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Shows how sequential access satisfies 16 integers per 64-byte line, while strided traversal
                  induces cache misses that stall the CPU pipeline for hundreds of cycles.
                </p>
              </div>

              <div className="p-4 bg-[#090D1A] rounded-xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  5-Stage Pipelining & Hazards
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  IF → ID → EX → MEM → WB stages with concurrent instruction execution.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Demonstrates Read-After-Write (RAW) data hazards, hardware forwarding units, and
                  control hazard branch misprediction stalls.
                </p>
              </div>

              <div className="p-4 bg-[#090D1A] rounded-xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Compiler Transformations & Assembly
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Inspection of compiler-generated assembly under -O0 vs -O2.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Shows how register allocation eliminates stack memory spilling, and constant folding
                  evaluates loops at compile-time directly into constant registers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-6 border-t border-slate-800/80">
            <span>Section: Architectural Concepts</span>
            <span>Presentation Slide 3 of 8</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE 4: EXPERIMENT A DEMONSTRATION */}
      {/* --------------------------------------------------------------------- */}
      {currentSlide === 4 && (
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Experiment A: Iterative Summation vs Closed-Form Formula
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#090D1A] border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 text-sm">Method A: Iterative Accumulator O(N)</div>
                <div className="p-3 bg-[#070B14] rounded-lg border border-slate-800 text-slate-300">
                  long long sum = 0;<br />
                  for (int i = 0; i &lt; 1000000; i++) &#123;<br />
                  &nbsp;&nbsp;sum += i;<br />
                  &#125;
                </div>
                <div className="text-slate-400 font-sans text-xs">
                  • Executes 1,000,000 dynamic loop increments, comparisons, and branches.<br />
                  • Output: <strong>499999500000</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#090D1A] border border-cyan-800/50 space-y-2">
                <div className="font-bold text-cyan-300 text-sm">Method B: Closed-Form Formula O(1)</div>
                <div className="p-3 bg-[#070B14] rounded-lg border border-slate-800 text-cyan-300">
                  long long n = 999999;<br />
                  long long sum = n * (n + 1) / 2;
                </div>
                <div className="text-slate-400 font-sans text-xs">
                  • Executes 1 register add, 1 integer multiply (imul), 1 shift in 1 cycle.<br />
                  • Output: <strong>499999500000</strong> (VERIFIED IDENTICAL)
                </div>
              </div>
            </div>

            {/* Empirical Findings Callout */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-cyan-950/30 border border-emerald-800/40 text-xs">
              <h4 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Architectural Takeaway
              </h4>
              <p className="text-slate-300 leading-relaxed font-sans">
                Algorithmic formulation fundamentally alters the dynamic Instruction Count (IC).
                While hardware clock frequency changes yield fractional performance gains, reducing IC from O(N) to O(1)
                yields up to 1,000x execution speedup while producing the exact same mathematical result.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-6 border-t border-slate-800/80">
            <span>Section: Live Experiment A</span>
            <span>Presentation Slide 4 of 8</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE 5: EXPERIMENT B DEMONSTRATION */}
      {/* --------------------------------------------------------------------- */}
      {currentSlide === 5 && (
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Experiment B: Memory Access & Cache Locality
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-xl bg-[#090D1A] border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 text-sm">Sequential Traversal (Stride = 1)</div>
                <p className="text-slate-400 leading-relaxed font-sans">
                  • Traverses 1,000,000 integers in contiguous memory order.<br />
                  • Each 64-byte cache line brings in 16 integers. <strong>All 16 integers are consumed</strong> before next fetch.<br />
                  • Near 100% spatial locality; CPU hardware stream prefetcher keeps L1/L2 preloaded.<br />
                  • Verified Checksum: <strong>3999997</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#090D1A] border border-amber-800/50 space-y-2">
                <div className="font-bold text-amber-300 text-sm">Strided Traversal (Stride = 4 or 16)</div>
                <p className="text-slate-400 leading-relaxed font-sans">
                  • Sums identical 1,000,000 integers spanning a 16 MB array.<br />
                  • Every access lands on a different 64-byte cache line. <strong>Wastes up to 93.75% of memory bandwidth</strong>.<br />
                  • Frequent L1/L2 cache misses force execution pipeline to stall waiting for DRAM (~200 cycles).<br />
                  • Verified Checksum: <strong>3999997</strong> (MATCHED)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-800/40 text-xs">
              <h4 className="font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" /> Key Architectural Takeaway
              </h4>
              <p className="text-slate-300 leading-relaxed font-sans">
                Data layout and memory access patterns dictate performance on modern architectures.
                Even with identical arithmetic work (1,000,000 additions), memory stall latency can double or triple
                execution time due to cache line waste.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-6 border-t border-slate-800/80">
            <span>Section: Live Experiment B</span>
            <span>Presentation Slide 5 of 8</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE 6: MEASUREMENT PROVENANCE & ENERGY HONESTY */}
      {/* --------------------------------------------------------------------- */}
      {currentSlide === 6 && (
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Scientific Rigor & Energy Measurement Transparency
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Honest Disclosures on Windows
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  On Windows 11, Intel RAPL energy counters (MSR 0x611) require Ring-0 kernel drivers.
                  User-space applications cannot read hardware Joules directly.
                </p>
                <div className="p-3 bg-[#070B14] rounded-lg border border-amber-900/40 text-amber-300/90">
                  <strong>We do NOT fabricate fake energy metrics:</strong> When hardware counters are absent,
                  the analyzer displays an explicit UNAVAILABLE badge and separates theoretical models.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/50 space-y-2">
                <h3 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Linux RAPL Adapter Ready
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  When deployed on Linux or server environments, the application’s <code>LinuxRaplProvider</code>
                  reads physical micro-Joules directly from:
                </p>
                <div className="p-2.5 bg-[#070B14] rounded-lg border border-emerald-900/40 font-mono text-emerald-400 text-[11px]">
                  /sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Complete with 32-bit counter rollover compensation and package-level scoping.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#090D1A] border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong>Why Faster Execution ≠ Less Energy:</strong> Dynamic CMOS power scales quadratically with voltage (P = α C V² f).
              If the processor enters high-voltage Turbo Boost to finish sooner, the power spike can consume more total Joules
              than running at an efficient base frequency.
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-6 border-t border-slate-800/80">
            <span>Section: Measurement Provenance</span>
            <span>Presentation Slide 6 of 8</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE 7: ARCHITECTURE INSIGHTS & VIVA SUMMARY */}
      {/* --------------------------------------------------------------------- */}
      {currentSlide === 7 && (
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Architecture Insights: What This Proves vs Does NOT Prove
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/50 space-y-2">
                <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  What the Experiments Prove
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  <li>• Algorithmic structure determines dynamic instruction count (IC).</li>
                  <li>• Spatial locality in array traversal significantly reduces execution time for identical arithmetic work.</li>
                  <li>• Compiler optimizations (-O2) dramatically reduce memory stack spills into registers.</li>
                  <li>• High-resolution monotonic timing reveals clear performance divergence with identical outputs.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/50 space-y-2">
                <div className="font-bold text-rose-300 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  What the Experiments Do NOT Prove
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  <li>• Does NOT prove exact hardware cache miss counts without PMU performance counters.</li>
                  <li>• Does NOT prove Joules saved without physical power meters or kernel RAPL telemetry.</li>
                  <li>• Does NOT prove results apply universally across different CPU architectures.</li>
                  <li>• Does NOT claim arbitrary Docker container sandboxing without a running Docker daemon.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/30 to-blue-950/30 border border-indigo-800/40 text-xs">
              <span className="font-bold text-indigo-300 block mb-1">Final Student Conclusion for Panel:</span>
              <p className="text-slate-300 leading-relaxed italic">
                "Computer performance is the symbiotic interaction between software algorithms, compiler instruction generation,
                and hardware microarchitecture. True efficiency requires optimizing both Instruction Count (software) and Memory Hierarchy Locality (hardware)."
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-6 border-t border-slate-800/80">
            <span>Section: Evaluation Insights</span>
            <span>Presentation Slide 7 of 8</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE 8: INTERACTIVE VIVA GUIDE (20+ QUESTIONS) */}
      {/* --------------------------------------------------------------------- */}
      {currentSlide === 8 && (
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-2xl min-h-[500px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                  Interactive COA Viva Voce Preparation Guide (21 Questions)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Curriculum-aligned answers covering CPU equation, memory hierarchy, pipelining, compiler optimizations, and energy.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search viva questions..."
                  value={vivaSearch}
                  onChange={(e) => setVivaSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#090D1A] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All Questions' },
                { id: 'cpu_equation', label: 'CPU Equation' },
                { id: 'cache', label: 'Cache & Memory' },
                { id: 'pipelining', label: 'Pipelining' },
                { id: 'hazards', label: 'Hazards' },
                { id: 'compiler', label: 'Compiler Optimizations' },
                { id: 'energy', label: 'Power & Energy' },
                { id: 'measurement', label: 'Methodology' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedVivaCategory(c.id)}
                  className={`px-2.5 py-1 rounded-md border transition-colors ${
                    selectedVivaCategory === c.id
                      ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {filteredViva.map((q) => (
                <div key={q.id} className="p-3.5 rounded-xl bg-[#090D1A] border border-slate-800/80 text-xs">
                  <div className="font-bold text-cyan-300 text-xs mb-1 flex items-start gap-2">
                    <span className="text-slate-500 select-none">Q{q.id}.</span>
                    <span>{q.question}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5 whitespace-pre-line text-[11px] mt-1 border-l border-slate-800">
                    {q.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
            <span>Viva Guide: 21 Complete Academic Questions</span>
            <span>Presentation Slide 8 of 8</span>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { BookOpen, Cpu, Clock, Zap, ShieldCheck, HelpCircle, HardDrive, Terminal } from 'lucide-react';
import { SystemCapabilities } from '../types/api';

interface MethodologyPageProps {
  capabilities: SystemCapabilities | null;
}

export const MethodologyPage: React.FC<MethodologyPageProps> = ({ capabilities }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center space-x-2 text-blue-400 mb-1">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Methodology & System Architecture</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white">Scientific Measurement Framework</h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Grounding principles for hardware telemetry, high-resolution execution timing, process resource accounting,
          and transparent disclosures for Computer Organization and Architecture (COA) evaluation.
        </p>
      </div>

      {/* The Five Questions Framework */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">
          The Five Foundational Engineering Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <h4 className="font-bold text-blue-400">1. What computation does the program perform?</h4>
            <p className="text-slate-300">
              Validated using strict input parameters and programmatic output equivalence checks.
              Both candidate implementations must produce identical output (e.g. <code>499999500000</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <h4 className="font-bold text-cyan-400">2. How long does it take to execute?</h4>
            <p className="text-slate-300">
              Measured via <code>time.perf_counter_ns()</code>, a monotonic high-resolution hardware clock.
              Repeated trials isolate warmup runs from measured trials; medians are used to resist OS scheduling noise.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <h4 className="font-bold text-violet-400">3. What processor and memory resources does it use?</h4>
            <p className="text-slate-300">
              Sampled using the operating system process table via <code>psutil</code>. Reports physical Resident
              Set Size (RSS peak in MB) and process CPU utilization percentage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <h4 className="font-bold text-amber-400">4. Can its energy consumption be measured reliably here?</h4>
            <p className="text-slate-300">
              <strong>Transparent honesty:</strong> Hardware energy counters (RAPL) require Linux <code>/sys/class/powercap</code> or
              ring-0 kernel drivers. On Windows, user-mode RAPL is unavailable; energy savings cannot be fabricated.
            </p>
          </div>
        </div>
      </div>

      {/* Deep Dive Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Timing & Statistical Rigor */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>Execution Timing & Statistical Rigor</span>
          </div>
          <div className="space-y-2 text-slate-300 leading-relaxed">
            <p>
              <strong>High-Resolution Monotonic Clock: </strong>
              Wall-clock execution time is captured using <code>time.perf_counter_ns()</code> before and after
              the subprocess lifecycle. It never goes backward and is not subject to system clock adjustments.
            </p>
            <p>
              <strong>Warm-Up Repetitions: </strong>
              Initial runs (1–2 trials) warm the CPU instruction cache (L1I), data cache (L1D/L2), page tables,
              and Python bytecode cache. Warm-up runs are recorded but excluded from statistical summaries.
            </p>
            <p>
              <strong>Why Medians instead of Means? </strong>
              Operating system thread scheduling, background interrupts, and page faults introduce positive outliers.
              The median represents the central tendency of program latency with highest empirical resilience.
            </p>
          </div>
        </div>

        {/* Hardware Energy & RAPL */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>Hardware Energy vs Operating System Limits</span>
          </div>
          <div className="space-y-2 text-slate-300 leading-relaxed">
            <p>
              <strong>Intel/AMD RAPL on Linux: </strong>
              Running Average Power Limit (RAPL) provides MSRs exposed via Linux sysfs (<code>/sys/class/powercap/intel-rapl</code>)
              measuring energy consumption in microjoules (uJ) at the CPU package level.
            </p>
            <p>
              <strong>Why Unavailable on Windows? </strong>
              Microsoft Windows does not expose an unprivileged user-mode API for Intel RAPL counters. Accessing
              MSRs on Windows requires a signed kernel-mode driver (e.g., WinRing0 or Intel PCM).
            </p>
            <p>
              <strong>Package Scope vs Application Energy: </strong>
              Hardware RAPL counters measure total processor package energy (including cores, memory controller, and uncore).
              They represent the entire socket workload during the measurement window, not isolated process energy.
            </p>
          </div>
        </div>
      </div>

      {/* Educational TDP Energy Model */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Educational Modeled Energy Estimation (Transparent Formula)</span>
        </h3>
        <p className="text-slate-300 leading-relaxed">
          When physical hardware energy counters are absent, an optional educational model can estimate energy
          based on the rated Thermal Design Power (TDP) envelope and sampled utilization:
        </p>
        <div className="p-3 bg-slate-950 rounded-xl font-mono text-cyan-300 border border-slate-800">
          E (Joules) = [ P_idle + (P_tdp - P_idle) &times; (Process_CPU_% / 100) ] &times; (Execution_Time_ms / 1000)
        </div>
        <p className="text-slate-400 leading-relaxed">
          <strong className="text-amber-400">Scientific Disclaimer: </strong>
          This model is strictly uncalibrated and intended for instructional demonstration. It assumes linear dynamic power
          scaling and ignores dynamic voltage and frequency scaling (DVFS), C-state sleep residency, and instruction-specific
          current draw (e.g., AVX-512 vs integer ALU).
        </p>
      </div>

      {/* COA Viva Examination Guide */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
          <HelpCircle className="w-4 h-4" />
          <span>Computer Organization & Architecture (COA) Viva Guide</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h5 className="font-bold text-white mb-1">Q1: Why can two implementations have the same output with different computational costs?</h5>
            <p className="text-slate-300">
              An iterative accumulator algorithm executes $O(N)$ instruction loops in the CPU pipeline, executing branch instructions,
              counter increments, and additions for every element. The closed-form formula evaluates $N(N+1)/2$ in $O(1)$ constant time,
              bypassing millions of CPU pipeline clock cycles.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h5 className="font-bold text-white mb-1">Q2: What is the fundamental difference between Power and Energy?</h5>
            <p className="text-slate-300">
              Power is the instantaneous rate of energy consumption measured in Watts (Joules per second).
              Energy is the total computational work performed over time: Energy (Joules) = Power (Watts) &times; Time (seconds).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h5 className="font-bold text-white mb-1">Q3: Why doesn't shorter execution time automatically mean zero energy?</h5>
            <p className="text-slate-300">
              CPUs consume static leakage power even when running at minimal load. In addition, aggressive dynamic boost
              clocks (Turbo Boost) operate at higher core voltages (V_dd), where dynamic power scales quadratically
              (P = C &times; V&sup2; &times; f). A burst of computation at peak voltage may consume significant instantaneous power.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h5 className="font-bold text-white mb-1">Q4: How does compiler optimization affect the results?</h5>
            <p className="text-slate-300">
              Compilers such as GCC with <code>-O2</code> or <code>-O3</code> can perform loop unrolling, vectorization (SIMD),
              or even recognize arithmetic progressions and substitute the loop with a closed formula at compile time.
            </p>
          </div>
        </div>
      </div>

      {/* Live System Capabilities Matrix */}
      {capabilities && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Host Runtime Capability Matrix (Live Probe)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-800 font-mono">
                <tr><td className="py-2 text-slate-400">Processor Model</td><td className="py-2 text-white">{capabilities.cpu_model}</td></tr>
                <tr><td className="py-2 text-slate-400">Core Topology</td><td className="py-2 text-white">{capabilities.physical_cores} Physical / {capabilities.logical_cores} Logical Cores</td></tr>
                <tr><td className="py-2 text-slate-400">Operating System</td><td className="py-2 text-white">{capabilities.os_name} {capabilities.os_version} ({capabilities.architecture})</td></tr>
                <tr><td className="py-2 text-slate-400">Python Runtime</td><td className="py-2 text-white">Python {capabilities.python_version}</td></tr>
                <tr><td className="py-2 text-slate-400">GCC C Compiler</td><td className="py-2 text-white">{capabilities.gcc_available ? capabilities.gcc_version || 'Available' : 'Not installed'}</td></tr>
                <tr><td className="py-2 text-slate-400">G++ C++ Compiler</td><td className="py-2 text-white">{capabilities.gpp_available ? capabilities.gpp_version || 'Available' : 'Not installed'}</td></tr>
                <tr><td className="py-2 text-slate-400">Hardware Energy Backend</td><td className="py-2 text-white">{capabilities.energy_backend.backend_type} (Available: {capabilities.energy_backend.available ? 'Yes' : 'No'})</td></tr>
                <tr><td className="py-2 text-slate-400">Process Isolation Mode</td><td className="py-2 text-white">{capabilities.isolation_mode}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

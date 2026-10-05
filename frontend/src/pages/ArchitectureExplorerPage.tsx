import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Zap,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const ArchitectureExplorerPage: React.FC = () => {
  // ---------------------------------------------------------------------------
  // 1. CPU Performance Equation Calculator State
  // ---------------------------------------------------------------------------
  const [instructionCount, setInstructionCount] = useState<number>(1000000);
  const [cpi, setCpi] = useState<number>(1.2);
  const [clockFreqGhz, setClockFreqGhz] = useState<number>(2.4);

  // Derived calculation
  // Total cycles = IC * CPI
  // Cycle time (ns) = 1 / f(GHz)
  // Execution time (ms) = (IC * CPI) / (f * 1e9) * 1000 = (IC * CPI) / (f * 1e6)
  const totalCycles = instructionCount * cpi;
  const cycleTimeNs = (1 / clockFreqGhz);
  const executionTimeMs = (totalCycles / (clockFreqGhz * 1e6));

  // ---------------------------------------------------------------------------
  // 2. 5-Stage Pipeline Simulator State
  // ---------------------------------------------------------------------------
  const [pipelineMode, setPipelineMode] = useState<
    'normal' | 'data_hazard_stall' | 'data_hazard_forward' | 'branch_hazard'
  >('normal');
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Pipeline instructions definitions
  const instructionsList = [
    { id: 1, name: 'I1: ADD R1, R2, R3', type: 'alu' },
    { id: 2, name: 'I2: SUB R4, R1, R5', type: 'alu_dep' }, // depends on R1 from I1
    { id: 3, name: 'I3: AND R6, R7, R8', type: 'alu' },
    { id: 4, name: 'I4: OR  R9, R10, R11', type: 'alu' },
    { id: 5, name: 'I5: XOR R12, R13, R14', type: 'alu' },
  ];

  // Pipeline stage mapping for cycle (1..10)
  // Stages: IF -> ID -> EX -> MEM -> WB
  const getStageForInstruction = (instIdx: number, cycle: number) => {
    if (pipelineMode === 'normal') {
      // Ideal pipeline: Inst i enters stage at cycle = i + stage_offset
      // stages: 0: IF, 1: ID, 2: EX, 3: MEM, 4: WB
      const startCycle = instIdx + 1;
      const stageIdx = cycle - startCycle;
      const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
      if (stageIdx >= 0 && stageIdx < 5) return stages[stageIdx];
      return stageIdx >= 5 ? 'DONE' : 'WAIT';
    } else if (pipelineMode === 'data_hazard_stall') {
      // RAW Hazard without forwarding: I2 depends on R1 produced by I1 at cycle 5 (WB).
      // I2 must stall in ID until cycle 5, so it enters EX at cycle 6! (2 stall cycles)
      if (instIdx === 0) {
        // I1: normal 1..5
        const stageIdx = cycle - 1;
        const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
        if (stageIdx >= 0 && stageIdx < 5) return stages[stageIdx];
        return stageIdx >= 5 ? 'DONE' : 'WAIT';
      } else if (instIdx === 1) {
        // I2: IF at 2, ID at 3, STALL at 4, STALL at 5, EX at 6, MEM at 7, WB at 8
        if (cycle < 2) return 'WAIT';
        if (cycle === 2) return 'IF';
        if (cycle === 3) return 'ID';
        if (cycle === 4) return 'STALL (RAW)';
        if (cycle === 5) return 'STALL (RAW)';
        if (cycle === 6) return 'EX';
        if (cycle === 7) return 'MEM';
        if (cycle === 8) return 'WB';
        return 'DONE';
      } else {
        // Subsequent instructions delayed by 2 stall bubbles
        const startCycle = instIdx + 1 + 2;
        const stageIdx = cycle - startCycle;
        const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
        if (stageIdx >= 0 && stageIdx < 5) return stages[stageIdx];
        return stageIdx >= 5 ? 'DONE' : 'WAIT';
      }
    } else if (pipelineMode === 'data_hazard_forward') {
      // With ALU forwarding (EX-to-EX bypass), I1 result available at end of EX (cycle 3)
      // I2 enters EX at cycle 4 immediately using bypassed value! (0 stalls)
      const startCycle = instIdx + 1;
      const stageIdx = cycle - startCycle;
      const stages = ['IF', 'ID', 'EX (FWD)', 'MEM', 'WB'];
      if (stageIdx >= 0 && stageIdx < 5) return stages[stageIdx];
      return stageIdx >= 5 ? 'DONE' : 'WAIT';
    } else {
      // Branch Hazard: I1 is BEQ, branch resolved at EX stage (cycle 3).
      // Fetches during cycle 2 and 3 are flushed! (2 penalty bubbles)
      if (instIdx === 0) {
        const stageIdx = cycle - 1;
        const stages = ['IF', 'ID', 'EX (Branch)', 'MEM', 'WB'];
        if (stageIdx >= 0 && stageIdx < 5) return stages[stageIdx];
        return stageIdx >= 5 ? 'DONE' : 'WAIT';
      } else if (instIdx === 1) {
        if (cycle === 2) return 'IF';
        if (cycle >= 3 && cycle <= 4) return 'FLUSHED';
        return 'WAIT';
      } else {
        // Target instruction fetched at cycle 4
        const startCycle = instIdx + 2;
        const stageIdx = cycle - startCycle;
        const stages = ['IF (Target)', 'ID', 'EX', 'MEM', 'WB'];
        if (stageIdx >= 0 && stageIdx < 5) return stages[stageIdx];
        return stageIdx >= 5 ? 'DONE' : 'WAIT';
      }
    }
  };

  // Auto-play timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentCycle((prev) => {
          if (prev >= 10) {
            setIsPlaying(false);
            return 10;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const getStageColor = (stage: string) => {
    if (stage === 'IF' || stage.startsWith('IF')) return 'bg-blue-900/60 border-blue-600 text-blue-200';
    if (stage === 'ID') return 'bg-indigo-900/60 border-indigo-600 text-indigo-200';
    if (stage === 'EX' || stage.startsWith('EX')) return 'bg-cyan-900/60 border-cyan-600 text-cyan-200';
    if (stage === 'MEM') return 'bg-amber-900/60 border-amber-600 text-amber-200';
    if (stage === 'WB') return 'bg-emerald-900/60 border-emerald-600 text-emerald-200';
    if (stage.includes('STALL')) return 'bg-red-900/60 border-red-600 text-red-200 animate-pulse';
    if (stage === 'FLUSHED') return 'bg-gray-800 border-gray-600 text-gray-400 line-through';
    if (stage === 'DONE') return 'bg-slate-900/40 border-slate-800 text-slate-500';
    return 'bg-slate-900/20 border-slate-900 text-slate-700';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-cyan-400" />
          Computer Organization & Architecture Explorer
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Interactive microarchitectural models: CPU Performance Equation, 5-Stage Pipeline Hazards,
          Register & ALU Dataflow, and Compiler Transformations.
        </p>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. CPU PERFORMANCE EQUATION INTERACTIVE CALCULATOR */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              1. The Fundamental CPU Performance Equation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore how changes in Instruction Count, Cycles Per Instruction (CPI), and Clock Frequency alter execution time.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#080D1A] border border-cyan-800/50 text-cyan-300 font-mono text-xs">
            CPU Time = (Instruction Count × CPI) / Clock Frequency
          </div>
        </div>

        {/* Sliders & Calculation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Controls Column */}
          <div className="lg:col-span-2 space-y-5 bg-[#090D1A] p-5 rounded-xl border border-slate-800/80">
            {/* Instruction Count Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-slate-300">
                  Instruction Count (IC): <strong className="text-cyan-400">{instructionCount.toLocaleString()}</strong>
                </span>
                <span className="text-slate-500">Machine instructions executed</span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000000"
                step="10000"
                value={instructionCount}
                onChange={(e) => setInstructionCount(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setInstructionCount(1000)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Formula Preset (1,000)
                </button>
                <button
                  onClick={() => setInstructionCount(1000000)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Gauss Loop (1,000,000)
                </button>
                <button
                  onClick={() => setInstructionCount(5000000)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Heavy (5,000,000)
                </button>
              </div>
            </div>

            {/* CPI Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-slate-300">
                  Cycles Per Instruction (CPI): <strong className="text-amber-400">{cpi.toFixed(2)}</strong>
                </span>
                <span className="text-slate-500">Average clock cycles per retired instruction</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.05"
                value={cpi}
                onChange={(e) => setCpi(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setCpi(0.75)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Superscalar ILP (0.75)
                </button>
                <button
                  onClick={() => setCpi(1.0)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Ideal Pipeline (1.00)
                </button>
                <button
                  onClick={() => setCpi(2.5)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Memory Stalls (2.50)
                </button>
              </div>
            </div>

            {/* Clock Frequency Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-slate-300">
                  Clock Frequency (f): <strong className="text-emerald-400">{clockFreqGhz.toFixed(2)} GHz</strong>
                </span>
                <span className="text-slate-500">CPU clock rate in billions of cycles/sec</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={clockFreqGhz}
                onChange={(e) => setClockFreqGhz(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setClockFreqGhz(2.4)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Host i5-1135G7 Base (2.40 GHz)
                </button>
                <button
                  onClick={() => setClockFreqGhz(4.2)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Turbo Boost (4.20 GHz)
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-gradient-to-br from-[#0F172A] to-[#0A1020] p-5 rounded-xl border border-cyan-800/40 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-4">
                Calculated Theoretical Performance
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400">Total CPU Execution Time</div>
                  <div className="text-2xl font-mono font-bold text-white mt-0.5">
                    {executionTimeMs < 1
                      ? `${(executionTimeMs * 1000).toFixed(2)} µs`
                      : `${executionTimeMs.toFixed(3)} ms`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400">Total Clock Cycles</div>
                    <div className="text-sm font-mono text-slate-200 font-semibold">
                      {Math.round(totalCycles).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Clock Cycle Time</div>
                    <div className="text-sm font-mono text-slate-200 font-semibold">
                      {cycleTimeNs.toFixed(3)} ns
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-lg bg-cyan-950/30 border border-cyan-900/50 text-[11px] text-cyan-300/90 leading-relaxed">
              <strong>COA Principle:</strong> Reducing Instruction Count through algorithmic optimization (e.g. Gauss formula)
              yields a 1,000x execution improvement, whereas raising clock frequency yields only fractional gains.
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. 5-STAGE CPU PIPELINE SIMULATOR & HAZARDS */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              2. Classic 5-Stage CPU Instruction Pipeline & Hazards
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize Instruction Fetch (IF), Decode (ID), Execute (EX), Memory (MEM), and Write Back (WB) across execution cycles.
            </p>
          </div>

          {/* Pipeline Mode Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setPipelineMode('normal');
                setCurrentCycle(1);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                pipelineMode === 'normal'
                  ? 'bg-indigo-900/60 border-indigo-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              Ideal Pipeline (No Hazards)
            </button>
            <button
              onClick={() => {
                setPipelineMode('data_hazard_stall');
                setCurrentCycle(1);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                pipelineMode === 'data_hazard_stall'
                  ? 'bg-red-900/60 border-red-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              RAW Data Hazard (Stall Bubbles)
            </button>
            <button
              onClick={() => {
                setPipelineMode('data_hazard_forward');
                setCurrentCycle(1);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                pipelineMode === 'data_hazard_forward'
                  ? 'bg-cyan-900/60 border-cyan-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              RAW with Forwarding / Bypass
            </button>
            <button
              onClick={() => {
                setPipelineMode('branch_hazard');
                setCurrentCycle(1);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                pipelineMode === 'branch_hazard'
                  ? 'bg-amber-900/60 border-amber-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              Control Hazard (Branch Penalty)
            </button>
          </div>
        </div>

        {/* Step Controls */}
        <div className="flex items-center justify-between mt-5 py-3 px-4 bg-[#090D1A] rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play Simulation'}
            </button>
            <button
              onClick={() => setCurrentCycle((prev) => Math.max(1, prev - 1))}
              disabled={currentCycle <= 1}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs disabled:opacity-40"
            >
              Previous Cycle
            </button>
            <button
              onClick={() => setCurrentCycle((prev) => Math.min(10, prev + 1))}
              disabled={currentCycle >= 10}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs disabled:opacity-40"
            >
              Next Cycle <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentCycle(1);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="font-mono text-sm">
            Current Clock Cycle: <strong className="text-cyan-400 text-base">{currentCycle}</strong> / 10
          </div>
        </div>

        {/* Cycle Timeline Grid */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 text-left w-48">Instruction</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                  <th
                    key={c}
                    className={`py-2 px-2 text-center transition-colors ${
                      c === currentCycle
                        ? 'bg-cyan-950/60 text-cyan-300 font-bold border-b-2 border-cyan-400'
                        : ''
                    }`}
                  >
                    CC {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {instructionsList.map((inst, idx) => (
                <tr key={inst.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-slate-300 flex items-center gap-1.5">
                    {inst.name}
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => {
                    const stage = getStageForInstruction(idx, c);
                    const isCurrent = c === currentCycle;
                    return (
                      <td
                        key={c}
                        className={`py-2 px-1 text-center ${
                          isCurrent ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        <span
                          className={`inline-block w-full py-1 px-1 rounded text-[11px] font-semibold border ${getStageColor(
                            stage
                          )}`}
                        >
                          {stage}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Hazard Explanation Box */}
        <div className="mt-5 p-4 rounded-xl bg-[#090D1A] border border-slate-800 text-xs text-slate-300 leading-relaxed">
          {pipelineMode === 'normal' && (
            <p>
              <strong className="text-emerald-400">Ideal Pipelining (CPI = 1.0):</strong> Five instructions execute concurrently across the 5 stages.
              Once the pipeline fills at Cycle 5, one instruction completes every single cycle, achieving maximum theoretical throughput.
            </p>
          )}
          {pipelineMode === 'data_hazard_stall' && (
            <p>
              <strong className="text-red-400">RAW Data Hazard Without Forwarding (CPI {'>'} 1.0):</strong> Instruction <code>I2</code> requires operand <code>R1</code> computed by <code>I1</code>.
              Because <code>I1</code> does not write to the register file until stage <code>WB</code> (Cycle 5), <code>I2</code> must stall in decode (ID) for 2 cycles,
              inserting <strong>stall bubbles</strong> (NOPs) that degrade overall execution throughput.
            </p>
          )}
          {pipelineMode === 'data_hazard_forward' && (
            <p>
              <strong className="text-cyan-400">Hardware Forwarding / Bypassing Unit:</strong> The result of <code>I1</code> is produced at the end of stage <code>EX</code> (Cycle 3).
              A hardware multiplexer forwards the result directly from the EX/MEM pipeline register to the ALU input of <code>I2</code>,
              eliminating the 2 stall bubbles completely and maintaining CPI = 1.0!
            </p>
          )}
          {pipelineMode === 'branch_hazard' && (
            <p>
              <strong className="text-amber-400">Control Hazard / Branch Misprediction Penalty:</strong> When a conditional branch instruction is fetched, the CPU does not know whether the branch is taken
              until the condition is evaluated at stage <code>EX</code>. If mispredicted, the instructions fetched in the interim must be <strong>flushed</strong>,
              wasting fetch cycles and imposing a 2-cycle branch penalty.
            </p>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. REGISTER & ALU DATAFLOW ARCHITECTURE */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-amber-400" />
          3. Register File & ALU Dataflow Architecture
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          How operands flow between high-speed internal processor registers, execution units, and the memory bus interface.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          {/* Program Counter & Instruction Cache */}
          <div className="p-4 rounded-xl bg-[#090D1A] border border-blue-900/60 flex flex-col justify-between">
            <div>
              <div className="text-blue-400 font-bold uppercase tracking-wider mb-2">1. Fetch Stage</div>
              <div className="space-y-1.5 text-slate-300">
                <div className="p-2 rounded bg-blue-950/40 border border-blue-800/40">
                  <span className="text-slate-400">PC / RIP:</span> 0x00401580
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">L1 I-Cache:</span> 32 KB 8-way
                </div>
              </div>
            </div>
            <div className="text-[11px] text-blue-300/80 mt-3">
              Fetches 64-bit instruction bytes into the Instruction Register (IR).
            </div>
          </div>

          {/* Register File */}
          <div className="p-4 rounded-xl bg-[#090D1A] border border-indigo-900/60 flex flex-col justify-between">
            <div>
              <div className="text-indigo-400 font-bold uppercase tracking-wider mb-2">2. Register File</div>
              <div className="space-y-1.5 text-slate-300">
                <div className="p-1.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px]">
                  <strong>RAX/EAX:</strong> Accumulator
                </div>
                <div className="p-1.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px]">
                  <strong>RBX/EBX:</strong> Base register
                </div>
                <div className="p-1.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px]">
                  <strong>RCX/ECX:</strong> Loop Counter
                </div>
                <div className="p-1.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px]">
                  <strong>RDX/EDX:</strong> Data register
                </div>
              </div>
            </div>
            <div className="text-[11px] text-indigo-300/80 mt-3">
              Provides two 64-bit operand reads per cycle in &lt;0.5 ns latency.
            </div>
          </div>

          {/* ALU Execution Unit */}
          <div className="p-4 rounded-xl bg-[#090D1A] border border-cyan-900/60 flex flex-col justify-between">
            <div>
              <div className="text-cyan-400 font-bold uppercase tracking-wider mb-2">3. Arithmetic Logic Unit</div>
              <div className="space-y-2 text-slate-300">
                <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/40 text-center font-bold text-cyan-200">
                  ALU (Add / Sub / Mul / Div / Bitwise)
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="text-slate-400">FLAGS Register:</span> [ZF, CF, SF, OF]
                </div>
              </div>
            </div>
            <div className="text-[11px] text-cyan-300/80 mt-3">
              Performs 64-bit integer addition/multiplication in 1 clock cycle.
            </div>
          </div>

          {/* Memory Bus Interface */}
          <div className="p-4 rounded-xl bg-[#090D1A] border border-amber-900/60 flex flex-col justify-between">
            <div>
              <div className="text-amber-400 font-bold uppercase tracking-wider mb-2">4. Memory Subsystem</div>
              <div className="space-y-1.5 text-slate-300">
                <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/40 text-[11px]">
                  L1 D-Cache (48 KB, 4 cycles)
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                  L2 Cache (1.25 MB, 14 cycles)
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                  L3 Cache (8 MB, ~50 cycles)
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                  DRAM (16 GB, ~200 cycles)
                </div>
              </div>
            </div>
            <div className="text-[11px] text-amber-300/80 mt-3">
              Cache misses force the execution pipeline to stall for hundreds of cycles.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

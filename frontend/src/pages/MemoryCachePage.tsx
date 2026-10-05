import React, { useState } from 'react';
import {
  Layers,
  Database,
  Cpu,
  Zap,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { SystemCapabilities } from '../types/api';

interface MemoryCachePageProps {
  capabilities: SystemCapabilities | null;
  onLaunchExperimentB?: () => void;
}

export const MemoryCachePage: React.FC<MemoryCachePageProps> = ({
  capabilities,
  onLaunchExperimentB,
}) => {
  const [stride, setStride] = useState<number>(1);
  const [arraySizeMb, setArraySizeMb] = useState<number>(16);

  // 64-byte cache line holds 16 integers of 4 bytes each.
  // When stride = s, out of 16 integers loaded in a 64-byte line, how many are used?
  // If s = 1: all 16 integers used (100% utilization)
  // If s = 2: 8 integers used (50% utilization)
  // If s = 4: 4 integers used (25% utilization)
  // If s = 8: 2 integers used (12.5% utilization)
  // If s >= 16: only 1 integer used per line (6.25% utilization, 93.75% wasted memory bus bandwidth!)
  const usedPerLine = Math.max(1, Math.floor(16 / stride));
  const utilizationPct = ((usedPerLine / 16) * 100).toFixed(1);
  const wastedPct = (100 - parseFloat(utilizationPct)).toFixed(1);

  // Simulated cache miss penalty vs L1 hits
  const l1LatencyCycles = 4;
  const l2LatencyCycles = 14;
  const l3LatencyCycles = 45;
  const dramLatencyCycles = 200;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-cyan-400" />
          Memory & Cache Hierarchy Lab
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore CPU cache architecture, 64-byte cache lines, spatial and temporal locality,
          and the performance penalty of strided memory access.
        </p>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. MEMORY HIERARCHY PYRAMID & DETECTED HOST HARDWARE */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              1. The Memory Hierarchy & Latency Pyramid
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Detected host processor: <strong className="text-slate-200">{capabilities?.cpu_model || 'Intel Core Processor'}</strong>
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/50">
            64-Byte Cache Line Architecture
          </span>
        </div>

        {/* Visual Pyramid */}
        <div className="mt-6 space-y-3 font-mono text-xs">
          {/* Registers */}
          <div className="w-3/12 mx-auto bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-cyan-500 rounded-lg p-3 text-center shadow-lg">
            <div className="font-bold text-cyan-200 text-sm">CPU Registers</div>
            <div className="text-[11px] text-slate-300 mt-0.5">~1 KB • &lt; 0.5 ns (&lt; 1 cycle)</div>
          </div>

          {/* L1 Cache */}
          <div className="w-5/12 mx-auto bg-[#0E162D] border border-blue-600 rounded-lg p-3 text-center shadow-md">
            <div className="font-bold text-blue-200 text-sm">L1 Data / Instruction Cache</div>
            <div className="text-[11px] text-slate-300 mt-0.5">48 KB D-Cache per core • ~1.2 ns (4 cycles)</div>
          </div>

          {/* L2 Cache */}
          <div className="w-7/12 mx-auto bg-[#0C1326] border border-indigo-600 rounded-lg p-3 text-center shadow-md">
            <div className="font-bold text-indigo-200 text-sm">L2 Dedicated Cache</div>
            <div className="text-[11px] text-slate-300 mt-0.5">1.25 MB per core • ~4.5 ns (14 cycles)</div>
          </div>

          {/* L3 Cache */}
          <div className="w-9/12 mx-auto bg-[#0A0F1E] border border-purple-600 rounded-lg p-3 text-center shadow-md">
            <div className="font-bold text-purple-200 text-sm">L3 Shared Smart Cache</div>
            <div className="text-[11px] text-slate-300 mt-0.5">8.0 MB Shared • ~15 ns (~45 cycles)</div>
          </div>

          {/* Main Memory DRAM */}
          <div className="w-11/12 mx-auto bg-[#080B17] border border-amber-600 rounded-lg p-3 text-center shadow-md">
            <div className="font-bold text-amber-200 text-sm">Main System Memory (DRAM)</div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {capabilities?.total_memory_gb.toFixed(1) || '16.0'} GB DDR4/LPDDR4x • ~60–80 ns (~200 cycles)
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-[#090D1A] border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <strong className="text-cyan-400">The "Memory Wall" in Computer Architecture:</strong> While CPU ALU instructions execute in &lt;1 cycle,
          reading data that misses all cache levels and must be fetched from DRAM requires approximately <strong>200 clock cycles</strong>.
          The CPU execution pipeline must stall during this period unless compiler optimization and spatial locality ensure data is already present in cache.
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. SPATIAL LOCALITY & 64-BYTE CACHE LINE VISUALIZER */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              2. 64-Byte Cache Line Utilization & Stride Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstrates why sequential traversal (stride 1) achieves high spatial locality, while strided access wastes cache bandwidth.
            </p>
          </div>

          {/* Stride Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1">Stride:</span>
            {[1, 2, 4, 8, 16, 64].map((s) => (
              <button
                key={s}
                onClick={() => setStride(s)}
                className={`text-xs px-2.5 py-1 rounded border font-mono transition-colors ${
                  stride === s
                    ? 'bg-amber-900/60 text-amber-300 border-amber-500 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Cache Line Block Visualizer */}
        <div className="mt-6 bg-[#090D1A] p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-3 text-xs">
            <span className="font-semibold text-slate-200">
              Single 64-Byte L1 Cache Line (Holds 16 × 32-bit Integers)
            </span>
            <span className="font-mono text-cyan-400">
              Utilization: <strong className="text-white">{utilizationPct}%</strong> ({usedPerLine} / 16 words used)
            </span>
          </div>

          {/* 16 Words Grid */}
          <div className="grid grid-cols-16 gap-1 font-mono text-[11px] text-center">
            {Array.from({ length: 16 }).map((_, idx) => {
              // Word is used if index is a multiple of stride
              const isUsed = idx % stride === 0;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded border flex flex-col items-center justify-center transition-all ${
                    isUsed
                      ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200 font-bold shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-600'
                  }`}
                  title={`Word ${idx} (Bytes ${idx * 4}-${idx * 4 + 3}): ${isUsed ? 'READ BY CPU' : 'WASTED'}`}
                >
                  <span>W{idx}</span>
                  <span className="text-[9px] mt-0.5 font-normal">
                    {isUsed ? 'USED' : 'SKIP'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Metrics & Impact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-800/80 text-xs">
            <div className="p-3 bg-[#0C1222] rounded-lg border border-slate-800">
              <div className="text-slate-400">Spatial Locality Status</div>
              <div className="text-sm font-bold text-white mt-1">
                {stride === 1
                  ? 'Optimal (100% Contiguous)'
                  : stride < 16
                  ? `Partial (${utilizationPct}% utilized)`
                  : 'Zero Spatial Locality'}
              </div>
            </div>

            <div className="p-3 bg-[#0C1222] rounded-lg border border-slate-800">
              <div className="text-slate-400">Memory Bus Bandwidth Wasted</div>
              <div className="text-sm font-bold text-rose-400 mt-1">
                {wastedPct}% of fetched bytes discarded
              </div>
            </div>

            <div className="p-3 bg-[#0C1222] rounded-lg border border-slate-800">
              <div className="text-slate-400">Hardware Stream Prefetcher</div>
              <div className="text-sm font-bold text-cyan-300 mt-1">
                {stride <= 4 ? 'Predictable Linear Stream' : 'Prefetcher Ineffective / Thrashing'}
              </div>
            </div>
          </div>
        </div>

        {/* Experiment B Direct Callout */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-cyan-950/30 border border-cyan-800/40 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Verified in Experiment B (Memory Stride Benchmark)
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Run sequential vs strided traversal on a 16 MB array to measure the empirical latency penalty on your CPU.
            </p>
          </div>
          {onLaunchExperimentB && (
            <button
              onClick={onLaunchExperimentB}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Open Experiment B <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

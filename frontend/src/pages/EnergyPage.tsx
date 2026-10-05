import React, { useState } from 'react';
import {
  Zap,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Sliders,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { SystemCapabilities } from '../types/api';

interface EnergyPageProps {
  capabilities: SystemCapabilities | null;
}

export const EnergyPage: React.FC<EnergyPageProps> = ({ capabilities }) => {
  const [modelTdpWatts, setModelTdpWatts] = useState<number>(28.0);
  const [modelExecTimeMs, setModelExecTimeMs] = useState<number>(25.0);
  const [modelCpuLoadPct, setModelCpuLoadPct] = useState<number>(100.0);

  // Educational TDP Scaling formula (explicitly labeled uncalibrated)
  // Estimated energy (Joules) = (TDP * (CPU Load / 100)) * (Execution Time (s))
  const estimatedJoules = (modelTdpWatts * (modelCpuLoadPct / 100.0)) * (modelExecTimeMs / 1000.0);
  const estimatedMillijoules = estimatedJoules * 1000.0;

  const isWindows = capabilities?.os_name?.toLowerCase().includes('windows');
  const energyBackend = capabilities?.energy_backend;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Zap className="w-6 h-6 text-amber-400" />
          CPU Energy & Power Measurement Analysis
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Rigorous exploration of Power vs Energy, hardware RAPL interfaces, the physics of CMOS dynamic
          power, and transparent handling of platform measurement limitations.
        </p>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. POWER VS ENERGY: THE FUNDAMENTAL DISTINCTION */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-slate-800">
          <Activity className="w-5 h-5 text-cyan-400" />
          1. Distinguishing Power (Watts) vs Energy (Joules)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Power Box */}
          <div className="bg-[#090D1A] p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Electrical Power (P)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                Unit: Watts (W = Joules / sec)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Power is the <strong>instantaneous rate</strong> at which the CPU consumes electrical energy.
              On modern CMOS microprocessors, power consists of two primary components:
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[#070B14] border border-slate-800/80 font-mono text-xs text-slate-200">
              P_total = P_dynamic + P_static = (α · C · V² · f) + (V · I_leakage)
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• <strong>α:</strong> Activity factor (percentage of transistors switching per clock cycle)</li>
              <li>• <strong>C:</strong> Total capacitive load of the CPU circuit gates</li>
              <li>• <strong>V:</strong> Core supply voltage (quadratic impact: V²)</li>
              <li>• <strong>f:</strong> Clock frequency (cycles per second)</li>
              <li>• <strong>I_leakage:</strong> Subthreshold static current leakage through silicon</li>
            </ul>
          </div>

          {/* Energy Box */}
          <div className="bg-[#090D1A] p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Total Energy Consumed (E)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                Unit: Joules (J = Watts × seconds)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Energy is the <strong>integral accumulation</strong> of electrical power over the benchmark execution interval:
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[#070B14] border border-slate-800/80 font-mono text-xs text-slate-200">
              Energy (Joules) = ∫ P(t) dt  ≈  P_avg × Execution_Time
            </div>
            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              <strong>Crucial Academic Takeaway for Viva:</strong> A program that runs twice as fast does NOT automatically
              consume half the energy. If the CPU boosts to an aggressive turbo frequency, the core voltage (V) scales up
              non-linearly (quadratic power spike), potentially resulting in <em>higher</em> total energy consumption per task!
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. PLATFORM TELEMETRY STATUS & TRANSPARENCY */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-slate-800">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          2. Platform Telemetry Status & Measurement Provenance
        </h2>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Windows Status */}
          <div
            className={`p-5 rounded-xl border ${
              isWindows
                ? 'bg-amber-950/20 border-amber-800/50'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Windows 11 User-Space Environment
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700">
                Current OS: {capabilities?.os_name}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              On Windows, access to Intel/AMD Model-Specific Registers (MSR 0x611 MSR_PKG_ENERGY_STATUS)
              is strictly restricted to Ring-0 kernel drivers (e.g. Intel PCM or WinRing0).
              Standard user-space applications without third-party kernel drivers cannot directly read physical micro-Joules.
            </p>
            <div className="p-3 rounded-lg bg-[#070B14] border border-amber-900/50 text-xs text-amber-300/90">
              <strong>Strict Academic Policy:</strong> This analyzer refuses to fabricate random numbers or pretend
              user-space can read energy counters on Windows without genuine hardware drivers. All energy readings
              are honestly marked as <strong>UNAVAILABLE</strong> unless using calibrated external power meters or Linux RAPL.
            </div>
          </div>

          {/* Linux RAPL Status */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Linux Running EnergyRAPL (`powercap`)
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Linux Sysfs Interface
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              On Linux kernels 3.13+, the Running Average Power Limit (RAPL) driver exposes genuine 32-bit hardware energy
              counters via the sysfs virtual filesystem:
            </p>
            <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800 font-mono text-xs text-emerald-400 mb-3">
              /sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When this project is executed on Linux or under WSL with powercap permissions, the backend's
              <code>LinuxRaplProvider</code> adapter automatically reads exact hardware micro-Joules with 32-bit rollover compensation.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. EDUCATIONAL TDP SCALING ESTIMATOR (UNCALIBRATED) */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              3. Educational TDP Scaling Model (Pedagogical Comparison Only)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              An optional theoretical model demonstrating how power and duration scale mathematically.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60 font-semibold">
            UNCALIBRATED THEORETICAL MODEL
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-4 bg-[#090D1A] p-5 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300">Processor TDP (Thermal Design Power):</span>
                <span className="font-mono text-amber-400 font-bold">{modelTdpWatts} Watts</span>
              </div>
              <input
                type="range"
                min="10"
                max="125"
                step="1"
                value={modelTdpWatts}
                onChange={(e) => setModelTdpWatts(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] text-slate-500">Host i5-1135G7 configurable TDP: 12W–28W</span>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300">Measured / Modeled Execution Time:</span>
                <span className="font-mono text-cyan-400 font-bold">{modelExecTimeMs.toFixed(1)} ms</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={modelExecTimeMs}
                onChange={(e) => setModelExecTimeMs(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300">Core Utilization Factor:</span>
                <span className="font-mono text-emerald-400 font-bold">{modelCpuLoadPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={modelCpuLoadPct}
                onChange={(e) => setModelCpuLoadPct(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Model Output Card */}
          <div className="bg-gradient-to-br from-[#0F172A] to-[#0A1020] p-5 rounded-xl border border-amber-800/40 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Theoretical Energy Estimate
              </div>
              <div className="text-3xl font-mono font-bold text-white mt-1">
                {estimatedMillijoules.toFixed(2)} mJ
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ({estimatedJoules.toFixed(6)} Joules)
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Effective Power:</span>
                  <span className="font-mono font-semibold">{((modelTdpWatts * modelCpuLoadPct) / 100).toFixed(1)} W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-mono font-semibold">{(modelExecTimeMs / 1000).toFixed(4)} s</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300/90 leading-relaxed">
              <strong>Academic Caveat:</strong> This linear formula assumes constant average power dissipation.
              It does not account for Turbo Boost frequency ramping, package thermal inertia, or sleep state transitions.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

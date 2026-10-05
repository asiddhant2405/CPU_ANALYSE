import React from 'react';
import { Cpu, Zap, Activity, HardDrive, Terminal, GitCompare, Play, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { SystemCapabilities, HistoryItem } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardPageProps {
  capabilities: SystemCapabilities | null;
  history: HistoryItem[];
  onSelectSession: (id: string) => void;
  onLaunchDemo: () => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  capabilities,
  history,
  onSelectSession,
  onLaunchDemo,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Computer Organization & Architecture Project</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            CPU Energy Efficiency Analyzer
          </h1>
          <p className="mt-2 text-base sm:text-lg text-slate-300 font-medium italic">
            "Same output. Different implementations. Different computational costs."
          </p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Investigate how algorithmic choices, loop unrolling, and closed-form mathematics alter
            machine instruction cycles, processor resource utilization, and execution latency under
            controlled, repeated empirical measurements.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onLaunchDemo}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Gauss Summation Demo</span>
            </button>
            <button
              onClick={() => setActiveTab('workbench')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
            >
              <Terminal className="w-4 h-4" />
              <span>Open Custom Workbench</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Telemetry & Environment Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Model & Topology */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between min-h-[115px] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Processor</span>
            <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white truncate" title={capabilities?.cpu_model}>
            {capabilities?.cpu_model || 'Detecting...'}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center space-x-2">
            <span>{capabilities?.physical_cores || '-'} Physical Cores</span>
            <span className="text-slate-600">•</span>
            <span>{capabilities?.logical_cores || '-'} Threads</span>
          </div>
        </div>

        {/* Operating System & Isolation */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between min-h-[115px] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Host OS</span>
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white truncate" title={capabilities ? `${capabilities.os_name} (${capabilities.architecture})` : ''}>
            {capabilities ? `${capabilities.os_name} (${capabilities.architecture})` : 'Detecting...'}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="capitalize truncate">{capabilities?.isolation_mode.replace(/_/g, ' ') || 'Subprocess isolation'}</span>
          </div>
        </div>

        {/* Memory Available */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between min-h-[115px] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Memory (RAM)</span>
            <HardDrive className="w-4 h-4 text-violet-400 shrink-0" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white">
            {capabilities ? `${capabilities.total_memory_gb.toFixed(1)} GB Total` : 'Detecting...'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {capabilities ? `${capabilities.available_memory_gb.toFixed(1)} GB Available` : '-'}
          </div>
        </div>

        {/* Available Compilers */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between min-h-[115px] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Runtimes</span>
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-xs font-mono">Python {capabilities?.python_version}</span>
            {capabilities?.gcc_available && (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-xs font-mono">GCC</span>
            )}
            {capabilities?.gpp_available && (
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-xs font-mono">G++</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2 truncate">
            Languages: {capabilities?.supported_languages.join(', ') || 'Python'}
          </div>
        </div>
      </div>

      {/* Energy Telemetry Backend Status Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${capabilities?.energy_backend.available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Hardware Energy Measurement Telemetry</h3>
                <StatusBadge status={capabilities?.energy_backend.available ? 'hardware_counter' : 'unavailable'} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Status: {capabilities?.energy_backend.backend_type} • Metric: {capabilities?.energy_backend.unit || 'None'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          <p className="font-medium text-slate-200">{capabilities?.energy_backend.explanation}</p>
          {capabilities?.energy_backend.remedy && (
            <p className="mt-2 text-slate-400 border-t border-slate-800/60 pt-2">
              <span className="text-amber-400 font-semibold">Remedy / Note: </span>
              {capabilities.energy_backend.remedy}
            </p>
          )}
        </div>
      </div>

      {/* Recent Benchmark History */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Benchmark Runs</h3>
            <p className="text-xs text-slate-400">Previously executed benchmarks saved in local SQLite storage.</p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">No benchmarks executed yet</p>
            <p className="text-xs text-slate-500 mt-1">Run the Gauss demonstration or create a custom test in the workbench.</p>
            <button
              onClick={onLaunchDemo}
              className="mt-3 px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Launch Demonstration
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 uppercase tracking-wider bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Benchmark Name</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Equivalence</th>
                  <th className="py-2.5 px-3">Verdict / Speedup</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="truncate max-w-[220px]" title={item.benchmark_name}>
                        {item.benchmark_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {item.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.verified_equivalent ? (
                        <span className="text-emerald-400 font-semibold text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40">Verified</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {item.speedup_factor ? (
                        <span className="font-mono text-cyan-400 font-bold tabular-nums">{item.speedup_factor.toFixed(2)}x Speedup</span>
                      ) : (
                        <span className="text-slate-400 truncate max-w-[180px] block">{item.summary_verdict || '-'}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 tabular-nums">
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      <span className="text-slate-500 ml-1.5">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectSession(item.id)}
                        className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 font-medium text-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

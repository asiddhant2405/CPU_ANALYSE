import React, { useState } from 'react';
import { Clock, HardDrive, Cpu, Zap, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { BenchmarkSession, BenchmarkSummary, RunResult } from '../types/api';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ResultsPageProps {
  session: BenchmarkSession;
  onGoToComparison: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ session, onGoToComparison }) => {
  const [activeTabFilter, setActiveTabFilter] = useState<'measured' | 'all' | 'warmup'>('measured');
  const [selectedImpl, setSelectedImpl] = useState<string>(
    Object.keys(session.summaries)[0] || ''
  );

  const summaries = Object.values(session.summaries);

  // Prepare chart data comparing execution times
  const barChartData = summaries.map((s) => ({
    name: s.implementation_name,
    median: s.median_execution_time_ms,
    mean: s.mean_execution_time_ms,
    min: s.min_execution_time_ms,
    max: s.max_execution_time_ms,
  }));

  // Filter raw runs
  const currentRuns: RunResult[] = session.runs[selectedImpl] || [];
  const filteredRuns = currentRuns.filter((r) => {
    if (activeTabFilter === 'measured') return !r.is_warmup;
    if (activeTabFilter === 'warmup') return r.is_warmup;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Quick Switch to Comparison */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">{session.config.benchmark_name}</h2>
            <StatusBadge status={session.status} size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
            <span>Session ID: <code className="text-blue-400 font-mono">{session.id.slice(0, 8)}</code></span>
            <span className="text-slate-600">•</span>
            <span>Completed: {new Date(session.timestamp).toLocaleTimeString()}</span>
          </p>
        </div>

        {session.comparison && (
          <button
            onClick={onGoToComparison}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs shadow-md hover:from-blue-500 hover:to-cyan-400 transition-all shrink-0"
          >
            <span>Open Side-by-Side Comparison Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Output Equivalence Notice */}
      {session.comparison && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
            session.comparison.verified_equivalent
              ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-300'
              : 'bg-amber-950/20 border-amber-600/40 text-amber-300'
          }`}
        >
          <div className="flex items-start space-x-3 text-xs">
            {session.comparison.verified_equivalent ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-semibold text-white">Output Equivalence Check</p>
              <p className="opacity-90 leading-relaxed">{session.comparison.equivalence_note}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
            {session.comparison.verified_equivalent ? 'VERIFIED' : 'MISMATCH'}
          </span>
        </div>
      )}

      {/* Metric Cards per Implementation */}
      {summaries.map((summary) => (
        <div key={summary.implementation_name} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
              <h3 className="font-bold text-base text-white">{summary.implementation_name}</h3>
              <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-[10px] uppercase font-mono text-blue-300">
                {summary.language}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Valid Runs: <strong className="text-white font-mono">{summary.valid_runs}</strong> / {summary.total_runs} (Warm-up: {summary.warmup_runs_count})
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <MetricCard
              title="Median Runtime"
              value={summary.median_execution_time_ms.toFixed(4)}
              unit="ms"
              subtitle={`Mean: ${summary.mean_execution_time_ms.toFixed(4)} ms`}
              icon={Clock}
              color="blue"
              provenance="os"
              tooltip="Wall-clock time measured via time.perf_counter_ns() high-resolution monotonic timer."
            />

            <MetricCard
              title="Variability (IQR)"
              value={summary.iqr_execution_time_ms.toFixed(4)}
              unit="ms"
              subtitle={`Std Dev: ±${summary.stddev_execution_time_ms.toFixed(4)} ms`}
              icon={Clock}
              color="violet"
              provenance="os"
              tooltip="Interquartile Range (Q3 - Q1), resilient against operating system scheduling spikes."
            />

            <MetricCard
              title="Peak Memory"
              value={summary.peak_rss_mb.toFixed(3)}
              unit="MB"
              subtitle="Resident Set Size"
              icon={HardDrive}
              color="emerald"
              provenance="os"
              tooltip="Maximum resident physical memory consumed by the process."
            />

            <MetricCard
              title="Process CPU %"
              value={summary.mean_cpu_percent.toFixed(1)}
              unit="%"
              subtitle="Core activity sample"
              icon={Cpu}
              color="amber"
              provenance="os"
              tooltip="Average CPU utilization sampled during process lifetime."
            />

            <MetricCard
              title="Energy Telemetry"
              value={
                summary.hardware_energy_j != null
                  ? summary.hardware_energy_j.toFixed(4)
                  : summary.modeled_energy_j != null
                  ? summary.modeled_energy_j.toFixed(4)
                  : 'N/A'
              }
              unit={summary.hardware_energy_j != null || summary.modeled_energy_j != null ? 'Joules' : ''}
              subtitle={summary.energy_source_label.replace('_', ' ')}
              icon={Zap}
              color={summary.hardware_energy_j != null ? 'emerald' : summary.modeled_energy_j != null ? 'amber' : 'slate'}
              provenance={
                summary.hardware_energy_j != null
                  ? 'hardware'
                  : summary.modeled_energy_j != null
                  ? 'model'
                  : 'unavailable'
              }
              tooltip={summary.energy_details}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-slate-300 shrink-0">Output Sample:</span>
              <code className="text-cyan-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 break-all truncate max-w-md" title={summary.output_sample}>
                {summary.output_sample.trim() || '<empty>'}
              </code>
            </div>
            {summary.compilation_time_ms != null && summary.compilation_time_ms > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-semibold text-slate-300">Compilation Time:</span>
                <span className="font-mono text-slate-200 tabular-nums">{summary.compilation_time_ms.toFixed(2)} ms</span>
                <span className="text-[10px] text-slate-500">(isolated from execution)</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Comparative Latency Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-4">Execution Time Comparison (Median vs Mean in Milliseconds)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} unit=" ms" />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="median" name="Median Runtime (ms)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mean" name="Mean Runtime (ms)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Raw Run Log Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Raw Run Measurements Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">Audit individual trial executions and verify statistical integrity.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedImpl}
              onChange={(e) => setSelectedImpl(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {summaries.map((s) => (
                <option key={s.implementation_name} value={s.implementation_name}>
                  {s.implementation_name}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs border border-slate-700">
              <button
                onClick={() => setActiveTabFilter('measured')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabFilter === 'measured' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Measured
              </button>
              <button
                onClick={() => setActiveTabFilter('warmup')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabFilter === 'warmup' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Warm-up
              </button>
              <button
                onClick={() => setActiveTabFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs">
            <thead className="text-slate-400 uppercase tracking-wider bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 px-3 text-left">Run</th>
                <th className="py-2.5 px-3 text-center">Phase</th>
                <th className="py-2.5 px-3 text-right">Runtime</th>
                <th className="py-2.5 px-3 text-right">Peak RSS</th>
                <th className="py-2.5 px-3 text-right">CPU Util</th>
                <th className="py-2.5 px-3 text-right">Energy</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-left">Output Sample</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredRuns.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-slate-300 font-semibold text-left">#{r.run_index}</td>
                  <td className="py-2.5 px-3 text-center">
                    {r.is_warmup ? (
                      <span className="text-amber-400 text-[10px] px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/50 font-medium">Warm-up</span>
                    ) : (
                      <span className="text-blue-400 text-[10px] px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/50 font-medium">Measured</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-white font-bold tabular-nums">{r.execution_time_ms.toFixed(4)} ms</td>
                  <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{r.peak_rss_mb.toFixed(3)} MB</td>
                  <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{r.process_cpu_percent.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                    {r.hardware_energy_j != null
                      ? `${r.hardware_energy_j.toFixed(6)} J`
                      : r.modeled_energy_j != null
                      ? `${r.modeled_energy_j.toFixed(6)} J (est)`
                      : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {r.success ? (
                      <span className="text-emerald-400 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40">Exit 0</span>
                    ) : (
                      <span className="text-rose-400 text-[10px] px-2 py-0.5 rounded-full bg-rose-950/50 border border-rose-800/40">Failed</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-left text-slate-400 truncate max-w-[200px]" title={r.stdout.trim()}>
                    {r.stdout.replace(/\r?\n/g, ' ').trim() || r.stderr.replace(/\r?\n/g, ' ').trim() || '<empty>'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

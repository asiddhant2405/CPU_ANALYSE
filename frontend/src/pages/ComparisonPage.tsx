import React from 'react';
import {
  GitCompare,
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Cpu,
  Zap,
  Info,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import { BenchmarkSession } from '../types/api';
import { getExportUrl } from '../services/api';
import { ArchitectureInsightsCard } from '../components/ArchitectureInsightsCard';
import { AssemblyViewer } from '../components/AssemblyViewer';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ComparisonPageProps {
  session: BenchmarkSession | null;
  onOpenWorkbench: () => void;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ session, onOpenWorkbench }) => {
  if (!session || !session.comparison) {
    return (
      <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
        <GitCompare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Active Comparison Available</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Execute a benchmark with at least two implementations in the Workbench or select a saved session from History to inspect the comparative analysis.
        </p>
        <button
          onClick={onOpenWorkbench}
          className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
        >
          Open Workbench
        </button>
      </div>
    );
  }

  const comp = session.comparison;
  const summaries = Object.values(session.summaries);
  const baseline = session.summaries[comp.baseline_name];
  const candidate = session.summaries[comp.candidate_name];

  // Bar chart data for runtime
  const timeBarData = [
    {
      name: baseline.implementation_name,
      runtime: baseline.median_execution_time_ms,
      fill: '#3B82F6',
    },
    {
      name: candidate.implementation_name,
      runtime: candidate.median_execution_time_ms,
      fill: '#06B6D4',
    },
  ];

  // Line chart data showing variance across individual measured runs
  const baseRuns = (session.runs[comp.baseline_name] || []).filter((r) => !r.is_warmup);
  const candRuns = (session.runs[comp.candidate_name] || []).filter((r) => !r.is_warmup);
  const runComparisonData = baseRuns.map((r, i) => ({
    trial: `Run ${i + 1}`,
    [baseline.implementation_name]: r.execution_time_ms,
    [candidate.implementation_name]: candRuns[i]?.execution_time_ms || 0,
  }));

  // Memory comparison data
  const memoryData = [
    {
      name: baseline.implementation_name,
      peakMemory: baseline.peak_rss_mb,
      fill: '#3B82F6',
    },
    {
      name: candidate.implementation_name,
      peakMemory: candidate.peak_rss_mb,
      fill: '#10B981',
    },
  ];

  const handleDownload = (format: 'csv' | 'json' | 'html') => {
    const url = getExportUrl(session.id, format);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Comparative Analysis Laboratory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Benchmark: <strong className="text-slate-200">{session.config.benchmark_name}</strong> • Comparing Baseline vs Candidate
          </p>
        </div>

        {/* Export Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => handleDownload('csv')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleDownload('json')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => handleDownload('html')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Print HTML Report</span>
          </button>
        </div>
      </div>

      {/* Primary Verdict Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-sm ${
          comp.verified_equivalent
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-600/50'
            : 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-600/50'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              {comp.verified_equivalent ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Evaluation Verdict
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{comp.summary_verdict}</h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{comp.equivalence_note}</p>
          </div>

          {/* Speedup Metric Box */}
          {comp.verified_equivalent && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-left md:text-right shrink-0">
              <span className="text-xs text-slate-400 font-medium block">Speedup Factor</span>
              <span className="text-3xl font-black text-cyan-400 font-mono tracking-tight tabular-nums block my-0.5">
                {comp.speedup_factor.toFixed(2)}x
              </span>
              <span className="text-xs text-emerald-400 block font-medium">
                {comp.time_difference_percent < 0
                  ? `${Math.abs(comp.time_difference_percent).toFixed(1)}% reduction in runtime`
                  : `${comp.time_difference_percent.toFixed(1)}% increase in runtime`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Summary Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
              <h4 className="font-bold text-white text-sm">{baseline.implementation_name}</h4>
              <span className="text-[10px] text-slate-400 font-mono">(Baseline)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-[10px] uppercase font-mono text-blue-300">
              {baseline.language}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Median Execution Time:</span>
              <strong className="text-white font-mono tabular-nums text-right">{baseline.median_execution_time_ms.toFixed(4)} ms</strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Mean &plusmn; Std Dev:</span>
              <span className="text-slate-300 font-mono tabular-nums text-right">
                {baseline.mean_execution_time_ms.toFixed(4)} &plusmn; {baseline.stddev_execution_time_ms.toFixed(4)} ms
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Peak Memory (RSS):</span>
              <span className="text-slate-300 font-mono tabular-nums text-right">{baseline.peak_rss_mb.toFixed(3)} MB</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Process CPU Utilization:</span>
              <span className="text-slate-300 font-mono tabular-nums text-right">{baseline.mean_cpu_percent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400 font-medium shrink-0">Output Sample:</span>
              <code className="text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-850 truncate max-w-[200px] text-right" title={baseline.output_sample}>
                {baseline.output_sample.trim() || '<empty>'}
              </code>
            </div>
          </div>
        </div>

        {/* Candidate Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shrink-0"></span>
              <h4 className="font-bold text-white text-sm">{candidate.implementation_name}</h4>
              <span className="text-[10px] text-cyan-400 font-mono">(Candidate)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[10px] uppercase font-mono text-cyan-300">
              {candidate.language}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Median Execution Time:</span>
              <strong className="text-cyan-400 font-mono tabular-nums text-right">{candidate.median_execution_time_ms.toFixed(4)} ms</strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Mean &plusmn; Std Dev:</span>
              <span className="text-slate-300 font-mono tabular-nums text-right">
                {candidate.mean_execution_time_ms.toFixed(4)} &plusmn; {candidate.stddev_execution_time_ms.toFixed(4)} ms
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Peak Memory (RSS):</span>
              <span className="text-slate-300 font-mono tabular-nums text-right">{candidate.peak_rss_mb.toFixed(3)} MB</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Process CPU Utilization:</span>
              <span className="text-slate-300 font-mono tabular-nums text-right">{candidate.mean_cpu_percent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400 font-medium shrink-0">Output Sample:</span>
              <code className="text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-850 truncate max-w-[200px] text-right" title={candidate.output_sample}>
                {candidate.output_sample.trim() || '<empty>'}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency Comparison Bar Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Median Latency Comparison (ms)</span>
          </h4>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeBarData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} unit=" ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="runtime" name="Median Runtime (ms)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Run Latency Progression Line Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Run-by-Run Execution Time Progression</span>
          </h4>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runComparisonData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="trial" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} unit=" ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey={baseline.implementation_name}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey={candidate.implementation_name}
                  stroke="#06B6D4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Energy Telemetry & Disclosures Section */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Energy Telemetry & Comparability Status</span>
        </h4>
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <p className="font-medium text-slate-200">{comp.energy_explanation}</p>
        </div>
      </div>

      {/* Computer Organization & Architecture Explanation */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Computer Organization & Architecture (COA) Analysis</span>
        </h4>
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-2">
          <p className="font-normal text-slate-200">{comp.plain_language_explanation}</p>
          <div className="pt-2 border-t border-slate-800/80 text-slate-400 space-y-1">
            <p>
              <strong>Instruction Pipeline Dynamics: </strong>
              The iterative accumulator performs repeated loops: evaluating condition, branch instruction,
              updating loop counter register, and performing ALU accumulator addition. In contrast, the Gauss
              arithmetic formula evaluates in $O(1)$ constant time using a single integer multiply (`imul`),
              addition (`add`), and arithmetic right shift (`sar`), completely bypassing millions of pipeline cycles.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Insights Panel */}
      {(comp.architecture_insights || session.architecture_insights) && (
        <ArchitectureInsightsCard
          insights={comp.architecture_insights || session.architecture_insights!}
        />
      )}

      {/* Assembly & Opcode Breakdown Side-by-Side (C/C++ & Python) */}
      {session.config.implementations.length >= 2 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              Machine Assembly & Opcode Inspection Comparison
            </h3>
            <span className="text-xs text-slate-400">
              Static machine instructions generated by compiler backend
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssemblyViewer
              sourceCode={session.config.implementations[0].source_code}
              language={session.config.implementations[0].language}
              compilerFlags={session.config.implementations[0].compiler_flags || ['-O2']}
              implementationName={session.config.implementations[0].name}
            />
            <AssemblyViewer
              sourceCode={session.config.implementations[1].source_code}
              language={session.config.implementations[1].language}
              compilerFlags={session.config.implementations[1].compiler_flags || ['-O2']}
              implementationName={session.config.implementations[1].name}
            />
          </div>
        </div>
      )}

      {/* Scientific Limitations & Experimental Disclosures */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
        <h4 className="font-semibold text-slate-300 uppercase tracking-wider">Methodology Disclosures & Limitations:</h4>
        <ul className="list-disc pl-5 text-slate-400 space-y-1">
          {comp.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};


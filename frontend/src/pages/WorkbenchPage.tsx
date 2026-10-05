import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sliders,
  Code2,
  Cpu,
  Zap,
  HelpCircle,
  FileCode,
  ShieldAlert,
  Search,
  Terminal,
} from 'lucide-react';
import {
  SampleCodePair,
  BenchmarkConfiguration,
  BenchmarkSession,
  SystemCapabilities,
  StaticAnalysisReport,
} from '../types/api';
import { analyzeCode } from '../services/api';
import { RunProgressBar } from '../components/RunProgressBar';
import { WarningBox } from '../components/WarningBox';
import { AssemblyViewer } from '../components/AssemblyViewer';

interface WorkbenchPageProps {
  samples: SampleCodePair[];
  capabilities: SystemCapabilities | null;
  onRunBenchmark: (config: BenchmarkConfiguration) => Promise<BenchmarkSession>;
  activeSession: BenchmarkSession | null;
  onCancelBenchmark: () => void;
  onBenchmarkComplete: (session: BenchmarkSession) => void;
}

export const WorkbenchPage: React.FC<WorkbenchPageProps> = ({
  samples,
  capabilities,
  onRunBenchmark,
  activeSession,
  onCancelBenchmark,
  onBenchmarkComplete,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('integer_sum_gauss');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');

  // Benchmark Form State
  const [benchmarkName, setBenchmarkName] = useState<string>('Integer Sum: Loop vs Gauss Formula');
  const [nameA, setNameA] = useState<string>('Iterative Accumulator Loop');
  const [codeA, setCodeA] = useState<string>('');
  const [flagsA, setFlagsA] = useState<string[]>(['-O2', '-std=c11']);
  const [nameB, setNameB] = useState<string>('Gauss Arithmetic Formula');
  const [codeB, setCodeB] = useState<string>('');
  const [flagsB, setFlagsB] = useState<string[]>(['-O2', '-std=c11']);
  const [workbenchViewMode, setWorkbenchViewMode] = useState<'editor' | 'assembly'>('editor');

  const [warmupRuns, setWarmupRuns] = useState<number>(2);
  const [measurementRuns, setMeasurementRuns] = useState<number>(10);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(10.0);
  const [verifyEquivalence, setVerifyEquivalence] = useState<boolean>(true);
  const [expectedOutput, setExpectedOutput] = useState<string>('499999500000');
  const [enableModeledEstimate, setEnableModeledEstimate] = useState<boolean>(false);
  const [tdpWatts, setTdpWatts] = useState<number>(28.0);

  // Static Analysis State
  const [analysisA, setAnalysisA] = useState<StaticAnalysisReport | null>(null);
  const [analysisB, setAnalysisB] = useState<StaticAnalysisReport | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load sample on task or language change
  useEffect(() => {
    const sample = samples.find((s) => s.task_id === selectedTaskId);
    if (sample && sample.languages[selectedLanguage]) {
      const langData = sample.languages[selectedLanguage];
      setNameA(langData.implementation_a.name);
      setCodeA(langData.implementation_a.code);
      setFlagsA(langData.implementation_a.compiler_flags || ['-O2', '-std=c11']);
      setNameB(langData.implementation_b.name);
      setCodeB(langData.implementation_b.code);
      setFlagsB(langData.implementation_b.compiler_flags || ['-O2', '-std=c11']);
      setBenchmarkName(`${sample.title} (${selectedLanguage.toUpperCase()})`);
      setExpectedOutput(sample.expected_output_for_default);
      setAnalysisA(null);
      setAnalysisB(null);
    }
  }, [selectedTaskId, selectedLanguage, samples]);

  const handleStaticAnalysis = async () => {
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const [resA, resB] = await Promise.all([
        analyzeCode(codeA, selectedLanguage, nameA),
        analyzeCode(codeB, selectedLanguage, nameB),
      ]);
      setAnalysisA(resA);
      setAnalysisB(resB);
    } catch (e: any) {
      setErrorMsg(`Analysis failed: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRun = async () => {
    setErrorMsg(null);
    const config: BenchmarkConfiguration = {
      benchmark_name: benchmarkName,
      task_id: selectedTaskId,
      implementations: [
        {
          name: nameA,
          language: selectedLanguage,
          source_code: codeA,
          compiler_flags: (selectedLanguage === 'c' || selectedLanguage === 'cpp') ? flagsA : undefined,
        },
        {
          name: nameB,
          language: selectedLanguage,
          source_code: codeB,
          compiler_flags: (selectedLanguage === 'c' || selectedLanguage === 'cpp') ? flagsB : undefined,
        },
      ],
      warmup_runs: warmupRuns,
      measurement_runs: measurementRuns,
      timeout_seconds: timeoutSeconds,
      verify_output_equivalence: verifyEquivalence,
      expected_output: expectedOutput.trim() ? expectedOutput.trim() : null,
      enable_modeled_estimate: enableModeledEstimate,
      tdp_watts: tdpWatts,
    };

    try {
      const session = await onRunBenchmark(config);
      if (session.status === 'completed') {
        onBenchmarkComplete(session);
      } else if (session.status === 'failed') {
        setErrorMsg(session.error || 'Benchmark run failed.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Execution error.');
    }
  };

  const isRunning = Boolean(
    activeSession &&
    ['queued', 'compiling', 'warming_up', 'running'].includes(activeSession.status)
  );

  return (
    <div className="space-y-6">
      {/* Header and Sample Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <span>Benchmark Workbench</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure candidate source implementations, select compilers, and execute repeated trials.
          </p>
        </div>

        {/* Task & Language Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Task:</span>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {samples.map((s) => (
                <option key={s.task_id} value={s.task_id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="python">Python 3.14</option>
              <option value="c" disabled={!capabilities?.gcc_available}>
                C (GCC {capabilities?.gcc_available ? 'Available' : 'Missing'})
              </option>
              <option value="cpp" disabled={!capabilities?.gpp_available}>
                C++ (G++ {capabilities?.gpp_available ? 'Available' : 'Missing'})
              </option>
            </select>
          </div>
        </div>

        {/* 4 Quick Experiment Buttons */}
        <div className="w-full pt-3 mt-1 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Quick COA Experiments:</span>
          {samples.map((s) => (
            <button
              key={s.task_id}
              onClick={() => setSelectedTaskId(s.task_id)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                selectedTaskId === s.task_id
                  ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Switcher: Code Editor vs Assembly Inspector */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWorkbenchViewMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              workbenchViewMode === 'editor'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Source Code Editor</span>
          </button>

          <button
            onClick={() => setWorkbenchViewMode('assembly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              workbenchViewMode === 'assembly'
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Machine Assembly & Opcodes (GCC / Bytecode)</span>
          </button>
        </div>

        {(selectedLanguage === 'c' || selectedLanguage === 'cpp') && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Optimization Presets:</span>
            <button
              onClick={() => {
                setFlagsA(['-O0', '-std=c11']);
                setFlagsB(['-O2', '-std=c11']);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            >
              Compare -O0 vs -O2
            </button>
            <button
              onClick={() => {
                setFlagsA(['-O2', '-std=c11']);
                setFlagsB(['-O3', '-std=c11']);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            >
              Compare -O2 vs -O3
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar during execution */}
      {activeSession && (
        <RunProgressBar
          progressPercent={activeSession.progress_percent}
          stage={activeSession.current_stage}
          status={activeSession.status}
          onCancel={onCancelBenchmark}
        />
      )}

      {errorMsg && (
        <WarningBox type="security" title="Execution Warning / Error" message={errorMsg} />
      )}

      {/* Assembly View Mode */}
      {workbenchViewMode === 'assembly' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AssemblyViewer
            sourceCode={codeA}
            language={selectedLanguage}
            compilerFlags={flagsA}
            implementationName={nameA}
          />
          <AssemblyViewer
            sourceCode={codeB}
            language={selectedLanguage}
            compilerFlags={flagsB}
            implementationName={nameB}
          />
        </div>
      )}

      {/* Side-by-Side Code Editors */}
      {/* Side-by-Side Code Editors */}
      {workbenchViewMode === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Implementation A (Baseline) */}
        <div className="rounded-xl border border-slate-800 bg-[#0B0F19] p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Implementation A (Baseline)</span>
              </div>
              <input
                type="text"
                value={nameA}
                onChange={(e) => setNameA(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-2.5 py-1 rounded-lg max-w-[200px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Implementation Name"
              />
            </div>

            <textarea
              value={codeA}
              onChange={(e) => setCodeA(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full bg-[#070B14] text-slate-200 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed resize-y select-text"
            />
          </div>

          {/* Static Analysis Findings A */}
          {analysisA && (
            <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-blue-400 font-semibold mb-1">
                <span>Algorithmic Complexity:</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                  {analysisA.algorithmic_complexity}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{analysisA.explanation}</p>
            </div>
          )}
        </div>

        {/* Implementation B (Candidate) */}
        <div className="rounded-xl border border-slate-800 bg-[#0B0F19] p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Implementation B (Candidate)</span>
              </div>
              <input
                type="text"
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-2.5 py-1 rounded-lg max-w-[200px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="Implementation Name"
              />
            </div>

            <textarea
              value={codeB}
              onChange={(e) => setCodeB(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full bg-[#070B14] text-slate-200 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y select-text"
            />
          </div>

          {/* Static Analysis Findings B */}
          {analysisB && (
            <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-cyan-400 font-semibold mb-1">
                <span>Algorithmic Complexity:</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  {analysisB.algorithmic_complexity}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{analysisB.explanation}</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Static Analysis Action */}
      <div className="flex justify-end">
        <button
          onClick={handleStaticAnalysis}
          disabled={analyzing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span>{analyzing ? 'Analyzing AST...' : 'Run Static Heuristic Analysis (Inspect Loops & Complexity)'}</span>
        </button>
      </div>

      {/* Benchmark Execution Configuration Panel */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-slate-800 pb-2.5">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Measurement Configuration & Execution Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Warmup Runs */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Warm-up Repetitions:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={warmupRuns}
                onChange={(e) => setWarmupRuns(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">Warms cache & JIT state (discarded from summary)</span>
          </div>

          {/* Measured Runs */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Measured Repetitions:</label>
              <input
                type="number"
                min={3}
                max={50}
                value={measurementRuns}
                onChange={(e) => setMeasurementRuns(Math.max(3, parseInt(e.target.value) || 3))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">Number of timed trials used for statistics</span>
          </div>

          {/* Timeout */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Per-Run Timeout (seconds):</label>
              <input
                type="number"
                min={1}
                max={60}
                step={0.5}
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(Math.max(0.5, parseFloat(e.target.value) || 10.0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">Prevents hanging on infinite loops</span>
          </div>

          {/* Expected Output */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Expected Output String:</label>
              <input
                type="text"
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. 499999500000"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">Verified against program stdout</span>
          </div>
        </div>

        {/* Equivalence and Modeled Estimate Toggles */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <label className="flex items-center space-x-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifyEquivalence}
              onChange={(e) => setVerifyEquivalence(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-slate-300 font-medium">Verify Output Equivalence before comparing</span>
          </label>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableModeledEstimate}
                onChange={(e) => setEnableModeledEstimate(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <span>Enable Educational TDP Energy Model</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-medium">Uncalibrated</span>
              </span>
            </label>

            {enableModeledEstimate && (
              <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <span className="text-slate-400 font-medium">TDP:</span>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={tdpWatts}
                  onChange={(e) => setTdpWatts(parseFloat(e.target.value) || 28.0)}
                  className="w-16 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center text-white font-mono focus:outline-none"
                />
                <span className="text-slate-400">Watts</span>
              </div>
            )}
          </div>
        </div>

        {/* Safety Warning */}
        <WarningBox
          type="info"
          message="Execution runs locally in a dedicated temporary subprocess with argument array isolation and wall-clock timeouts. Output size is strictly bounded to prevent memory exhaustion."
        />

        {/* Launch Execution Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-xl transition-all ${
              isRunning
                ? 'bg-slate-700 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 glow-blue'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isRunning ? 'Benchmarking in Progress...' : 'Execute Benchmark Trials'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

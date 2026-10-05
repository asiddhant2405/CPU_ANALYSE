import React, { useState, useEffect } from 'react';
import { fetchDisassembly } from '../services/api';
import { AssemblyAnalysisResponse } from '../types/api';
import { Cpu, Terminal, AlertTriangle, Layers, Info, CheckCircle2 } from 'lucide-react';

interface AssemblyViewerProps {
  sourceCode: string;
  language: string;
  compilerFlags?: string[];
  implementationName: string;
}

export const AssemblyViewer: React.FC<AssemblyViewerProps> = ({
  sourceCode,
  language,
  compilerFlags = ['-O2'],
  implementationName,
}) => {
  const [data, setData] = useState<AssemblyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const loadDisassembly = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchDisassembly(sourceCode, language, compilerFlags);
      setData(resp);
    } catch (e: any) {
      setError(e.message || 'Failed to generate assembly');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisassembly();
  }, [sourceCode, language, compilerFlags.join(' ')]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'alu':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'data_transfer':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60';
      case 'control_transfer':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'comparison':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/60';
      case 'label':
        return 'text-indigo-300 font-bold';
      default:
        return 'text-slate-400 bg-slate-800/40 border-slate-700/60';
    }
  };

  const filteredInstructions = data?.instructions.filter((inst) => {
    if (selectedFilter === 'all') return true;
    return inst.category === selectedFilter;
  }) || [];

  return (
    <div className="bg-[#0C1222] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0A0F1D] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Assembly & Opcode Inspection — {implementationName}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {language.toUpperCase()} {compilerFlags.length > 0 && `(${compilerFlags.join(' ')})`}
          </span>
        </div>

        <button
          onClick={loadDisassembly}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {loading ? 'Disassembling...' : 'Refresh Assembly'}
        </button>
      </div>

      {/* Opcode Category Metrics Bar */}
      {data && data.success && (
        <div className="px-4 py-3 bg-[#090D1A] border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono">
            Static Instructions: <strong className="text-slate-100">{data.instruction_count}</strong>
          </span>
          <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Filter Pills */}
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2 py-0.5 rounded border transition-colors ${
              selectedFilter === 'all'
                ? 'bg-slate-700 text-white border-slate-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            All ({data.instructions.length})
          </button>
          <button
            onClick={() => setSelectedFilter('alu')}
            className={`px-2 py-0.5 rounded border transition-colors ${
              selectedFilter === 'alu'
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-600'
                : 'bg-slate-900 text-emerald-400/80 border-slate-800 hover:border-emerald-900'
            }`}
          >
            ALU ({data.category_counts.alu || 0})
          </button>
          <button
            onClick={() => setSelectedFilter('data_transfer')}
            className={`px-2 py-0.5 rounded border transition-colors ${
              selectedFilter === 'data_transfer'
                ? 'bg-cyan-900/60 text-cyan-300 border-cyan-600'
                : 'bg-slate-900 text-cyan-400/80 border-slate-800 hover:border-cyan-900'
            }`}
          >
            Data Transfer ({data.category_counts.data_transfer || 0})
          </button>
          <button
            onClick={() => setSelectedFilter('control_transfer')}
            className={`px-2 py-0.5 rounded border transition-colors ${
              selectedFilter === 'control_transfer'
                ? 'bg-amber-900/60 text-amber-300 border-amber-600'
                : 'bg-slate-900 text-amber-400/80 border-slate-800 hover:border-amber-900'
            }`}
          >
            Control ({data.category_counts.control_transfer || 0})
          </button>
          <button
            onClick={() => setSelectedFilter('comparison')}
            className={`px-2 py-0.5 rounded border transition-colors ${
              selectedFilter === 'comparison'
                ? 'bg-purple-900/60 text-purple-300 border-purple-600'
                : 'bg-slate-900 text-purple-400/80 border-slate-800 hover:border-purple-900'
            }`}
          >
            Comparison ({data.category_counts.comparison || 0})
          </button>
        </div>
      )}

      {/* Assembly Listing */}
      <div className="flex-1 max-h-80 overflow-y-auto font-mono text-xs p-3 bg-[#070B14]">
        {loading && (
          <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400 animate-spin" />
            <span>Invoking compiler backend ({compilerFlags.join(' ')})...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/30 border border-red-800/50 rounded text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Assembly Extraction Failed</p>
              <p className="text-xs text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {data && !loading && !error && (
          <div className="space-y-1">
            {filteredInstructions.map((inst, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 hover:bg-slate-800/40 px-2 py-1 rounded transition-colors items-baseline font-mono text-xs"
              >
                <span className="col-span-1 text-slate-600 text-right select-none tabular-nums text-[11px]">{inst.line_number}</span>
                <div className="col-span-8 flex items-baseline gap-2 overflow-x-auto min-w-0">
                  {inst.opcode && (
                    <span
                      className={`px-1.5 py-0.5 rounded border font-semibold text-[11px] leading-tight shrink-0 ${getCategoryColor(
                        inst.category
                      )}`}
                    >
                      {inst.opcode}
                    </span>
                  )}
                  <span className="text-slate-300 truncate" title={inst.operands || inst.raw_text}>{inst.operands || inst.raw_text}</span>
                </div>
                <div className="col-span-3 text-right text-slate-500 truncate text-[11px]" title={inst.comment || ''}>
                  {inst.comment ? `# ${inst.comment}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Educational Footer */}
      {data && data.coa_insight && (
        <div className="p-3 bg-[#0A0E1A] border-t border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-cyan-300">COA Architectural Note: </span>
            <span>{data.coa_insight}</span>
          </div>
        </div>
      )}
    </div>
  );
};

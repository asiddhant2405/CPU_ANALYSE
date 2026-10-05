import React from 'react';
import { Loader2, Square } from 'lucide-react';

interface RunProgressBarProps {
  progressPercent: number;
  stage: string;
  status: string;
  onCancel?: () => void;
}

export const RunProgressBar: React.FC<RunProgressBarProps> = ({
  progressPercent,
  stage,
  status,
  onCancel,
}) => {
  const isRunning = ['queued', 'compiling', 'warming_up', 'running'].includes(status);

  if (!isRunning && status !== 'cancelled' && status !== 'failed') return null;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 my-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isRunning && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">{status.replace('_', ' ')}</span>
          <span className="text-xs text-slate-400 font-mono">({progressPercent}%)</span>
        </div>
        {isRunning && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-red-400 bg-red-950/40 border border-red-800/40 hover:bg-red-900/50 rounded transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Cancel Run</span>
          </button>
        )}
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-300 ${
            status === 'failed' ? 'bg-red-500' : status === 'cancelled' ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
          }`}
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 truncate">{stage}</p>
    </div>
  );
};

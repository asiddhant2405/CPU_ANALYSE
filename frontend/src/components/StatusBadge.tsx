import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toLowerCase();
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (s === 'completed' || s === 'verified' || s === 'success') {
    return (
      <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 ${px}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="capitalize">{status}</span>
      </span>
    );
  }

  if (s === 'running' || s === 'warming_up' || s === 'compiling' || s === 'measuring') {
    return (
      <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-blue-950/80 border border-blue-500/50 text-blue-400 ${px}`}>
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  }

  if (s === 'hardware_counter') {
    return (
      <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 ${px}`}>
        <Zap className="w-3.5 h-3.5" />
        <span>Hardware Measured</span>
      </span>
    );
  }

  if (s === 'modeled_estimate') {
    return (
      <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 ${px}`} title="Educational TDP model estimate (uncalibrated)">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Model Estimated</span>
      </span>
    );
  }

  if (s === 'unavailable' || s === 'none' || s === 'windows_none') {
    return (
      <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 ${px}`} title="Not supported on this OS without specialized kernel drivers">
        <Cpu className="w-3.5 h-3.5" />
        <span>Unavailable</span>
      </span>
    );
  }

  if (s === 'failed' || s === 'timed_out' || s === 'error') {
    return (
      <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-red-950/80 border border-red-700/50 text-red-400 ${px}`}>
        <XCircle className="w-3.5 h-3.5" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  }

  if (s === 'cancelled') {
    return (
      <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-400 ${px}`}>
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Cancelled</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-300 ${px}`}>
      <span>{status}</span>
    </span>
  );
};

import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'violet' | 'slate';
  provenance?: 'hardware' | 'os' | 'model' | 'unavailable';
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'blue',
  provenance,
  tooltip,
}) => {
  const colorMap = {
    blue: 'border-blue-500/20 bg-blue-950/10 text-blue-400',
    emerald: 'border-emerald-500/20 bg-emerald-950/10 text-emerald-400',
    amber: 'border-amber-500/20 bg-amber-950/10 text-amber-400',
    violet: 'border-violet-500/20 bg-violet-950/10 text-violet-400',
    slate: 'border-slate-700/40 bg-slate-900/40 text-slate-400',
  };

  const provenanceBadge = () => {
    if (!provenance) return null;
    switch (provenance) {
      case 'hardware':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Hardware</span>;
      case 'os':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">OS/psutil</span>;
      case 'model':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">Model</span>;
      case 'unavailable':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Unavailable</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]} backdrop-blur-sm transition-all hover:border-slate-600 flex flex-col justify-between min-h-[105px]`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 min-w-0">
          <span className="truncate" title={title}>{title}</span>
          {tooltip && (
            <div className="relative group cursor-help shrink-0">
              <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-52 p-2 bg-slate-900 text-[11px] text-slate-300 rounded-lg shadow-xl border border-slate-700 z-50 pointer-events-none leading-normal">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          {provenanceBadge()}
          <Icon className="w-4 h-4 opacity-80 shrink-0" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums truncate" title={String(value)}>
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-400 shrink-0">{unit}</span>}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

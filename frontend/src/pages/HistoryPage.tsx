import React, { useState } from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { HistoryItem } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { getExportUrl } from '../services/api';

interface HistoryPageProps {
  history: HistoryItem[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => Promise<void>;
  onRefreshHistory: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onSelectSession,
  onDeleteSession,
  onRefreshHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = history.filter(
    (h) =>
      h.benchmark_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await onDeleteSession(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Benchmark Session History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Persistent archive stored in local SQLite database. Inspect, export, or manage past trials.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search benchmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-white">Delete Session?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently remove this benchmark session and its recorded trial telemetry?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table of History Items */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No matching benchmark sessions found</p>
            <p className="text-xs text-slate-500 mt-1">Run a benchmark from the Workbench to create records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Benchmark Name</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Equivalence</th>
                  <th className="py-3 px-3">Speedup / Verdict</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="truncate max-w-[220px]" title={item.benchmark_name}>
                        {item.benchmark_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {item.id.slice(0, 8)}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    <td className="py-3 px-3">
                      {item.verified_equivalent ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {item.speedup_factor ? (
                        <span className="font-mono text-cyan-400 font-bold">{item.speedup_factor.toFixed(2)}x Speedup</span>
                      ) : (
                        <span className="text-slate-400 truncate max-w-[180px] block">{item.summary_verdict || '-'}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectSession(item.id)}
                          className="px-2.5 py-1 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-xs font-medium"
                          title="Inspect Results"
                        >
                          Inspect
                        </button>

                        <button
                          onClick={() => window.open(getExportUrl(item.id, 'html'), '_blank')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Print HTML Report"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => window.open(getExportUrl(item.id, 'csv'), '_blank')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                          title="Export CSV"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

import {
  Cpu,
  Terminal,
  GitCompare,
  History,
  BookOpen,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Zap,
  Presentation,
} from 'lucide-react';
import { SystemCapabilities } from '../types/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  capabilities: SystemCapabilities | null;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  capabilities,
  backendOnline,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
            <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-400 shrink-0">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">CPU Energy Analyzer</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-900/60 border border-blue-700/50 text-blue-300">
                  COA Lab
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Same output. Different implementations. Different costs.</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-1 no-scrollbar mx-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('workbench')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'workbench'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Experiment Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'comparison'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Comparison</span>
            </button>

            <button
              onClick={() => setActiveTab('memory_cache')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'memory_cache'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Memory & Cache</span>
            </button>

            <button
              onClick={() => setActiveTab('energy')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'energy'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Energy</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'architecture'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Architecture</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            <button
              onClick={() => setActiveTab('methodology')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'methodology'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Methodology</span>
            </button>

            {/* Presentation Mode special highlighted button */}
            <button
              onClick={() => setActiveTab('presentation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border shadow-sm ${
                activeTab === 'presentation'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-purple-500/20'
                  : 'bg-purple-950/40 text-purple-300 border-purple-700/60 hover:bg-purple-900/60 hover:text-white'
              }`}
            >
              <Presentation className="w-3.5 h-3.5 text-purple-300" />
              <span>Presentation</span>
            </button>
          </nav>

          {/* System & Hardware Health Pill */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {backendOnline ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>API Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/50 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>API Offline</span>
              </div>
            )}

            {capabilities && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 max-w-[200px] truncate" title={capabilities.cpu_model}>
                <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{capabilities.cpu_model}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

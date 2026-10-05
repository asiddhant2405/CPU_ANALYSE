import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { WorkbenchPage } from './pages/WorkbenchPage';
import { ResultsPage } from './pages/ResultsPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { HistoryPage } from './pages/HistoryPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { MemoryCachePage } from './pages/MemoryCachePage';
import { EnergyPage } from './pages/EnergyPage';
import { ArchitectureExplorerPage } from './pages/ArchitectureExplorerPage';
import { PresentationMode } from './pages/PresentationMode';
import {
  SystemCapabilities,
  SampleCodePair,
  BenchmarkConfiguration,
  BenchmarkSession,
  HistoryItem,
} from './types/api';
import {
  fetchCapabilities,
  fetchSamples,
  startBenchmark,
  fetchHistory,
  fetchHistorySession,
  deleteHistorySession,
  cancelBenchmark,
} from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [samples, setSamples] = useState<SampleCodePair[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeSession, setActiveSession] = useState<BenchmarkSession | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  // Load initial system data
  useEffect(() => {
    async function loadData() {
      try {
        const [caps, samp, hist] = await Promise.all([
          fetchCapabilities(),
          fetchSamples(),
          fetchHistory(),
        ]);
        setCapabilities(caps);
        setSamples(samp);
        setHistory(hist);
        setBackendOnline(true);
      } catch (e) {
        console.error('Failed to initialize application data:', e);
        setBackendOnline(false);
      }
    }
    loadData();
  }, []);

  const refreshHistory = async () => {
    try {
      const hist = await fetchHistory();
      setHistory(hist);
    } catch (e) {
      console.error('Error refreshing history:', e);
    }
  };

  const handleRunBenchmark = async (config: BenchmarkConfiguration): Promise<BenchmarkSession> => {
    const session = await startBenchmark(config, false);
    setActiveSession(session);
    await refreshHistory();
    return session;
  };

  const handleBenchmarkComplete = (session: BenchmarkSession) => {
    setActiveSession(session);
    setActiveTab('comparison');
  };

  const handleCancelBenchmark = async () => {
    if (activeSession) {
      await cancelBenchmark(activeSession.id);
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      const session = await fetchHistorySession(id);
      setActiveSession(session);
      setActiveTab('comparison');
    } catch (e) {
      console.error('Failed to fetch session detail:', e);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteHistorySession(id);
      await refreshHistory();
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  const handleLaunchDemo = async () => {
    setActiveTab('workbench');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        capabilities={capabilities}
        backendOnline={backendOnline}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            capabilities={capabilities}
            history={history}
            onSelectSession={handleSelectSession}
            onLaunchDemo={handleLaunchDemo}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'workbench' && (
          <WorkbenchPage
            samples={samples}
            capabilities={capabilities}
            onRunBenchmark={handleRunBenchmark}
            activeSession={activeSession}
            onCancelBenchmark={handleCancelBenchmark}
            onBenchmarkComplete={handleBenchmarkComplete}
          />
        )}

        {activeTab === 'results' && activeSession && (
          <ResultsPage
            session={activeSession}
            onGoToComparison={() => setActiveTab('comparison')}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonPage
            session={activeSession}
            onOpenWorkbench={() => setActiveTab('workbench')}
          />
        )}

        {activeTab === 'memory_cache' && (
          <MemoryCachePage
            capabilities={capabilities}
            onLaunchExperimentB={() => setActiveTab('workbench')}
          />
        )}

        {activeTab === 'energy' && (
          <EnergyPage capabilities={capabilities} />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureExplorerPage />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            history={history}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onRefreshHistory={refreshHistory}
          />
        )}

        {activeTab === 'methodology' && (
          <MethodologyPage capabilities={capabilities} />
        )}

        {activeTab === 'presentation' && (
          <PresentationMode
            capabilities={capabilities}
            onNavigateWorkbench={() => setActiveTab('workbench')}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#090D18] py-4 text-center text-xs text-slate-500">
        <p>CPU Energy Efficiency Analyzer • Academic Systems Engineering Project for Computer Organization & Architecture</p>
      </footer>
    </div>
  );
};
export default App;

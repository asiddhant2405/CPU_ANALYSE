import {
  SystemCapabilities,
  SampleCodePair,
  BenchmarkConfiguration,
  BenchmarkSession,
  HistoryItem,
  StaticAnalysisReport,
  AssemblyAnalysisResponse,
} from '../types/api';

const BASE_URL = '/api';

export async function fetchCapabilities(): Promise<SystemCapabilities> {
  const res = await fetch(`${BASE_URL}/system/capabilities`);
  if (!res.ok) throw new Error(`Failed to fetch capabilities: ${res.statusText}`);
  return res.json();
}

export async function fetchSamples(): Promise<SampleCodePair[]> {
  const res = await fetch(`${BASE_URL}/samples`);
  if (!res.ok) throw new Error(`Failed to fetch samples: ${res.statusText}`);
  return res.json();
}

export async function startBenchmark(
  config: BenchmarkConfiguration,
  runAsync: boolean = false
): Promise<BenchmarkSession> {
  const res = await fetch(`${BASE_URL}/benchmarks?run_async=${runAsync}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Benchmark execution failed.');
  }
  return res.json();
}

export async function fetchBenchmarkStatus(sessionId: string): Promise<BenchmarkSession> {
  const res = await fetch(`${BASE_URL}/benchmarks/${sessionId}`);
  if (!res.ok) throw new Error(`Failed to fetch benchmark: ${res.statusText}`);
  return res.json();
}

export async function cancelBenchmark(sessionId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/benchmarks/${sessionId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to cancel benchmark: ${res.statusText}`);
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${BASE_URL}/history`);
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
  return res.json();
}

export async function fetchHistorySession(sessionId: string): Promise<BenchmarkSession> {
  const res = await fetch(`${BASE_URL}/history/${sessionId}`);
  if (!res.ok) throw new Error(`Failed to fetch history session: ${res.statusText}`);
  return res.json();
}

export async function deleteHistorySession(sessionId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/history/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete session: ${res.statusText}`);
}

export async function analyzeCode(
  source_code: string,
  language: string,
  implementation_name: string = 'Implementation'
): Promise<StaticAnalysisReport> {
  const res = await fetch(`${BASE_URL}/analyze-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_code, language, implementation_name }),
  });
  if (!res.ok) throw new Error(`Failed to analyze code: ${res.statusText}`);
  return res.json();
}

export function getExportUrl(sessionId: string, format: 'csv' | 'json' | 'html'): string {
  return `${BASE_URL}/history/${sessionId}/export?format=${format}`;
}

export async function fetchDisassembly(
  sourceCode: string,
  language: string,
  compilerFlags?: string[]
): Promise<AssemblyAnalysisResponse> {
  const res = await fetch(`${BASE_URL}/disassemble`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: sourceCode,
      language,
      compiler_flags: compilerFlags,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Disassembly request failed');
  }
  return res.json();
}


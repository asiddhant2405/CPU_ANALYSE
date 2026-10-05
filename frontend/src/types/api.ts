export interface EnergyBackendStatus {
  available: boolean;
  backend_type: string;
  domain_name?: string | null;
  unit: string;
  explanation: string;
  remedy?: string | null;
}

export interface SystemCapabilities {
  os_name: string;
  os_version: string;
  architecture: string;
  cpu_model: string;
  physical_cores: int_or_number;
  logical_cores: number;
  max_freq_mhz?: number | null;
  current_freq_mhz?: number | null;
  total_memory_gb: number;
  available_memory_gb: number;
  python_version: string;
  gcc_available: boolean;
  gcc_version?: string | null;
  gpp_available: boolean;
  gpp_version?: string | null;
  docker_available: boolean;
  energy_backend: EnergyBackendStatus;
  supported_languages: string[];
  isolation_mode: string;
  safety_warning: string;
}

type int_or_number = number;

export interface ImplementationRequest {
  name: string;
  language: 'python' | 'c' | 'cpp' | string;
  source_code: string;
  compiler_flags?: string[];
  input_args?: string[];
}

export interface BenchmarkConfiguration {
  benchmark_name: string;
  task_id?: string | null;
  implementations: ImplementationRequest[];
  warmup_runs: number;
  measurement_runs: number;
  timeout_seconds: number;
  verify_output_equivalence: boolean;
  expected_output?: string | null;
  enable_modeled_estimate: boolean;
  tdp_watts?: number;
}

export interface RunResult {
  run_index: number;
  is_warmup: boolean;
  execution_time_ms: number;
  execution_time_ns: number;
  user_cpu_time_ms: number;
  system_cpu_time_ms: number;
  process_cpu_percent: number;
  system_cpu_percent: number;
  peak_rss_bytes: number;
  peak_rss_mb: number;
  return_code: number;
  stdout: string;
  stderr: string;
  success: boolean;
  timed_out: boolean;
  error_message?: string | null;
  hardware_energy_uj?: number | null;
  hardware_energy_j?: number | null;
  modeled_energy_j?: number | null;
  energy_source_label: string;
}

export interface CompilationResult {
  implementation_name: string;
  language: string;
  success: boolean;
  compilation_time_ms: number;
  compiler_output: string;
  compiler_flags: string[];
  binary_path?: string | null;
}

export interface BenchmarkSummary {
  implementation_name: string;
  language: string;
  total_runs: number;
  valid_runs: number;
  failed_runs: number;
  warmup_runs_count: number;
  median_execution_time_ms: number;
  mean_execution_time_ms: number;
  min_execution_time_ms: number;
  max_execution_time_ms: number;
  stddev_execution_time_ms: number;
  iqr_execution_time_ms: number;
  mean_user_cpu_time_ms: number;
  mean_system_cpu_time_ms: number;
  mean_cpu_percent: number;
  peak_rss_mb: number;
  hardware_energy_j?: number | null;
  modeled_energy_j?: number | null;
  energy_source_label: string;
  energy_details: string;
  compilation_time_ms?: number | null;
  output_sample: string;
  output_valid: boolean;
}

export interface ComparisonResult {
  verified_equivalent: boolean;
  equivalence_note: string;
  baseline_name: string;
  candidate_name: string;
  baseline_median_ms: number;
  candidate_median_ms: number;
  time_difference_percent: number;
  speedup_factor: number;
  faster_implementation: string;
  baseline_peak_mb: number;
  candidate_peak_mb: number;
  memory_difference_percent: number;
  energy_comparison_valid: boolean;
  energy_difference_percent?: number | null;
  energy_explanation: string;
  summary_verdict: string;
  plain_language_explanation: string;
  limitations: string[];
  architecture_insights?: ArchitectureInsights | null;
}

export interface ArchitectureInsights {
  investigation_goal: string;
  independent_variable: string;
  controlled_constants: string;
  observed_results: string;
  relevant_coa_concepts: string[];
  architectural_mechanisms: string;
  proven_by_measurements: string[];
  hypotheses_not_proven: string[];
  confounding_factors: string[];
  academic_conclusion: string;
  what_this_proves: string[];
  what_this_does_not_prove: string[];
}

export interface AssemblyInstruction {
  line_number: number;
  raw_text: string;
  opcode?: string | null;
  operands?: string | null;
  category: 'alu' | 'data_transfer' | 'control_transfer' | 'comparison' | 'directive' | 'label' | 'other' | string;
  comment?: string | null;
}

export interface AssemblyAnalysisResponse {
  language: string;
  compiler: string;
  flags: string[];
  success: boolean;
  total_lines: number;
  instruction_count: number;
  category_counts: Record<string, number>;
  instructions: AssemblyInstruction[];
  explanation: string;
  coa_insight: string;
  error?: string | null;
}

export interface BenchmarkSession {
  id: string;
  timestamp: string;
  status: 'queued' | 'compiling' | 'warming_up' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out';
  progress_percent: number;
  current_stage: string;
  config: BenchmarkConfiguration;
  compilations: Record<string, CompilationResult>;
  runs: Record<string, RunResult[]>;
  summaries: Record<string, BenchmarkSummary>;
  comparison?: ComparisonResult | null;
  architecture_insights?: ArchitectureInsights | null;
  system_capabilities: SystemCapabilities;
  warnings: string[];
  created_at: string;
  completed_at?: string | null;
  error?: string | null;
}

export interface HistoryItem {
  id: string;
  benchmark_name: string;
  status: string;
  timestamp: string;
  created_at: string;
  completed_at?: string | null;
  implementations: string[];
  verified_equivalent: boolean;
  summary_verdict?: string | null;
  faster_implementation?: string | null;
  speedup_factor?: number | null;
}

export interface SampleCodePair {
  task_id: string;
  title: string;
  tagline: string;
  problem_statement: string;
  input_parameter_label: string;
  default_input_value: string;
  expected_output_for_default: string;
  coa_learning_concept: string;
  languages: Record<string, {
    implementation_a: { name: string; code: string; compiler_flags?: string[] };
    implementation_b: { name: string; code: string; compiler_flags?: string[] };
  }>;
}

export interface StaticAnalysisFinding {
  construct_type: string;
  count: number;
  details: string;
  estimated_complexity: string;
  lines: number[];
}

export interface StaticAnalysisReport {
  language: string;
  implementation_name: string;
  findings: StaticAnalysisFinding[];
  algorithmic_complexity: string;
  explanation: string;
  caveat: string;
}

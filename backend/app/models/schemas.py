"""
Data models and schemas for the CPU Energy Efficiency Analyzer.
Follows strict typing, self-describing provenance, and transparent metric labeling.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class EnergyBackendStatus(BaseModel):
    available: bool
    backend_type: str  # "linux_rapl", "windows_telemetry", "none"
    domain_name: Optional[str] = None  # e.g. "package-0", "cpu"
    unit: str = "Joules"
    explanation: str
    remedy: Optional[str] = None


class SystemCapabilities(BaseModel):
    os_name: str
    os_version: str
    architecture: str
    cpu_model: str
    physical_cores: int
    logical_cores: int
    max_freq_mhz: Optional[float] = None
    current_freq_mhz: Optional[float] = None
    total_memory_gb: float
    available_memory_gb: float
    python_version: str
    gcc_available: bool
    gcc_version: Optional[str] = None
    gpp_available: bool
    gpp_version: Optional[str] = None
    docker_available: bool
    energy_backend: EnergyBackendStatus
    supported_languages: List[str]
    isolation_mode: str = "restricted_local_subprocess"
    safety_warning: str = (
        "Subprocesses run locally on the host with timeouts and argument array isolation. "
        "Container isolation (Docker) is not active; execute only trusted code."
    )


class ImplementationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    language: str = Field(..., pattern="^(python|c|cpp)$")
    source_code: str = Field(..., min_length=1, max_length=65536)
    compiler_flags: Optional[List[str]] = None
    input_args: Optional[List[str]] = None


class BenchmarkConfiguration(BaseModel):
    benchmark_name: str = Field(..., min_length=1, max_length=120)
    task_id: Optional[str] = None
    implementations: List[ImplementationRequest] = Field(..., min_length=1, max_length=5)
    warmup_runs: int = Field(2, ge=1, le=10)
    measurement_runs: int = Field(10, ge=3, le=50)
    timeout_seconds: float = Field(10.0, ge=0.5, le=60.0)
    verify_output_equivalence: bool = True
    expected_output: Optional[str] = None
    enable_modeled_estimate: bool = False
    tdp_watts: Optional[float] = Field(28.0, ge=5.0, le=300.0)


class RunResult(BaseModel):
    run_index: int
    is_warmup: bool
    execution_time_ms: float
    execution_time_ns: int
    user_cpu_time_ms: float
    system_cpu_time_ms: float
    process_cpu_percent: float
    system_cpu_percent: float
    peak_rss_bytes: int
    peak_rss_mb: float
    return_code: int
    stdout: str
    stderr: str
    success: bool
    timed_out: bool = False
    error_message: Optional[str] = None
    # Energy metrics
    hardware_energy_uj: Optional[float] = None
    hardware_energy_j: Optional[float] = None
    modeled_energy_j: Optional[float] = None
    energy_source_label: str  # "hardware_counter", "modeled_estimate", "unavailable"


class CompilationResult(BaseModel):
    implementation_name: str
    language: str
    success: bool
    compilation_time_ms: float
    compiler_output: str
    compiler_flags: List[str]
    binary_path: Optional[str] = None


class BenchmarkSummary(BaseModel):
    implementation_name: str
    language: str
    total_runs: int
    valid_runs: int
    failed_runs: int
    warmup_runs_count: int
    # Execution time statistics (ms)
    median_execution_time_ms: float
    mean_execution_time_ms: float
    min_execution_time_ms: float
    max_execution_time_ms: float
    stddev_execution_time_ms: float
    iqr_execution_time_ms: float
    # CPU & Memory statistics
    mean_user_cpu_time_ms: float
    mean_system_cpu_time_ms: float
    mean_cpu_percent: float
    peak_rss_mb: float
    # Energy
    hardware_energy_j: Optional[float] = None
    modeled_energy_j: Optional[float] = None
    energy_source_label: str
    energy_details: str
    # Compilation
    compilation_time_ms: Optional[float] = None
    output_sample: str
    output_valid: bool


class ComparisonResult(BaseModel):
    verified_equivalent: bool
    equivalence_note: str
    baseline_name: str
    candidate_name: str
    # Execution time
    baseline_median_ms: float
    candidate_median_ms: float
    time_difference_percent: float  # negative means candidate is faster
    speedup_factor: float  # baseline / candidate
    faster_implementation: str
    # Memory
    baseline_peak_mb: float
    candidate_peak_mb: float
    memory_difference_percent: float
    # Energy
    energy_comparison_valid: bool
    energy_difference_percent: Optional[float] = None
    energy_explanation: str
    # Synthesis
    summary_verdict: str
    plain_language_explanation: str
    limitations: List[str]
    architecture_insights: Optional["ArchitectureInsights"] = None


class ArchitectureInsights(BaseModel):
    investigation_goal: str
    independent_variable: str
    controlled_constants: str
    observed_results: str
    relevant_coa_concepts: List[str]
    architectural_mechanisms: str
    proven_by_measurements: List[str]
    hypotheses_not_proven: List[str]
    confounding_factors: List[str]
    academic_conclusion: str
    what_this_proves: List[str]
    what_this_does_not_prove: List[str]


class BenchmarkSession(BaseModel):
    id: str
    timestamp: str
    status: str  # queued, compiling, warming_up, running, completed, failed, cancelled, timed_out
    progress_percent: int
    current_stage: str
    config: BenchmarkConfiguration
    compilations: Dict[str, CompilationResult] = Field(default_factory=dict)
    runs: Dict[str, List[RunResult]] = Field(default_factory=dict)
    summaries: Dict[str, BenchmarkSummary] = Field(default_factory=dict)
    comparison: Optional[ComparisonResult] = None
    architecture_insights: Optional[ArchitectureInsights] = None
    system_capabilities: SystemCapabilities
    warnings: List[str] = Field(default_factory=list)
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None


class SampleCodePair(BaseModel):
    task_id: str
    title: str
    tagline: str
    problem_statement: str
    input_parameter_label: str
    default_input_value: str
    expected_output_for_default: str
    coa_learning_concept: str
    languages: Dict[str, Dict[str, Any]]


class StaticAnalysisFinding(BaseModel):
    construct_type: str  # loop, nested_loop, branch, function_call, arithmetic
    count: int
    details: str
    estimated_complexity: str
    lines: List[int] = Field(default_factory=list)


class StaticAnalysisReport(BaseModel):
    language: str
    implementation_name: str
    findings: List[StaticAnalysisFinding]
    algorithmic_complexity: str
    explanation: str
    caveat: str = (
        "Static heuristic analysis inspects source structure only. It does not measure "
        "machine instructions, cache lines, or hardware cycles."
    )


class AssemblyInstruction(BaseModel):
    line_number: int
    raw_text: str
    opcode: Optional[str] = None
    operands: Optional[str] = None
    category: str  # alu, data_transfer, control_transfer, comparison, directive, label, other
    comment: Optional[str] = None


class AssemblyAnalysisResponse(BaseModel):
    language: str
    compiler: str
    flags: List[str]
    success: bool
    total_lines: int
    instruction_count: int  # static instructions
    category_counts: Dict[str, int]
    instructions: List[AssemblyInstruction]
    explanation: str
    coa_insight: str
    error: Optional[str] = None


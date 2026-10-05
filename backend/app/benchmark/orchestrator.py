"""
Benchmark Orchestrator.
Coordinates compilation, warmups, repeated measurements, cancellation,
statistics calculation, equivalence verification, and persistence.
"""

import uuid
import datetime
from typing import Dict, Optional, Set
from app.models.schemas import (
    BenchmarkConfiguration,
    BenchmarkSession,
    CompilationResult,
    RunResult,
    BenchmarkSummary,
)
from app.core.system_capabilities import detect_system_capabilities
from app.core.security import SecureExecutionDirectory, validate_source_code
from app.execution.compiler import compile_source
from app.execution.runner import run_benchmark_trial
from app.measurement.manager import MeasurementManager
from app.analysis.statistics import summarize_runs
from app.analysis.comparison import compare_implementations
from app.storage.database import save_session, get_session

# In-memory tracking of active sessions and cancellation tokens
ACTIVE_SESSIONS: Dict[str, BenchmarkSession] = {}
CANCELLED_SESSIONS: Set[str] = set()


def get_active_session(session_id: str) -> Optional[BenchmarkSession]:
    """Retrieve session from in-memory cache or database."""
    if session_id in ACTIVE_SESSIONS:
        return ACTIVE_SESSIONS[session_id]
    return get_session(session_id)


def cancel_benchmark_job(session_id: str) -> bool:
    """Signal cancellation for an ongoing benchmark."""
    if session_id in ACTIVE_SESSIONS:
        session = ACTIVE_SESSIONS[session_id]
        if session.status in {"queued", "compiling", "warming_up", "running"}:
            CANCELLED_SESSIONS.add(session_id)
            session.status = "cancelled"
            session.current_stage = "Benchmark cancelled by user."
            save_session(session)
            return True
    return False


def run_benchmark_session(config: BenchmarkConfiguration) -> BenchmarkSession:
    """
    Execute a complete benchmark session synchronously or in a background task.
    Enforces isolation, timeouts, output equivalence, and honest telemetry labeling.
    """
    session_id = str(uuid.uuid4())
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    caps = detect_system_capabilities()

    # Pre-validate all implementation source codes
    for impl in config.implementations:
        validate_source_code(impl.source_code, impl.language)

    session = BenchmarkSession(
        id=session_id,
        timestamp=timestamp,
        status="queued",
        progress_percent=0,
        current_stage="Initializing benchmark environment...",
        config=config,
        system_capabilities=caps,
        created_at=timestamp,
    )
    ACTIVE_SESSIONS[session_id] = session

    total_steps = (
        len(config.implementations)  # compilation
        + len(config.implementations) * config.warmup_runs
        + len(config.implementations) * config.measurement_runs
        + 2  # analysis and finalize
    )
    completed_steps = 0

    def update_progress(stage: str):
        nonlocal completed_steps
        completed_steps += 1
        pct = min(99, int((completed_steps / total_steps) * 100))
        session.progress_percent = pct
        session.current_stage = stage

    try:
        with SecureExecutionDirectory() as workspace_dir:
            # 1. Compilation Stage
            session.status = "compiling"
            compiled_binaries: Dict[str, str] = {}

            for impl in config.implementations:
                if session_id in CANCELLED_SESSIONS:
                    session.status = "cancelled"
                    save_session(session)
                    return session

                update_progress(f"Compiling/preparing {impl.name} ({impl.language.upper()})...")
                comp_res = compile_source(
                    language=impl.language,
                    source_code=impl.source_code,
                    workspace_dir=workspace_dir,
                    implementation_name=impl.name,
                    custom_flags=impl.compiler_flags,
                    timeout_seconds=15.0,
                )
                session.compilations[impl.name] = comp_res

                if not comp_res.success:
                    session.status = "failed"
                    session.error = f"Compilation failed for '{impl.name}': {comp_res.compiler_output}"
                    session.completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    save_session(session)
                    return session

                compiled_binaries[impl.name] = comp_res.binary_path

            # Setup measurement manager
            meas_manager = MeasurementManager(
                enable_modeled_estimate=config.enable_modeled_estimate,
                tdp_watts=config.tdp_watts or 28.0,
            )

            # 2. Warm-Up Stage
            session.status = "warming_up"
            for impl in config.implementations:
                binary_or_script = compiled_binaries[impl.name]
                for w_idx in range(config.warmup_runs):
                    if session_id in CANCELLED_SESSIONS:
                        session.status = "cancelled"
                        save_session(session)
                        return session

                    update_progress(f"Warm-up {w_idx + 1}/{config.warmup_runs} for '{impl.name}'...")
                    warmup_res = run_benchmark_trial(
                        language=impl.language,
                        executable_or_script=binary_or_script,
                        workspace_dir=workspace_dir,
                        run_index=w_idx + 1,
                        is_warmup=True,
                        input_args=impl.input_args,
                        timeout_seconds=config.timeout_seconds,
                        measurement_manager=meas_manager,
                    )
                    if impl.name not in session.runs:
                        session.runs[impl.name] = []
                    session.runs[impl.name].append(warmup_res)

            # 3. Measurement Stage
            session.status = "running"
            for impl in config.implementations:
                binary_or_script = compiled_binaries[impl.name]
                for m_idx in range(config.measurement_runs):
                    if session_id in CANCELLED_SESSIONS:
                        session.status = "cancelled"
                        save_session(session)
                        return session

                    update_progress(
                        f"Measuring run {m_idx + 1}/{config.measurement_runs} for '{impl.name}'..."
                    )
                    run_res = run_benchmark_trial(
                        language=impl.language,
                        executable_or_script=binary_or_script,
                        workspace_dir=workspace_dir,
                        run_index=m_idx + 1,
                        is_warmup=False,
                        input_args=impl.input_args,
                        timeout_seconds=config.timeout_seconds,
                        measurement_manager=meas_manager,
                    )
                    session.runs[impl.name].append(run_res)

            # 4. Statistical Analysis Stage
            session.current_stage = "Computing robust statistics and verifying outputs..."
            for impl in config.implementations:
                runs = session.runs.get(impl.name, [])
                comp = session.compilations.get(impl.name)
                comp_time = comp.compilation_time_ms if comp else None
                summary = summarize_runs(
                    implementation_name=impl.name,
                    language=impl.language,
                    all_runs=runs,
                    compilation_time_ms=comp_time,
                )
                session.summaries[impl.name] = summary

            # 5. Output Equivalence & Comparison Stage
            if len(config.implementations) >= 2:
                impl_names = [impl.name for impl in config.implementations]
                baseline_summary = session.summaries[impl_names[0]]
                candidate_summary = session.summaries[impl_names[1]]
                comparison = compare_implementations(
                    baseline_summary,
                    candidate_summary,
                    task_id=config.task_id,
                    os_name=session.system_capabilities.os_name,
                )
                session.comparison = comparison
                session.architecture_insights = comparison.architecture_insights



                # Validate expected output if specified
                if config.expected_output and baseline_summary.output_sample:
                    if config.expected_output.strip() != baseline_summary.output_sample.strip():
                        session.warnings.append(
                            f"Expected output '{config.expected_output.strip()}' did not match "
                            f"baseline output '{baseline_summary.output_sample.strip()}'."
                        )

            # 6. Finalize
            session.status = "completed"
            session.progress_percent = 100
            session.current_stage = "Benchmark completed successfully."
            session.completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            save_session(session)
            return session

    except Exception as e:
        session.status = "failed"
        session.error = f"Orchestration error: {str(e)}"
        session.completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        save_session(session)
        return session

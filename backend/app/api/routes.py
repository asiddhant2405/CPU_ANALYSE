"""
FastAPI application routes and endpoint handlers.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.models.schemas import (
    SystemCapabilities,
    BenchmarkConfiguration,
    BenchmarkSession,
    SampleCodePair,
    StaticAnalysisReport,
    AssemblyAnalysisResponse,
)
from app.core.system_capabilities import detect_system_capabilities
from app.benchmark.sample_tasks import get_all_samples, get_sample_by_id
from app.benchmark.orchestrator import (
    run_benchmark_session,
    get_active_session,
    cancel_benchmark_job,
)
from app.storage.database import list_sessions, get_session, delete_session
from app.export.exporter import export_session_csv, export_session_json, export_session_html
from app.analysis.static_analyzer import analyze_source_code
from app.execution.assembly import disassemble_source

router = APIRouter()


class CodeAnalysisRequest(BaseModel):
    source_code: str
    language: str
    implementation_name: Optional[str] = "Implementation"


@router.get("/health")
def health_check() -> Dict[str, str]:
    """Health check endpoint confirming backend availability."""
    return {"status": "ok", "service": "cpu-energy-efficiency-analyzer"}


@router.get("/system/capabilities", response_model=SystemCapabilities)
def get_capabilities() -> SystemCapabilities:
    """Retrieve host hardware capabilities, compiler versions, and telemetry backends."""
    return detect_system_capabilities()


@router.get("/system/info")
def get_system_info() -> Dict[str, Any]:
    """Retrieve summarized system information."""
    caps = detect_system_capabilities()
    return {
        "os": f"{caps.os_name} {caps.os_version}",
        "architecture": caps.architecture,
        "cpu": caps.cpu_model,
        "physical_cores": caps.physical_cores,
        "logical_cores": caps.logical_cores,
        "total_memory_gb": caps.total_memory_gb,
        "python_version": caps.python_version,
        "gcc_available": caps.gcc_available,
        "gpp_available": caps.gpp_available,
        "energy_backend": caps.energy_backend.backend_type,
        "energy_available": caps.energy_backend.available,
        "isolation_mode": caps.isolation_mode,
    }


@router.get("/samples", response_model=List[SampleCodePair])
def list_benchmark_samples() -> List[SampleCodePair]:
    """List all preconfigured demonstration tasks."""
    return get_all_samples()


@router.get("/samples/{task_id}", response_model=SampleCodePair)
def get_benchmark_sample(task_id: str) -> SampleCodePair:
    """Retrieve a specific demonstration task by ID."""
    try:
        return get_sample_by_id(task_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Sample '{task_id}' not found.")


@router.post("/benchmarks", response_model=BenchmarkSession)
def start_benchmark(
    config: BenchmarkConfiguration,
    background_tasks: BackgroundTasks,
    run_async: bool = False,
) -> BenchmarkSession:
    """
    Start a benchmark session. If run_async is True, executes in background.
    By default runs synchronously and returns full results when finished.
    """
    if run_async:
        # Launch in background and return queued session
        import uuid
        import datetime
        session_id = str(uuid.uuid4())
        session = BenchmarkSession(
            id=session_id,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            status="queued",
            progress_percent=0,
            current_stage="Queued in background...",
            config=config,
            system_capabilities=detect_system_capabilities(),
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )
        from app.benchmark.orchestrator import ACTIVE_SESSIONS
        ACTIVE_SESSIONS[session_id] = session
        background_tasks.add_task(run_benchmark_session, config)
        return session
    else:
        # Execute synchronously
        session = run_benchmark_session(config)
        return session


@router.get("/benchmarks/{session_id}", response_model=BenchmarkSession)
def get_benchmark_status(session_id: str) -> BenchmarkSession:
    """Get status, progress, or completed results for a benchmark session."""
    session = get_active_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Benchmark session '{session_id}' not found.")
    return session


@router.post("/benchmarks/{session_id}/cancel")
def cancel_benchmark(session_id: str) -> Dict[str, Any]:
    """Cancel an active benchmark session."""
    cancelled = cancel_benchmark_job(session_id)
    if not cancelled:
        raise HTTPException(status_code=400, detail="Benchmark cannot be cancelled or already completed.")
    return {"status": "cancelled", "session_id": session_id}


@router.get("/history")
def get_benchmark_history(limit: int = 50) -> List[Dict[str, Any]]:
    """List completed benchmark history sessions."""
    return list_sessions(limit=limit)


@router.get("/history/{session_id}", response_model=BenchmarkSession)
def get_history_detail(session_id: str) -> BenchmarkSession:
    """Retrieve full details of a saved benchmark session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"History session '{session_id}' not found.")
    return session


@router.delete("/history/{session_id}")
def delete_history_entry(session_id: str) -> Dict[str, Any]:
    """Delete a saved benchmark session from history."""
    deleted = delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    return {"status": "deleted", "session_id": session_id}


@router.get("/history/{session_id}/export")
def export_benchmark_session(session_id: str, format: str = "json") -> Response:
    """Export benchmark session as CSV, JSON, or HTML evaluation report."""
    session = get_active_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    fmt = format.lower()
    if fmt == "csv":
        content = export_session_csv(session)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="benchmark_{session_id}.csv"'}
        )
    elif fmt == "html":
        content = export_session_html(session)
        return Response(
            content=content,
            media_type="text/html",
            headers={"Content-Disposition": f'inline; filename="report_{session_id}.html"'}
        )
    elif fmt == "json":
        content = export_session_json(session)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="benchmark_{session_id}.json"'}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Choose from 'json', 'csv', or 'html'.")


@router.post("/analyze-code", response_model=StaticAnalysisReport)
def analyze_code_endpoint(req: CodeAnalysisRequest) -> StaticAnalysisReport:
    """Run educational static heuristic analysis on source code without execution."""
    return analyze_source_code(req.source_code, req.language, req.implementation_name or "Implementation")


class DisassemblyRequest(BaseModel):
    source_code: str
    language: str
    compiler_flags: Optional[List[str]] = None


@router.post("/disassemble", response_model=AssemblyAnalysisResponse)
def disassemble_endpoint(req: DisassemblyRequest) -> AssemblyAnalysisResponse:
    """
    Disassemble source code to native x86/x86-64 assembly (via GCC/G++) or
    CPython VM bytecode, complete with opcode categorization and COA insight.
    """
    return disassemble_source(req.language, req.source_code, req.compiler_flags)


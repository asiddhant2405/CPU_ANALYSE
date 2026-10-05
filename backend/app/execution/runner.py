"""
Subprocess execution runner with safety limits and telemetry instrumentation.
"""

import time
import subprocess
import threading
import psutil
from typing import List, Optional
from app.models.schemas import RunResult
from app.execution.languages import get_language_config
from app.measurement.manager import MeasurementManager
from app.core.security import truncate_output


def run_benchmark_trial(
    language: str,
    executable_or_script: str,
    workspace_dir: str,
    run_index: int,
    is_warmup: bool,
    input_args: Optional[List[str]] = None,
    timeout_seconds: float = 10.0,
    measurement_manager: Optional[MeasurementManager] = None,
) -> RunResult:
    """
    Execute a single benchmark repetition safely with argument array,
    bounded timeouts, output truncation, and telemetry sampling.
    """
    if measurement_manager is None:
        measurement_manager = MeasurementManager()

    cfg = get_language_config(language)
    cmd = cfg["command_generator"](executable_or_script, input_args)

    measurement_manager.start_measurement()

    proc: Optional[subprocess.Popen] = None
    stop_sampling = threading.Event()
    sampler_thread: Optional[threading.Thread] = None

    def _sample_loop(process_obj: subprocess.Popen):
        try:
            p = psutil.Process(process_obj.pid)
            while not stop_sampling.is_set() and process_obj.poll() is None:
                measurement_manager.record_process_sample(p)
                time.sleep(0.005)  # 5ms sampling interval
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=workspace_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.DEVNULL,
            shell=False,
        )

        sampler_thread = threading.Thread(target=_sample_loop, args=(proc,), daemon=True)
        sampler_thread.start()

        stdout_bytes, stderr_bytes = proc.communicate(timeout=timeout_seconds)
        stop_sampling.set()
        if sampler_thread and sampler_thread.is_alive():
            sampler_thread.join(timeout=0.1)

        metrics = measurement_manager.stop_measurement(proc.pid)

        stdout_str = truncate_output(stdout_bytes.decode("utf-8", errors="replace").strip())
        stderr_str = truncate_output(stderr_bytes.decode("utf-8", errors="replace").strip())
        success = proc.returncode == 0

        return RunResult(
            run_index=run_index,
            is_warmup=is_warmup,
            execution_time_ms=metrics["execution_time_ms"],
            execution_time_ns=metrics["execution_time_ns"],
            user_cpu_time_ms=metrics["user_cpu_time_ms"],
            system_cpu_time_ms=metrics["system_cpu_time_ms"],
            process_cpu_percent=metrics["process_cpu_percent"],
            system_cpu_percent=metrics["system_cpu_percent"],
            peak_rss_bytes=metrics["peak_rss_bytes"],
            peak_rss_mb=metrics["peak_rss_mb"],
            return_code=proc.returncode,
            stdout=stdout_str,
            stderr=stderr_str,
            success=success,
            timed_out=False,
            error_message=None if success else f"Process exited with non-zero status code: {proc.returncode}",
            hardware_energy_uj=metrics.get("hardware_energy_uj"),
            hardware_energy_j=metrics.get("hardware_energy_j"),
            modeled_energy_j=metrics.get("modeled_energy_j"),
            energy_source_label=metrics.get("energy_source_label", "unavailable"),
        )

    except subprocess.TimeoutExpired:
        stop_sampling.set()
        # Gracefully kill process tree
        if proc:
            try:
                parent = psutil.Process(proc.pid)
                for child in parent.children(recursive=True):
                    try:
                        child.kill()
                    except Exception:
                        pass
                parent.kill()
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass

        metrics = measurement_manager.stop_measurement()
        return RunResult(
            run_index=run_index,
            is_warmup=is_warmup,
            execution_time_ms=round(timeout_seconds * 1000.0, 3),
            execution_time_ns=int(timeout_seconds * 1_000_000_000),
            user_cpu_time_ms=0.0,
            system_cpu_time_ms=0.0,
            process_cpu_percent=0.0,
            system_cpu_percent=0.0,
            peak_rss_bytes=0,
            peak_rss_mb=0.0,
            return_code=-1,
            stdout="",
            stderr=f"Process timed out after {timeout_seconds} seconds.",
            success=False,
            timed_out=True,
            error_message=f"Timeout limit reached ({timeout_seconds}s).",
            hardware_energy_uj=None,
            hardware_energy_j=None,
            modeled_energy_j=None,
            energy_source_label="unavailable",
        )
    except Exception as e:
        stop_sampling.set()
        metrics = measurement_manager.stop_measurement()
        return RunResult(
            run_index=run_index,
            is_warmup=is_warmup,
            execution_time_ms=metrics.get("execution_time_ms", 0.0),
            execution_time_ns=metrics.get("execution_time_ns", 0),
            user_cpu_time_ms=0.0,
            system_cpu_time_ms=0.0,
            process_cpu_percent=0.0,
            system_cpu_percent=0.0,
            peak_rss_bytes=0,
            peak_rss_mb=0.0,
            return_code=-1,
            stdout="",
            stderr=str(e),
            success=False,
            timed_out=False,
            error_message=f"Execution failed: {str(e)}",
            hardware_energy_uj=None,
            hardware_energy_j=None,
            modeled_energy_j=None,
            energy_source_label="unavailable",
        )

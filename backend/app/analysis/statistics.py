"""
Statistical analysis routines for benchmark measurements.
Follows standard robust statistics (median, IQR, sample standard deviation).
"""

import math
from typing import List, Dict, Any, Optional
from app.models.schemas import RunResult, BenchmarkSummary


def compute_median(values: List[float]) -> float:
    """Compute the median of a list of floats."""
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    mid = n // 2
    if n % 2 == 1:
        return sorted_vals[mid]
    return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0


def compute_iqr(values: List[float]) -> float:
    """Compute the Interquartile Range (IQR = Q3 - Q1)."""
    if len(values) < 2:
        return 0.0
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    q1 = compute_median(sorted_vals[: n // 2])
    q2_start = (n + 1) // 2 if n % 2 == 1 else n // 2
    q3 = compute_median(sorted_vals[q2_start:])
    return round(q3 - q1, 4)


def compute_stddev(values: List[float], mean_val: Optional[float] = None) -> float:
    """Compute sample standard deviation (Bessel's correction N-1)."""
    n = len(values)
    if n <= 1:
        return 0.0
    if mean_val is None:
        mean_val = sum(values) / n
    variance = sum((x - mean_val) ** 2 for x in values) / (n - 1)
    return round(math.sqrt(max(0.0, variance)), 4)


def summarize_runs(
    implementation_name: str,
    language: str,
    all_runs: List[RunResult],
    compilation_time_ms: Optional[float] = None,
) -> BenchmarkSummary:
    """
    Summarize a collection of benchmark runs into a BenchmarkSummary.
    Warmup runs are isolated; only valid non-warmup runs are included in summary statistics.
    """
    warmups = [r for r in all_runs if r.is_warmup]
    measured = [r for r in all_runs if not r.is_warmup]
    valid_runs = [r for r in measured if r.success and not r.timed_out]
    failed_runs = [r for r in measured if not r.success or r.timed_out]

    total_count = len(measured)
    valid_count = len(valid_runs)
    failed_count = len(failed_runs)

    if not valid_runs:
        last_out = all_runs[-1].stderr or all_runs[-1].stdout if all_runs else "No runs"
        return BenchmarkSummary(
            implementation_name=implementation_name,
            language=language,
            total_runs=total_count,
            valid_runs=0,
            failed_runs=failed_count,
            warmup_runs_count=len(warmups),
            median_execution_time_ms=0.0,
            mean_execution_time_ms=0.0,
            min_execution_time_ms=0.0,
            max_execution_time_ms=0.0,
            stddev_execution_time_ms=0.0,
            iqr_execution_time_ms=0.0,
            mean_user_cpu_time_ms=0.0,
            mean_system_cpu_time_ms=0.0,
            mean_cpu_percent=0.0,
            peak_rss_mb=0.0,
            hardware_energy_j=None,
            modeled_energy_j=None,
            energy_source_label="unavailable",
            energy_details="No valid runs to compute energy.",
            compilation_time_ms=compilation_time_ms,
            output_sample=last_out,
            output_valid=False,
        )

    exec_times = [r.execution_time_ms for r in valid_runs]
    mean_time = round(sum(exec_times) / valid_count, 4)
    med_time = round(compute_median(exec_times), 4)
    min_time = round(min(exec_times), 4)
    max_time = round(max(exec_times), 4)
    stddev_time = compute_stddev(exec_times, mean_time)
    iqr_time = compute_iqr(exec_times)

    mean_user_cpu = round(sum(r.user_cpu_time_ms for r in valid_runs) / valid_count, 4)
    mean_sys_cpu = round(sum(r.system_cpu_time_ms for r in valid_runs) / valid_count, 4)
    mean_cpu_pct = round(sum(r.process_cpu_percent for r in valid_runs) / valid_count, 2)
    max_peak_rss_mb = round(max(r.peak_rss_mb for r in valid_runs), 3)

    # Energy calculations
    hw_energies = [r.hardware_energy_j for r in valid_runs if r.hardware_energy_j is not None]
    modeled_energies = [r.modeled_energy_j for r in valid_runs if r.modeled_energy_j is not None]

    hw_energy_j = None
    modeled_energy_j = None
    energy_label = valid_runs[0].energy_source_label
    energy_details = "Hardware energy measurement unavailable on this platform."

    if hw_energies:
        hw_energy_j = round(compute_median(hw_energies), 6)
        energy_label = "hardware_counter"
        energy_details = f"Median hardware package energy: {hw_energy_j} J (across {len(hw_energies)} runs)"
    elif modeled_energies:
        modeled_energy_j = round(compute_median(modeled_energies), 6)
        energy_label = "modeled_estimate"
        energy_details = f"Median model-estimated energy: {modeled_energy_j} J (TDP activity scaling model)"

    sample_stdout = valid_runs[0].stdout

    return BenchmarkSummary(
        implementation_name=implementation_name,
        language=language,
        total_runs=total_count,
        valid_runs=valid_count,
        failed_runs=failed_count,
        warmup_runs_count=len(warmups),
        median_execution_time_ms=med_time,
        mean_execution_time_ms=mean_time,
        min_execution_time_ms=min_time,
        max_execution_time_ms=max_time,
        stddev_execution_time_ms=stddev_time,
        iqr_execution_time_ms=iqr_time,
        mean_user_cpu_time_ms=mean_user_cpu,
        mean_system_cpu_time_ms=mean_sys_cpu,
        mean_cpu_percent=mean_cpu_pct,
        peak_rss_mb=max_peak_rss_mb,
        hardware_energy_j=hw_energy_j,
        modeled_energy_j=modeled_energy_j,
        energy_source_label=energy_label,
        energy_details=energy_details,
        compilation_time_ms=compilation_time_ms,
        output_sample=sample_stdout,
        output_valid=True,
    )

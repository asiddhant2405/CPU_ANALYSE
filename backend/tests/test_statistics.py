"""
Unit tests for robust statistical routines.
"""

from app.analysis.statistics import (
    compute_median,
    compute_iqr,
    compute_stddev,
    summarize_runs,
)
from app.models.schemas import RunResult


def test_compute_median():
    assert compute_median([]) == 0.0
    assert compute_median([5.0]) == 5.0
    assert compute_median([1.0, 3.0, 2.0]) == 2.0
    assert compute_median([1.0, 2.0, 3.0, 4.0]) == 2.5


def test_compute_iqr():
    assert compute_iqr([]) == 0.0
    assert compute_iqr([10.0]) == 0.0
    # [1, 2, 3, 4, 5, 6, 7] -> Q1=2, Q3=6 -> IQR=4
    assert compute_iqr([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]) == 4.0


def test_compute_stddev():
    assert compute_stddev([]) == 0.0
    assert compute_stddev([4.0]) == 0.0
    # Values: [2, 4, 4, 4, 5, 5, 7, 9] -> mean=5, sample variance=4.5714 -> stddev=2.1381
    std = compute_stddev([2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0])
    assert abs(std - 2.1381) < 0.01


def test_summarize_runs_separates_warmup():
    runs = [
        # Warmup
        RunResult(
            run_index=1,
            is_warmup=True,
            execution_time_ms=100.0,
            execution_time_ns=100000000,
            user_cpu_time_ms=100.0,
            system_cpu_time_ms=0.0,
            process_cpu_percent=100.0,
            system_cpu_percent=10.0,
            peak_rss_bytes=1048576,
            peak_rss_mb=1.0,
            return_code=0,
            stdout="499999500000",
            stderr="",
            success=True,
            energy_source_label="unavailable",
        ),
        # Measured 1
        RunResult(
            run_index=1,
            is_warmup=False,
            execution_time_ms=10.0,
            execution_time_ns=10000000,
            user_cpu_time_ms=10.0,
            system_cpu_time_ms=0.0,
            process_cpu_percent=100.0,
            system_cpu_percent=10.0,
            peak_rss_bytes=2097152,
            peak_rss_mb=2.0,
            return_code=0,
            stdout="499999500000",
            stderr="",
            success=True,
            energy_source_label="unavailable",
        ),
        # Measured 2
        RunResult(
            run_index=2,
            is_warmup=False,
            execution_time_ms=20.0,
            execution_time_ns=20000000,
            user_cpu_time_ms=20.0,
            system_cpu_time_ms=0.0,
            process_cpu_percent=100.0,
            system_cpu_percent=10.0,
            peak_rss_bytes=3145728,
            peak_rss_mb=3.0,
            return_code=0,
            stdout="499999500000",
            stderr="",
            success=True,
            energy_source_label="unavailable",
        ),
    ]

    summary = summarize_runs("TestImpl", "python", runs)
    assert summary.warmup_runs_count == 1
    assert summary.valid_runs == 2
    # Median of 10 and 20 is 15
    assert summary.median_execution_time_ms == 15.0
    assert summary.min_execution_time_ms == 10.0
    assert summary.max_execution_time_ms == 20.0
    assert summary.peak_rss_mb == 3.0

"""
Unit tests for comparison and output equivalence logic.
"""

from app.analysis.comparison import check_output_equivalence, compare_implementations
from app.models.schemas import BenchmarkSummary


def test_output_equivalence():
    assert check_output_equivalence("499999500000", "499999500000\n") is True
    assert check_output_equivalence(" 123 ", "123") is True
    assert check_output_equivalence("499999500000", "499999500001") is False
    assert check_output_equivalence("error", "499999500000") is False


def test_compare_implementations():
    s1 = BenchmarkSummary(
        implementation_name="Iterative",
        language="python",
        total_runs=10,
        valid_runs=10,
        failed_runs=0,
        warmup_runs_count=2,
        median_execution_time_ms=50.0,
        mean_execution_time_ms=50.0,
        min_execution_time_ms=48.0,
        max_execution_time_ms=52.0,
        stddev_execution_time_ms=1.5,
        iqr_execution_time_ms=2.0,
        mean_user_cpu_time_ms=50.0,
        mean_system_cpu_time_ms=0.0,
        mean_cpu_percent=95.0,
        peak_rss_mb=15.0,
        hardware_energy_j=None,
        modeled_energy_j=None,
        energy_source_label="unavailable",
        energy_details="Unavailable",
        output_sample="499999500000",
        output_valid=True,
    )

    s2 = BenchmarkSummary(
        implementation_name="Gauss Formula",
        language="python",
        total_runs=10,
        valid_runs=10,
        failed_runs=0,
        warmup_runs_count=2,
        median_execution_time_ms=0.05,
        mean_execution_time_ms=0.05,
        min_execution_time_ms=0.04,
        max_execution_time_ms=0.06,
        stddev_execution_time_ms=0.005,
        iqr_execution_time_ms=0.01,
        mean_user_cpu_time_ms=0.05,
        mean_system_cpu_time_ms=0.0,
        mean_cpu_percent=10.0,
        peak_rss_mb=12.0,
        hardware_energy_j=None,
        modeled_energy_j=None,
        energy_source_label="unavailable",
        energy_details="Unavailable",
        output_sample="499999500000",
        output_valid=True,
    )

    comp = compare_implementations(s1, s2)
    assert comp.verified_equivalent is True
    assert comp.faster_implementation == "Gauss Formula"
    assert comp.speedup_factor >= 500.0  # 50.0 / 0.05 = 1000x
    assert comp.energy_comparison_valid is False
    assert "Energy comparison unavailable" in comp.energy_explanation

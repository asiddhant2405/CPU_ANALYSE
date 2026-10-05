"""
Comparison engine for verifying output equivalence and computing relative metrics.
"""

from typing import Dict, List, Optional
from app.models.schemas import BenchmarkSummary, ComparisonResult, ArchitectureInsights
from app.analysis.insights_generator import generate_architecture_insights


def check_output_equivalence(out1: str, out2: str) -> bool:
    """Verify if two program outputs are mathematically or textually equivalent."""
    clean1 = out1.strip()
    clean2 = out2.strip()
    if clean1 == clean2:
        return True

    # Attempt numeric equivalence
    try:
        if int(clean1) == int(clean2):
            return True
    except ValueError:
        pass

    try:
        if abs(float(clean1) - float(clean2)) < 1e-9:
            return True
    except ValueError:
        pass

    return False


def compare_implementations(
    baseline_summary: BenchmarkSummary,
    candidate_summary: BenchmarkSummary,
    task_id: Optional[str] = None,
    os_name: str = "Windows",
) -> ComparisonResult:
    """
    Compare baseline and candidate implementations side-by-side.
    Verifies correctness, computes speedup, memory delta, and conditional energy delta.
    Attaches academic Architecture Insights.
    """
    is_equivalent = check_output_equivalence(
        baseline_summary.output_sample, candidate_summary.output_sample
    )

    base_time = baseline_summary.median_execution_time_ms
    cand_time = candidate_summary.median_execution_time_ms

    if base_time > 0 and cand_time > 0:
        time_diff_pct = round(((cand_time - base_time) / base_time) * 100.0, 2)
        speedup = round(base_time / cand_time, 2) if cand_time > 0 else 1.0
    else:
        time_diff_pct = 0.0
        speedup = 1.0

    if cand_time < base_time:
        faster_impl = candidate_summary.implementation_name
    elif base_time < cand_time:
        faster_impl = baseline_summary.implementation_name
    else:
        faster_impl = "Identical execution time"

    # Memory difference
    base_mem = baseline_summary.peak_rss_mb
    cand_mem = candidate_summary.peak_rss_mb
    mem_diff_pct = round(((cand_mem - base_mem) / base_mem) * 100.0, 2) if base_mem > 0 else 0.0

    # Energy comparison logic
    energy_valid = False
    energy_diff_pct = None
    energy_explanation = ""

    b_hw = baseline_summary.hardware_energy_j
    c_hw = candidate_summary.hardware_energy_j
    b_mod = baseline_summary.modeled_energy_j
    c_mod = candidate_summary.modeled_energy_j

    if b_hw is not None and c_hw is not None and b_hw > 0:
        energy_valid = True
        energy_diff_pct = round(((c_hw - b_hw) / b_hw) * 100.0, 2)
        energy_explanation = (
            f"Hardware-measured package energy delta: {energy_diff_pct}% "
            f"({candidate_summary.implementation_name}: {c_hw} J vs {baseline_summary.implementation_name}: {b_hw} J)."
        )
    elif b_mod is not None and c_mod is not None and b_mod > 0:
        energy_valid = True
        energy_diff_pct = round(((c_mod - b_mod) / b_mod) * 100.0, 2)
        energy_explanation = (
            f"Model-estimated energy delta (UNVERIFIED): {energy_diff_pct}% "
            f"({candidate_summary.implementation_name}: {c_mod} J vs {baseline_summary.implementation_name}: {b_mod} J). "
            "Note: This is derived from an educational TDP scaling model, not a physical hardware counter."
        )
    else:
        energy_valid = False
        energy_diff_pct = None
        energy_explanation = (
            "Energy comparison unavailable: Direct hardware energy counters were not readable on this platform, "
            "and modeled estimates were either not enabled or incomplete. No energy savings percentage can be fabricated."
        )

    # Output equivalence note
    if is_equivalent:
        equiv_note = f"Verified: Both implementations produced matching output ('{baseline_summary.output_sample.strip()}')."
    else:
        equiv_note = (
            f"Output mismatch: Baseline output ('{baseline_summary.output_sample.strip()}') "
            f"did not match Candidate output ('{candidate_summary.output_sample.strip()}'). "
            "Comparisons between non-equivalent programs are technically invalid."
        )

    # Plain language explanation
    if not is_equivalent:
        verdict = "Invalid Comparison (Output Mismatch)"
        plain_expl = (
            "The two implementations produced different outputs. Because they did not solve the exact "
            "same task with verified equivalence, performance metrics cannot be meaningfully compared."
        )
    elif time_diff_pct < -5.0:
        verdict = f"{candidate_summary.implementation_name} is substantially faster ({speedup}x speedup)"
        plain_expl = (
            f"Under repeated measurement ({candidate_summary.valid_runs} runs), "
            f"'{candidate_summary.implementation_name}' achieved a median runtime of {cand_time} ms "
            f"compared to {base_time} ms for '{baseline_summary.implementation_name}', achieving a {speedup}x speedup. "
            f"From a Computer Organization perspective, the candidate replaces iterative loop instruction "
            f"cycles (fetch, decode, branch prediction, arithmetic accumulation) with a constant-time O(1) "
            f"ALU expression, drastically reducing total instruction executions."
        )
    elif time_diff_pct > 5.0:
        verdict = f"{baseline_summary.implementation_name} is substantially faster"
        plain_expl = (
            f"'{baseline_summary.implementation_name}' executed faster than '{candidate_summary.implementation_name}' "
            f"({base_time} ms vs {cand_time} ms). The baseline achieved lower median latency."
        )
    else:
        verdict = "Comparable Performance"
        plain_expl = (
            f"Both implementations demonstrated similar median execution times ({base_time} ms vs {cand_time} ms). "
            "The observed difference is within normal operating system scheduling noise."
        )

    limitations = [
        "Wall-clock timing includes process startup and interpreter initialization where applicable.",
        "Measurements reflect this specific CPU model, operating system scheduler, and compiler flags.",
        "Short-duration benchmarks are subject to timer resolution and cache residency warm-up effects."
    ]
    if not energy_valid:
        limitations.append(
            "Hardware energy counters are absent on this Windows environment. Execution time reduction does NOT "
            "automatically equal a linear energy reduction due to static leakage and non-linear power states."
        )
    insights = generate_architecture_insights(
        task_id=task_id,
        baseline=baseline_summary,
        candidate=candidate_summary,
        speedup=speedup,
        time_diff_pct=time_diff_pct,
        is_equivalent=is_equivalent,
        os_name=os_name,
        hardware_energy_available=energy_valid,
    )

    return ComparisonResult(
        verified_equivalent=is_equivalent,
        equivalence_note=equiv_note,
        baseline_name=baseline_summary.implementation_name,
        candidate_name=candidate_summary.implementation_name,
        baseline_median_ms=base_time,
        candidate_median_ms=cand_time,
        time_difference_percent=time_diff_pct,
        speedup_factor=speedup,
        faster_implementation=faster_impl,
        baseline_peak_mb=base_mem,
        candidate_peak_mb=cand_mem,
        memory_difference_percent=mem_diff_pct,
        energy_comparison_valid=energy_valid,
        energy_difference_percent=energy_diff_pct,
        energy_explanation=energy_explanation,
        summary_verdict=verdict,
        plain_language_explanation=plain_expl,
        limitations=limitations,
        architecture_insights=insights,
    )


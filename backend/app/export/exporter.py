"""
Export utilities for benchmark sessions.
Generates CSV tables, full JSON snapshots, and printable HTML COA reports.
"""

import csv
import io
import html
from typing import Dict, Any
from app.models.schemas import BenchmarkSession


def export_session_csv(session: BenchmarkSession) -> str:
    """Generate CSV string containing all individual benchmark runs."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Benchmark ID",
        "Benchmark Name",
        "Timestamp",
        "Implementation",
        "Language",
        "Run Index",
        "Is Warmup",
        "Execution Time (ms)",
        "Peak RSS (MB)",
        "Process CPU (%)",
        "System CPU (%)",
        "Return Code",
        "Success",
        "Timed Out",
        "Hardware Energy (J)",
        "Modeled Energy (J)",
        "Energy Source",
        "Stdout Sample",
    ])

    for impl_name, runs in session.runs.items():
        impl_cfg = next((i for i in session.config.implementations if i.name == impl_name), None)
        lang = impl_cfg.language if impl_cfg else "unknown"
        for r in runs:
            writer.writerow([
                session.id,
                session.config.benchmark_name,
                session.timestamp,
                impl_name,
                lang,
                r.run_index,
                r.is_warmup,
                r.execution_time_ms,
                r.peak_rss_mb,
                r.process_cpu_percent,
                r.system_cpu_percent,
                r.return_code,
                r.success,
                r.timed_out,
                r.hardware_energy_j if r.hardware_energy_j is not None else "N/A",
                r.modeled_energy_j if r.modeled_energy_j is not None else "N/A",
                r.energy_source_label,
                r.stdout.replace("\n", " ")[:100],
            ])

    return output.getvalue()


def export_session_json(session: BenchmarkSession) -> str:
    """Export complete session as formatted JSON."""
    return session.model_dump_json(indent=2)


def export_session_html(session: BenchmarkSession) -> str:
    """Generate a clean, self-contained HTML report for COA demonstration."""
    b_name = html.escape(session.config.benchmark_name)
    session_id = html.escape(session.id)
    timestamp = html.escape(session.timestamp)
    cpu_model = html.escape(session.system_capabilities.cpu_model)
    os_info = html.escape(f"{session.system_capabilities.os_name} {session.system_capabilities.os_version}")
    cores_info = f"{session.system_capabilities.physical_cores} Physical / {session.system_capabilities.logical_cores} Logical"

    summaries_html = ""
    for name, s in session.summaries.items():
        summaries_html += f"""
        <div class="summary-card">
            <h3>{html.escape(name)} <span class="badge">{html.escape(s.language.upper())}</span></h3>
            <table class="metric-table">
                <tr><td>Median Execution Time</td><td><strong>{s.median_execution_time_ms:.4f} ms</strong></td></tr>
                <tr><td>Mean Execution Time</td><td>{s.mean_execution_time_ms:.4f} ms (&plusmn;{s.stddev_execution_time_ms:.4f} ms)</td></tr>
                <tr><td>Min / Max Runtime</td><td>{s.min_execution_time_ms:.4f} ms / {s.max_execution_time_ms:.4f} ms</td></tr>
                <tr><td>Interquartile Range (IQR)</td><td>{s.iqr_execution_time_ms:.4f} ms</td></tr>
                <tr><td>Peak Memory (RSS)</td><td>{s.peak_rss_mb:.3f} MB</td></tr>
                <tr><td>Mean Process CPU %</td><td>{s.mean_cpu_percent:.1f}%</td></tr>
                <tr><td>Output Sample</td><td><code>{html.escape(s.output_sample.strip())}</code></td></tr>
                <tr><td>Output Valid</td><td>{"Yes" if s.output_valid else "No"}</td></tr>
                <tr><td>Energy Telemetry</td><td>{html.escape(s.energy_details)}</td></tr>
            </table>
        </div>
        """

    comparison_html = ""
    if session.comparison:
        c = session.comparison
        comparison_html = f"""
        <div class="comparison-section">
            <h2>Comparative Analysis</h2>
            <div class="verdict-banner {'verdict-success' if c.verified_equivalent else 'verdict-warning'}">
                <strong>Verdict:</strong> {html.escape(c.summary_verdict)}
            </div>
            <p><strong>Equivalence Check:</strong> {html.escape(c.equivalence_note)}</p>
            <p><strong>Speedup Factor:</strong> {c.speedup_factor:.2f}x ({c.time_difference_percent:.2f}% runtime difference)</p>
            <p><strong>Energy Explanation:</strong> {html.escape(c.energy_explanation)}</p>
            <div class="explanation-box">
                <h4>Computer Organization & Architecture Analysis:</h4>
                <p>{html.escape(c.plain_language_explanation)}</p>
            </div>
            <h4>Methodology Limitations & Scientific Disclosures:</h4>
            <ul>
                {"".join(f"<li>{html.escape(lim)}</li>" for lim in c.limitations)}
            </ul>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CPU Energy Efficiency Report — {b_name}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0F172A;
            color: #F8FAFC;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background-color: #1E293B;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid #334155;
        }}
        h1 {{ margin-top: 0; color: #38BDF8; font-size: 26px; border-bottom: 2px solid #334155; padding-bottom: 12px; }}
        h2 {{ color: #818CF8; margin-top: 28px; font-size: 20px; }}
        h3 {{ color: #F1F5F9; margin-top: 0; font-size: 17px; }}
        h4 {{ color: #94A3B8; margin-bottom: 6px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .meta-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
            background-color: #0F172A;
            padding: 16px;
            border-radius: 8px;
            font-size: 14px;
        }}
        .meta-item strong {{ color: #94A3B8; }}
        .summary-card {{
            background-color: #0F172A;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #334155;
        }}
        .badge {{
            background-color: #2563EB;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            vertical-align: middle;
            margin-left: 8px;
        }}
        .metric-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-top: 10px;
        }}
        .metric-table td {{
            padding: 8px 12px;
            border-bottom: 1px solid #1E293B;
        }}
        .metric-table tr:last-child td {{ border-bottom: none; }}
        .verdict-banner {{
            padding: 14px 18px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 16px;
        }}
        .verdict-success {{ background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; color: #34D399; }}
        .verdict-warning {{ background-color: rgba(245, 158, 11, 0.15); border: 1px solid #F59E0B; color: #FBBF24; }}
        .explanation-box {{
            background-color: #0F172A;
            border-left: 4px solid #38BDF8;
            padding: 14px 18px;
            margin: 16px 0;
            border-radius: 0 8px 8px 0;
        }}
        code {{
            background-color: #020617;
            padding: 2px 6px;
            border-radius: 4px;
            color: #38BDF8;
            font-family: Consolas, monospace;
        }}
        ul {{ color: #CBD5E1; padding-left: 20px; font-size: 14px; }}
        @media print {{
            body {{ background-color: white; color: black; padding: 0; }}
            .container {{ box-shadow: none; border: none; padding: 0; background: white; color: black; }}
            .summary-card, .meta-grid, .explanation-box {{ background-color: #f8f9fa; border-color: #dee2e6; color: black; }}
            code {{ background-color: #e9ecef; color: black; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>CPU Energy Efficiency Analyzer — Evaluation Report</h1>
        <div class="meta-grid">
            <div class="meta-item"><strong>Benchmark:</strong> {b_name}</div>
            <div class="meta-item"><strong>Session ID:</strong> {session_id}</div>
            <div class="meta-item"><strong>Timestamp:</strong> {timestamp}</div>
            <div class="meta-item"><strong>Host OS:</strong> {os_info}</div>
            <div class="meta-item"><strong>CPU Model:</strong> {cpu_model}</div>
            <div class="meta-item"><strong>Core Topo:</strong> {cores_info}</div>
        </div>

        <h2>Measured Implementations</h2>
        {summaries_html}

        {comparison_html}
    </div>
</body>
</html>
"""

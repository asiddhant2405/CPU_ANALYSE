"""
Integration tests for FastAPI endpoints and end-to-end benchmark execution.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_api_capabilities():
    res = client.get("/api/system/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert "cpu_model" in data
    assert "logical_cores" in data
    assert "supported_languages" in data
    assert "python" in data["supported_languages"]


def test_api_samples():
    res = client.get("/api/samples")
    assert res.status_code == 200
    samples = res.json()
    assert len(samples) >= 1
    assert samples[0]["task_id"] == "integer_sum_gauss"


def test_e2e_python_benchmark_execution():
    """Test running a real Python benchmark for the Gauss demonstration."""
    payload = {
        "benchmark_name": "E2E Test: Sum 0 to 999999",
        "task_id": "integer_sum_gauss",
        "implementations": [
            {
                "name": "Iterative Loop",
                "language": "python",
                "source_code": (
                    "total = 0\n"
                    "for i in range(1000000):\n"
                    "    total += i\n"
                    "print(total)\n"
                ),
            },
            {
                "name": "Gauss Formula",
                "language": "python",
                "source_code": (
                    "n = 999999\n"
                    "print(n * (n + 1) // 2)\n"
                ),
            },
        ],
        "warmup_runs": 1,
        "measurement_runs": 3,
        "timeout_seconds": 10.0,
        "verify_output_equivalence": True,
        "expected_output": "499999500000",
        "enable_modeled_estimate": True,
    }

    res = client.post("/api/benchmarks", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert "Iterative Loop" in data["summaries"]
    assert "Gauss Formula" in data["summaries"]

    # Verify output equivalence
    assert data["comparison"]["verified_equivalent"] is True
    # Output must be 499999500000
    assert data["summaries"]["Iterative Loop"]["output_sample"].strip() == "499999500000"
    assert data["summaries"]["Gauss Formula"]["output_sample"].strip() == "499999500000"

    # Implementation comparison
    assert data["comparison"]["faster_implementation"] in {"Gauss Formula", "Iterative Loop", "Identical execution time"}
    assert data["comparison"]["summary_verdict"] is not None

    session_id = data["id"]

    # Check history
    hist_res = client.get("/api/history")
    assert hist_res.status_code == 200
    hist_list = hist_res.json()
    assert any(h["id"] == session_id for h in hist_list)

    # Check export endpoints
    csv_res = client.get(f"/api/history/{session_id}/export?format=csv")
    assert csv_res.status_code == 200
    assert "Iterative Loop" in csv_res.text

    html_res = client.get(f"/api/history/{session_id}/export?format=html")
    assert html_res.status_code == 200
    assert "Evaluation Report" in html_res.text

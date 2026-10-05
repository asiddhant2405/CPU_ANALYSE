"""
Unit tests for measurement providers and energy models.
"""

from app.measurement.process_metrics import ProcessMetricsProvider
from app.measurement.hardware_rapl import HardwareRaplProvider
from app.measurement.modeled_estimate import ModeledEnergyEstimator
import time


def test_process_metrics_provider_timing():
    provider = ProcessMetricsProvider()
    provider.start_measurement()
    time.sleep(0.01)  # 10ms
    res = provider.stop_measurement()
    assert res["execution_time_ms"] >= 8.0
    assert res["execution_time_ns"] > 0
    assert "peak_rss_mb" in res


def test_rapl_wraparound_calculation(monkeypatch):
    """Test that counter wraparound handles overflow correctly."""
    provider = HardwareRaplProvider(domain_path="/fake/rapl/domain")
    provider._max_range_uj = 1000000
    provider._start_energy_uj = 900000

    # Mock is_available and _read_energy
    monkeypatch.setattr(provider, "is_available", lambda: True)
    monkeypatch.setattr(provider, "_read_energy", lambda: 50000)  # Wrapped around

    res = provider.stop_measurement()
    assert res["available"] is True
    # Delta should be (1000000 - 900000) + 50000 = 150000 uJ = 0.15 J
    assert res["hardware_energy_uj"] == 150000
    assert res["hardware_energy_j"] == 0.15


def test_modeled_energy_estimator_formula():
    # 1000ms (1.0s), 100% CPU on 28W TDP -> Power = 5 + (28 - 5)*1.0 = 28W -> Energy = 28W * 1.0s = 28.0 J
    e = ModeledEnergyEstimator.calculate_energy(
        execution_time_ms=1000.0,
        process_cpu_percent=100.0,
        tdp_watts=28.0,
        idle_watts=5.0,
    )
    assert abs(e - 28.0) < 0.001

    # Zero runtime should produce 0.0 J
    assert ModeledEnergyEstimator.calculate_energy(0.0, 100.0) == 0.0

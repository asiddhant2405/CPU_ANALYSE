"""
Measurement Manager coordinating hardware counters, process monitors, and models.
"""

from typing import Dict, Any, Optional
from app.measurement.process_metrics import ProcessMetricsProvider
from app.measurement.hardware_rapl import HardwareRaplProvider
from app.measurement.modeled_estimate import ModeledEnergyEstimator


class MeasurementManager:
    """Orchestrates all active measurement providers for a benchmark execution."""

    def __init__(self, enable_modeled_estimate: bool = False, tdp_watts: float = 28.0):
        self.process_provider = ProcessMetricsProvider()
        self.rapl_provider = HardwareRaplProvider()
        self.enable_modeled_estimate = enable_modeled_estimate
        self.tdp_watts = tdp_watts

    def start_measurement(self) -> None:
        """Call immediately before process execution."""
        self.process_provider.start_measurement()
        if self.rapl_provider.is_available():
            self.rapl_provider.start_measurement()

    def record_process_sample(self, proc) -> None:
        """Periodic sampling during active run."""
        self.process_provider.record_process_sample(proc)

    def stop_measurement(self, pid: Optional[int] = None) -> Dict[str, Any]:
        """Call immediately after process termination."""
        proc_data = self.process_provider.stop_measurement(pid)
        rapl_data = self.rapl_provider.stop_measurement(pid) if self.rapl_provider.is_available() else {"available": False}

        # Energy labeling determination
        hardware_energy_uj = None
        hardware_energy_j = None
        modeled_energy_j = None
        energy_source_label = "unavailable"

        if rapl_data.get("available") and rapl_data.get("hardware_energy_j") is not None:
            hardware_energy_uj = rapl_data["hardware_energy_uj"]
            hardware_energy_j = rapl_data["hardware_energy_j"]
            energy_source_label = "hardware_counter"
        elif self.enable_modeled_estimate:
            modeled_energy_j = ModeledEnergyEstimator.calculate_energy(
                execution_time_ms=proc_data["execution_time_ms"],
                process_cpu_percent=proc_data["process_cpu_percent"],
                tdp_watts=self.tdp_watts,
            )
            energy_source_label = "modeled_estimate"
        else:
            energy_source_label = "unavailable"

        return {
            **proc_data,
            "hardware_energy_uj": hardware_energy_uj,
            "hardware_energy_j": hardware_energy_j,
            "modeled_energy_j": modeled_energy_j,
            "energy_source_label": energy_source_label,
            "rapl_domain": rapl_data.get("domain"),
        }

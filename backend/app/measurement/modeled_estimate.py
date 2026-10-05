"""
Educational modeled energy estimation provider.
Provides a transparent, documented, physics-grounded power model for platforms
lacking native hardware energy counters (e.g. Windows).
"""

from typing import Dict, Any


class ModeledEnergyEstimator:
    """
    Computes an educational energy estimate based on CPU TDP envelope,
    active utilization, and measured wall-clock execution time.
    
    Model:
      E_estimate = [ P_idle + (P_tdp - P_idle) * (CPU_percent / 100) ] * (time_ms / 1000)
    
    This is an explicit educational estimation model. It must NEVER be confused
    with or substituted for genuine hardware-metered telemetry.
    """

    DEFAULT_TDP_WATTS: float = 28.0  # Default for Intel Core i5-1135G7 (12W-28W TDP range)
    DEFAULT_IDLE_WATTS: float = 5.0

    @classmethod
    def calculate_energy(
        cls,
        execution_time_ms: float,
        process_cpu_percent: float,
        tdp_watts: float = DEFAULT_TDP_WATTS,
        idle_watts: float = DEFAULT_IDLE_WATTS,
    ) -> float:
        """Calculate estimated energy in Joules."""
        if execution_time_ms <= 0:
            return 0.0

        # Bound utilization to [0.0, 1.0] of single-core equivalent
        util_factor = min(1.0, max(0.0, process_cpu_percent / 100.0))
        estimated_power_watts = idle_watts + (tdp_watts - idle_watts) * util_factor
        duration_seconds = execution_time_ms / 1000.0
        energy_joules = estimated_power_watts * duration_seconds
        return round(energy_joules, 6)

    @classmethod
    def get_model_documentation(cls, tdp_watts: float = DEFAULT_TDP_WATTS) -> Dict[str, Any]:
        return {
            "model_name": "Educational TDP Activity-Scaling Model",
            "equation": "E (Joules) = [ P_idle + (P_tdp - P_idle) * (CPU% / 100) ] * (Time_ms / 1000)",
            "parameters": {
                "P_tdp": f"{tdp_watts} Watts (Thermal Design Power envelope)",
                "P_idle": f"{cls.DEFAULT_IDLE_WATTS} Watts (Estimated baseline socket idle power)",
            },
            "calibration_status": "Uncalibrated theoretical model",
            "assumptions": [
                "Assumes power scales linearly with CPU activity between idle and rated TDP.",
                "Assumes clock frequency operates near base frequency without dynamic turbo boost or thermal throttling.",
                "Does not account for instruction-specific energy variations (e.g. AVX/SIMD vs integer ALU)."
            ],
            "intended_use": (
                "Educational demonstration to illustrate the mathematical relationship between "
                "power, execution time, and energy: Energy = Power x Time."
            )
        }

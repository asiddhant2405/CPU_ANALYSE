"""
Hardware energy measurement provider for Linux RAPL (Running Average Power Limit).
Reads energy counters from /sys/class/powercap sysfs hierarchy.
"""

import os
from typing import Dict, Any, Optional
from app.measurement.base import MeasurementProvider


class HardwareRaplProvider(MeasurementProvider):
    """
    Reads hardware-reported energy via Linux powercap RAPL interface.
    Handles counter wraparound and records package/core domains.
    """

    def __init__(self, domain_path: str = "/sys/class/powercap/intel-rapl/intel-rapl:0"):
        self.domain_path = domain_path
        self.energy_file = os.path.join(domain_path, "energy_uj")
        self.max_range_file = os.path.join(domain_path, "max_energy_range_uj")
        self.name_file = os.path.join(domain_path, "name")
        self._start_energy_uj: Optional[int] = None
        self._max_range_uj: Optional[int] = None
        self._domain_name: str = "package-0"

    def name(self) -> str:
        return "linux_hardware_rapl"

    def is_available(self) -> bool:
        if not os.path.exists(self.energy_file):
            return False
        try:
            with open(self.energy_file, "r") as f:
                int(f.read().strip())
            return True
        except (PermissionError, ValueError, OSError):
            return False

    def _read_energy(self) -> Optional[int]:
        try:
            with open(self.energy_file, "r") as f:
                return int(f.read().strip())
        except Exception:
            return None

    def start_measurement(self) -> None:
        if not self.is_available():
            self._start_energy_uj = None
            return
        
        # Cache domain name and max range once
        if os.path.exists(self.name_file):
            try:
                with open(self.name_file, "r") as f:
                    self._domain_name = f.read().strip()
            except Exception:
                pass

        if os.path.exists(self.max_range_file):
            try:
                with open(self.max_range_file, "r") as f:
                    self._max_range_uj = int(f.read().strip())
            except Exception:
                pass

        self._start_energy_uj = self._read_energy()

    def stop_measurement(self, pid: Optional[int] = None) -> Dict[str, Any]:
        if self._start_energy_uj is None or not self.is_available():
            return {
                "available": False,
                "hardware_energy_uj": None,
                "hardware_energy_j": None,
                "error": "RAPL counter unavailable or permission denied."
            }

        end_energy_uj = self._read_energy()
        if end_energy_uj is None:
            return {
                "available": False,
                "hardware_energy_uj": None,
                "hardware_energy_j": None,
                "error": "Failed reading post-execution RAPL counter."
            }

        # Calculate delta with wraparound handling
        if end_energy_uj >= self._start_energy_uj:
            delta_uj = end_energy_uj - self._start_energy_uj
        else:
            if self._max_range_uj:
                delta_uj = (self._max_range_uj - self._start_energy_uj) + end_energy_uj
            else:
                # 32-bit counter wraparound fallback (approx 4.29 x 10^9 uJ)
                delta_uj = (4294967296 - self._start_energy_uj) + end_energy_uj

        delta_j = round(delta_uj / 1_000_000.0, 6)

        return {
            "available": True,
            "domain": self._domain_name,
            "hardware_energy_uj": delta_uj,
            "hardware_energy_j": delta_j,
        }

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "source": "Intel/AMD RAPL (Running Average Power Limit)",
            "unit": "Joules (J)",
            "domain": self._domain_name,
            "scope": "CPU Package level (Package-0)",
            "limitations": [
                "Measures total package energy, which includes uncore, memory controller, and background OS tasks.",
                "Not strictly isolated to the single target process.",
                "Measurement resolution depends on hardware sampling frequency (typically ~1ms)."
            ]
        }

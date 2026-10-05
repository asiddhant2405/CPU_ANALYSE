"""
Base classes for measurement providers.
Decouples execution orchestration from telemetry extraction.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class MeasurementProvider(ABC):
    """Abstract interface for system and hardware measurement providers."""

    @abstractmethod
    def name(self) -> str:
        """Provider identifier."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Whether this provider can read valid metrics in current environment."""
        pass

    @abstractmethod
    def start_measurement(self) -> None:
        """Hook called immediately before starting process execution."""
        pass

    @abstractmethod
    def stop_measurement(self, pid: Optional[int] = None) -> Dict[str, Any]:
        """Hook called immediately after process termination."""
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Provide provenance, scope, unit, and limitations metadata."""
        pass

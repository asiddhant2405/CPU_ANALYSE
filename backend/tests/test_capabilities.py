"""
Tests for system capabilities and hardware detection.
"""

from app.core.system_capabilities import detect_system_capabilities, get_cpu_model_name


def test_system_capabilities_structure():
    caps = detect_system_capabilities()
    assert caps.os_name in {"Windows", "Linux", "Darwin"}
    assert caps.physical_cores >= 1
    assert caps.logical_cores >= caps.physical_cores
    assert caps.total_memory_gb > 0
    assert "python" in caps.supported_languages
    assert caps.energy_backend is not None
    # Verify that energy backend gives a clear non-empty explanation
    assert len(caps.energy_backend.explanation) > 10


def test_cpu_model_not_empty():
    cpu = get_cpu_model_name()
    assert cpu is not None
    assert len(cpu) > 0

"""
System capabilities and hardware environment detection.
Gathers genuine hardware specifications, compiler versions, and telemetry capabilities.
"""

import os
import sys
import platform
import subprocess
import shutil
import psutil
from typing import Optional, Tuple
from app.models.schemas import SystemCapabilities, EnergyBackendStatus


def get_cpu_model_name() -> str:
    """Detect actual CPU brand/model name across operating systems."""
    try:
        if platform.system() == "Windows":
            # Try WMI via powershell or registry
            res = subprocess.run(
                ["powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_Processor).Name"],
                capture_output=True,
                text=True,
                timeout=3,
            )
            if res.returncode == 0 and res.stdout.strip():
                return res.stdout.strip().split("\n")[0].strip()
        elif platform.system() == "Linux":
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "model name" in line:
                        return line.split(":")[1].strip()
        elif platform.system() == "Darwin":
            res = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True, timeout=3)
            if res.returncode == 0 and res.stdout.strip():
                return res.stdout.strip()
    except Exception:
        pass
    return platform.processor() or "Unknown CPU"


def get_compiler_info(binary_name: str) -> Tuple[bool, Optional[str]]:
    """Detect if a compiler is available and retrieve its version."""
    bin_path = shutil.which(binary_name)
    if not bin_path:
        return False, None
    try:
        res = subprocess.run([bin_path, "--version"], capture_output=True, text=True, timeout=3)
        if res.returncode == 0:
            first_line = res.stdout.strip().split("\n")[0]
            return True, first_line
    except Exception:
        pass
    return False, None


def check_docker_available() -> bool:
    """Check if docker CLI is installed and responsive."""
    docker_bin = shutil.which("docker")
    if not docker_bin:
        return False
    try:
        res = subprocess.run([docker_bin, "--version"], capture_output=True, text=True, timeout=3)
        return res.returncode == 0
    except Exception:
        return False


def detect_energy_backend() -> EnergyBackendStatus:
    """
    Detect genuine hardware energy measurement backends.
    On Linux: inspect /sys/class/powercap/intel-rapl or amd-rapl.
    On Windows / macOS: report honestly that user-space RAPL is not exposed by the OS.
    """
    # Check Linux RAPL
    rapl_base = "/sys/class/powercap/intel-rapl"
    if os.path.exists(rapl_base):
        # Inspect domains
        try:
            domains = []
            for item in os.listdir(rapl_base):
                if item.startswith("intel-rapl:"):
                    name_file = os.path.join(rapl_base, item, "name")
                    if os.path.exists(name_file):
                        with open(name_file, "r") as f:
                            domains.append(f.read().strip())
            
            # Check read permission on package energy
            pkg_energy = os.path.join(rapl_base, "intel-rapl:0", "energy_uj")
            if os.path.exists(pkg_energy):
                try:
                    with open(pkg_energy, "r") as f:
                        val = int(f.read().strip())
                    return EnergyBackendStatus(
                        available=True,
                        backend_type="linux_rapl",
                        domain_name=", ".join(domains) if domains else "package-0",
                        unit="microjoules (uJ)",
                        explanation="Linux RAPL (Running Average Power Limit) energy counters readable via powercap sysfs interface.",
                        remedy=None
                    )
                except PermissionError:
                    return EnergyBackendStatus(
                        available=False,
                        backend_type="linux_rapl_permission_denied",
                        domain_name="package-0",
                        unit="microjoules (uJ)",
                        explanation="Linux RAPL powercap interface found, but requires read permissions (chmod 444 or sudo).",
                        remedy="Run 'sudo chmod -R a+r /sys/class/powercap/intel-rapl' to grant read access to energy counters."
                    )
        except Exception as e:
            return EnergyBackendStatus(
                available=False,
                backend_type="linux_rapl_error",
                explanation=f"Error inspecting Linux RAPL: {str(e)}",
                remedy=None
            )

    # Windows host
    if platform.system() == "Windows":
        return EnergyBackendStatus(
            available=False,
            backend_type="windows_none",
            domain_name=None,
            unit="None",
            explanation=(
                "Hardware energy counters (Intel RAPL / MSRs) are not exposed to unprivileged "
                "user applications on Windows. Reading Intel MSR_PKG_ENERGY_STATUS requires a signed "
                "ring-0 kernel driver (such as Intel PCM or WinRing0). Process-level execution time, "
                "CPU utilization, and memory usage are fully measured."
            ),
            remedy=(
                "For direct hardware energy counter readings, run on native Linux or dual-boot with "
                "read access to /sys/class/powercap/intel-rapl. You can also enable our transparent "
                "educational TDP-based energy model in benchmark settings."
            )
        )

    # macOS host
    if platform.system() == "Darwin":
        return EnergyBackendStatus(
            available=False,
            backend_type="macos_none",
            domain_name=None,
            unit="None",
            explanation="Hardware energy counters require Apple Silicon powermetrics with root (sudo) privileges.",
            remedy="Run with elevated permissions or on a supported Linux machine with RAPL access."
        )

    return EnergyBackendStatus(
        available=False,
        backend_type="unsupported_os",
        explanation=f"No supported hardware energy counter interface found on {platform.system()}.",
        remedy=None
    )


def detect_system_capabilities() -> SystemCapabilities:
    """Gather complete system specifications and capabilities."""
    vm = psutil.virtual_memory()
    freq = psutil.cpu_freq()
    
    gcc_ok, gcc_ver = get_compiler_info("gcc")
    gpp_ok, gpp_ver = get_compiler_info("g++")
    docker_ok = check_docker_available()
    energy_status = detect_energy_backend()

    supported_langs = ["python"]
    if gcc_ok:
        supported_langs.append("c")
    if gpp_ok:
        supported_langs.append("cpp")

    return SystemCapabilities(
        os_name=platform.system(),
        os_version=f"{platform.release()} ({platform.version()})",
        architecture=platform.machine(),
        cpu_model=get_cpu_model_name(),
        physical_cores=psutil.cpu_count(logical=False) or 1,
        logical_cores=psutil.cpu_count(logical=True) or 1,
        max_freq_mhz=freq.max if freq else None,
        current_freq_mhz=freq.current if freq else None,
        total_memory_gb=round(vm.total / (1024**3), 2),
        available_memory_gb=round(vm.available / (1024**3), 2),
        python_version=platform.python_version(),
        gcc_available=gcc_ok,
        gcc_version=gcc_ver,
        gpp_available=gpp_ok,
        gpp_version=gpp_ver,
        docker_available=docker_ok,
        energy_backend=energy_status,
        supported_languages=supported_langs,
        isolation_mode="restricted_local_subprocess" if not docker_ok else "docker_container",
        safety_warning=(
            "Subprocess execution runs locally on the host with timeouts and argument array isolation. "
            "Container isolation is not active; execute only trusted code."
            if not docker_ok
            else "Docker container isolation active."
        )
    )

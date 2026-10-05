"""
Unit tests for C/C++ compiler and execution runner.
"""

from app.core.security import SecureExecutionDirectory
from app.execution.compiler import compile_source
from app.execution.runner import run_benchmark_trial
from app.core.system_capabilities import detect_system_capabilities


def test_gcc_compilation_and_execution():
    caps = detect_system_capabilities()
    if not caps.gcc_available:
        return  # Skip if GCC is not installed on this system

    c_code = """#include <stdio.h>
int main() {
    long long n = 999999LL;
    long long sum = n * (n + 1) / 2;
    printf("%lld\\n", sum);
    return 0;
}
"""
    with SecureExecutionDirectory() as workspace:
        comp_res = compile_source(
            language="c",
            source_code=c_code,
            workspace_dir=workspace,
            implementation_name="CTest",
            custom_flags=["-O2", "-std=c11"],
        )
        assert comp_res.success is True
        assert comp_res.binary_path is not None
        assert comp_res.compilation_time_ms > 0

        # Now run a trial
        trial_res = run_benchmark_trial(
            language="c",
            executable_or_script=comp_res.binary_path,
            workspace_dir=workspace,
            run_index=1,
            is_warmup=False,
            timeout_seconds=5.0,
        )
        assert trial_res.success is True
        assert trial_res.stdout.strip() == "499999500000"
        assert trial_res.execution_time_ms > 0


def test_compiler_failure_handling():
    caps = detect_system_capabilities()
    if not caps.gcc_available:
        return

    invalid_code = "int main() { syntax error here }"
    with SecureExecutionDirectory() as workspace:
        comp_res = compile_source(
            language="c",
            source_code=invalid_code,
            workspace_dir=workspace,
            implementation_name="InvalidCTest",
        )
        assert comp_res.success is False
        assert comp_res.binary_path is None
        assert "error" in comp_res.compiler_output.lower()


def test_runner_timeout_handling():
    infinite_loop_py = "import time\nwhile True: time.sleep(0.1)\n"
    with SecureExecutionDirectory() as workspace:
        script_path = f"{workspace}/infinite.py"
        with open(script_path, "w") as f:
            f.write(infinite_loop_py)

        res = run_benchmark_trial(
            language="python",
            executable_or_script=script_path,
            workspace_dir=workspace,
            run_index=1,
            is_warmup=False,
            timeout_seconds=0.8,
        )
        assert res.success is False
        assert res.timed_out is True
        assert "timed out" in res.stderr.lower()

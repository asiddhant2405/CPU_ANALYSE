"""
Unit tests for static heuristic code analysis.
"""

from app.analysis.static_analyzer import analyze_source_code


def test_analyze_python_loop():
    py_code = """
total = 0
for i in range(100):
    total += i
print(total)
"""
    report = analyze_source_code(py_code, "python", "PyLoop")
    assert report.algorithmic_complexity == "O(N)"
    assert any(f.construct_type == "loop" for f in report.findings)


def test_analyze_python_formula():
    py_code = """
n = 100
print(n * (n + 1) // 2)
"""
    report = analyze_source_code(py_code, "python", "PyFormula")
    assert report.algorithmic_complexity == "O(1)"
    assert not any(f.construct_type == "loop" for f in report.findings)


def test_analyze_c_loop():
    c_code = """
#include <stdio.h>
int main() {
    long long s = 0;
    for (int i = 0; i < 100; i++) {
        s += i;
    }
    printf("%lld\\n", s);
    return 0;
}
"""
    report = analyze_source_code(c_code, "c", "CLoop")
    assert report.algorithmic_complexity == "O(N)"
    assert any(f.construct_type == "loop" for f in report.findings)

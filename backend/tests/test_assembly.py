import pytest
from app.execution.assembly import disassemble_source

def test_disassemble_c_source():
    c_code = """
    #include <stdio.h>
    int main(void) {
        long long sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += i;
        }
        printf("%lld\\n", sum);
        return 0;
    }
    """
    res = disassemble_source("c", c_code, ["-O2", "-std=c11"])
    assert res.success is True
    assert res.instruction_count > 0
    assert "alu" in res.category_counts
    assert len(res.instructions) > 0
    assert len(res.coa_insight) > 0

def test_disassemble_python_source():
    py_code = """
    total = 0
    for i in range(10):
        total += i
    print(total)
    """
    res = disassemble_source("python", py_code)
    assert res.success is True
    assert res.instruction_count > 0
    assert res.category_counts["alu"] > 0
    assert len(res.instructions) > 0

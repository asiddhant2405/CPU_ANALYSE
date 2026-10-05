"""
Educational static analysis module.
Inspects source code constructs (loops, branches, arithmetic formulas)
and estimates algorithmic complexity with explicit heuristic caveats.
"""

import ast
import re
from typing import List
from app.models.schemas import StaticAnalysisFinding, StaticAnalysisReport


def analyze_python_source(source_code: str, implementation_name: str) -> StaticAnalysisReport:
    """Analyze Python source using Python's official AST parser."""
    findings: List[StaticAnalysisFinding] = []
    has_loop = False
    has_nested_loop = False
    loop_count = 0
    branch_count = 0
    call_count = 0

    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        return StaticAnalysisReport(
            language="python",
            implementation_name=implementation_name,
            findings=[],
            algorithmic_complexity="Syntax Error",
            explanation=f"Could not parse Python source: {str(e)}",
        )

    class AnalyzerVisitor(ast.NodeVisitor):
        def __init__(self):
            self.loop_depth = 0
            self.max_loop_depth = 0
            self.loop_lines = []
            self.branch_lines = []
            self.call_lines = []

        def visit_For(self, node):
            nonlocal has_loop, loop_count
            has_loop = True
            loop_count += 1
            self.loop_lines.append(node.lineno)
            self.loop_depth += 1
            if self.loop_depth > self.max_loop_depth:
                self.max_loop_depth = self.loop_depth
            self.generic_visit(node)
            self.loop_depth -= 1

        def visit_While(self, node):
            nonlocal has_loop, loop_count
            has_loop = True
            loop_count += 1
            self.loop_lines.append(node.lineno)
            self.loop_depth += 1
            if self.loop_depth > self.max_loop_depth:
                self.max_loop_depth = self.loop_depth
            self.generic_visit(node)
            self.loop_depth -= 1

        def visit_If(self, node):
            nonlocal branch_count
            branch_count += 1
            self.branch_lines.append(node.lineno)
            self.generic_visit(node)

        def visit_Call(self, node):
            nonlocal call_count
            call_count += 1
            self.call_lines.append(getattr(node, 'lineno', 1))
            self.generic_visit(node)

    visitor = AnalyzerVisitor()
    visitor.visit(tree)

    if loop_count > 0:
        findings.append(
            StaticAnalysisFinding(
                construct_type="loop",
                count=loop_count,
                details=f"Detected {loop_count} iterative loop construct(s).",
                estimated_complexity="O(N)" if visitor.max_loop_depth == 1 else f"O(N^{visitor.max_loop_depth})",
                lines=visitor.loop_lines,
            )
        )
    if visitor.max_loop_depth > 1:
        findings.append(
            StaticAnalysisFinding(
                construct_type="nested_loop",
                count=visitor.max_loop_depth,
                details=f"Nested loop depth of {visitor.max_loop_depth} detected.",
                estimated_complexity=f"O(N^{visitor.max_loop_depth})",
                lines=visitor.loop_lines,
            )
        )
    if branch_count > 0:
        findings.append(
            StaticAnalysisFinding(
                construct_type="branch",
                count=branch_count,
                details=f"Detected {branch_count} conditional branch construct(s).",
                estimated_complexity="Independent",
                lines=visitor.branch_lines,
            )
        )

    if loop_count == 0:
        complexity = "O(1)"
        explanation = (
            "Closed-form or constant-time implementation. "
            "Executes a fixed number of operations regardless of input size N."
        )
    elif visitor.max_loop_depth == 1:
        complexity = "O(N)"
        explanation = (
            "Linear time iterative implementation. "
            "Instruction count grows proportionally with input size N."
        )
    else:
        complexity = f"O(N^{visitor.max_loop_depth})"
        explanation = (
            f"Polynomial time implementation with nested loop depth {visitor.max_loop_depth}. "
            "Instruction count grows polynomially with input size N."
        )

    return StaticAnalysisReport(
        language="python",
        implementation_name=implementation_name,
        findings=findings,
        algorithmic_complexity=complexity,
        explanation=explanation,
    )


def analyze_c_cpp_source(source_code: str, implementation_name: str, language: str = "c") -> StaticAnalysisReport:
    """Analyze C/C++ source using structured heuristic pattern recognition."""
    findings: List[StaticAnalysisFinding] = []
    
    # Strip comments
    clean_code = re.sub(r"//.*", "", source_code)
    clean_code = re.sub(r"/\*.*?\*/", "", clean_code, flags=re.DOTALL)

    for_matches = list(re.finditer(r"\bfor\s*\(", clean_code))
    while_matches = list(re.finditer(r"\bwhile\s*\(", clean_code))
    if_matches = list(re.finditer(r"\bif\s*\(", clean_code))
    
    loop_count = len(for_matches) + len(while_matches)
    branch_count = len(if_matches)

    if loop_count > 0:
        findings.append(
            StaticAnalysisFinding(
                construct_type="loop",
                count=loop_count,
                details=f"Detected {loop_count} loop statement(s) (for/while).",
                estimated_complexity="O(N)",
                lines=[],
            )
        )
    if branch_count > 0:
        findings.append(
            StaticAnalysisFinding(
                construct_type="branch",
                count=branch_count,
                details=f"Detected {branch_count} conditional branch statement(s).",
                estimated_complexity="Independent",
                lines=[],
            )
        )

    if loop_count == 0:
        complexity = "O(1)"
        explanation = (
            "Closed-form arithmetic expression or sequential statements without loops. "
            "Algorithmic complexity is constant time O(1)."
        )
    else:
        complexity = "O(N)"
        explanation = (
            f"Iterative loop structure detected ({loop_count} loop(s)). "
            "Instruction count at the source level scales linearly with problem size N."
        )

    return StaticAnalysisReport(
        language=language,
        implementation_name=implementation_name,
        findings=findings,
        algorithmic_complexity=complexity,
        explanation=explanation,
    )


def analyze_source_code(source_code: str, language: str, implementation_name: str = "Implementation") -> StaticAnalysisReport:
    """Entrypoint to run static heuristic analysis for supported languages."""
    if language.lower() == "python":
        return analyze_python_source(source_code, implementation_name)
    else:
        return analyze_c_cpp_source(source_code, implementation_name, language.lower())

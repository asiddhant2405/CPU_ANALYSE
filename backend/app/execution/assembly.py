"""
Assembly inspection and disassembly service for C, C++, and Python.
Provides instruction classification, static instruction counts, and COA architectural insights.
"""

import subprocess
import re
import dis
from typing import List, Dict, Optional, Tuple
from app.models.schemas import AssemblyInstruction, AssemblyAnalysisResponse
from app.core.security import sanitize_compiler_flags
from app.core.system_capabilities import detect_system_capabilities

# Instruction categorizations for x86 / x86-64 assembly
ALU_OPCODES = {
    "add", "addl", "addq", "sub", "subl", "subq", "imul", "imull", "imulq",
    "idiv", "idivl", "idivq", "mul", "mull", "mulq", "div", "divl", "divq",
    "xor", "xorl", "xorq", "and", "andl", "andq", "or", "orl", "orq",
    "not", "notl", "notq", "neg", "negl", "negq", "inc", "incl", "incq",
    "dec", "decl", "decq", "lea", "leal", "leaq", "sal", "sall", "salq",
    "sar", "sarl", "sarq", "shl", "shll", "shlq", "shr", "shrl", "shrq",
    "adc", "adcl", "sbb", "sbbl", "rol", "ror"
}

DATA_TRANSFER_OPCODES = {
    "mov", "movl", "movq", "movb", "movw", "push", "pushl", "pushq",
    "pop", "popl", "popq", "movzwl", "movsbl", "movzbq", "movsbq", "movsd",
    "movss", "xchg", "cltd", "cdq", "cqo"
}

CONTROL_TRANSFER_OPCODES = {
    "jmp", "je", "jne", "jg", "jge", "jl", "jle", "ja", "jae", "jb", "jbe",
    "jz", "jnz", "js", "jns", "call", "ret", "leave"
}

COMPARISON_OPCODES = {
    "cmp", "cmpl", "cmpq", "cmpb", "cmpw", "test", "testl", "testq", "testb"
}


def _classify_x86_mnemonic(mnemonic: str) -> str:
    m = mnemonic.lower()
    if m in ALU_OPCODES:
        return "alu"
    if m in DATA_TRANSFER_OPCODES:
        return "data_transfer"
    if m in CONTROL_TRANSFER_OPCODES:
        return "control_transfer"
    if m in COMPARISON_OPCODES:
        return "comparison"
    return "other"


def _disassemble_c_cpp(
    language: str,
    source_code: str,
    compiler_flags: Optional[List[str]] = None,
) -> AssemblyAnalysisResponse:
    caps = detect_system_capabilities()
    is_cpp = language == "cpp"
    compiler_bin = "g++" if is_cpp else "gcc"
    compiler_available = caps.gpp_available if is_cpp else caps.gcc_available

    if not compiler_available:
        return AssemblyAnalysisResponse(
            language=language,
            compiler=compiler_bin,
            flags=compiler_flags or [],
            success=False,
            total_lines=0,
            instruction_count=0,
            category_counts={},
            instructions=[],
            explanation="Compiler binary not found in environment PATH.",
            coa_insight="Cannot generate assembly without a native C/C++ compiler.",
            error=f"{compiler_bin} is not available on this system.",
        )

    flags = custom_flags if (custom_flags := compiler_flags) else ["-O2", "-std=c11" if not is_cpp else "-std=c++14"]
    sanitized = sanitize_compiler_flags(flags)
    cmd = [compiler_bin, "-S", "-fverbose-asm"] + sanitized + ["-x", "c++" if is_cpp else "c", "-", "-o", "-"]

    try:
        proc = subprocess.run(
            cmd,
            input=source_code,
            text=True,
            capture_output=True,
            timeout=10.0,
            shell=False,
        )
    except Exception as e:
        return AssemblyAnalysisResponse(
            language=language,
            compiler=compiler_bin,
            flags=sanitized,
            success=False,
            total_lines=0,
            instruction_count=0,
            category_counts={},
            instructions=[],
            explanation="Failed to execute compiler process.",
            coa_insight="",
            error=str(e),
        )

    if proc.returncode != 0:
        return AssemblyAnalysisResponse(
            language=language,
            compiler=compiler_bin,
            flags=sanitized,
            success=False,
            total_lines=0,
            instruction_count=0,
            category_counts={},
            instructions=[],
            explanation="Compilation error occurred during assembly generation.",
            coa_insight="",
            error=proc.stderr.strip() or "Compilation failed.",
        )

    raw_asm = proc.stdout
    lines = raw_asm.splitlines()

    instructions: List[AssemblyInstruction] = []
    category_counts: Dict[str, int] = {
        "alu": 0,
        "data_transfer": 0,
        "control_transfer": 0,
        "comparison": 0,
        "other": 0,
    }

    line_idx = 1
    for raw_line in lines:
        stripped = raw_line.strip()
        if not stripped:
            continue

        # Parse inline comment
        comment = None
        code_part = stripped
        if "#" in stripped:
            parts = stripped.split("#", 1)
            code_part = parts[0].strip()
            comment = parts[1].strip()

        if not code_part:
            # Comment-only line; retain as directive/comment annotation
            instructions.append(
                AssemblyInstruction(
                    line_number=line_idx,
                    raw_text=stripped,
                    category="directive",
                    comment=comment,
                )
            )
            line_idx += 1
            continue

        # Check for label
        if code_part.endswith(":"):
            instructions.append(
                AssemblyInstruction(
                    line_number=line_idx,
                    raw_text=stripped,
                    opcode=code_part,
                    category="label",
                    comment=comment,
                )
            )
            line_idx += 1
            continue

        # Check for assembler directives starting with '.'
        if code_part.startswith("."):
            instructions.append(
                AssemblyInstruction(
                    line_number=line_idx,
                    raw_text=stripped,
                    opcode=code_part.split()[0] if code_part.split() else code_part,
                    category="directive",
                    comment=comment,
                )
            )
            line_idx += 1
            continue

        # Instruction line: split opcode and operands
        tokens = code_part.split(None, 1)
        mnemonic = tokens[0]
        operands = tokens[1] if len(tokens) > 1 else ""

        category = _classify_x86_mnemonic(mnemonic)
        category_counts[category] = category_counts.get(category, 0) + 1

        instructions.append(
            AssemblyInstruction(
                line_number=line_idx,
                raw_text=stripped,
                opcode=mnemonic,
                operands=operands,
                category=category,
                comment=comment,
            )
        )
        line_idx += 1

    static_instr_count = sum(category_counts.values())

    # Build architectural explanation
    is_o0 = any("-O0" in f for f in sanitized)
    is_o2 = any("-O2" in f or "-O3" in f for f in sanitized)

    explanation = (
        f"Generated {static_instr_count} static machine instructions using {compiler_bin} with flags {' '.join(sanitized)}. "
        f"Instruction breakdown: {category_counts['alu']} ALU arithmetic/logic, "
        f"{category_counts['data_transfer']} memory/register data transfers, "
        f"{category_counts['control_transfer']} control transfers/branches, "
        f"{category_counts['comparison']} comparison flags."
    )

    if is_o2:
        coa_insight = (
            "Under -O2 optimization, the compiler aggressively applies register allocation, "
            "constant folding, and loop-invariant code motion. For algebraic loops (like Gauss summation), "
            "the compiler may completely eliminate the loop and replace it with a precomputed constant, "
            "reducing executed instruction count from O(N) to O(1) at runtime."
        )
    elif is_o0:
        coa_insight = (
            "Under -O0 (unoptimized), the compiler stores local variables in the stack frame (memory), "
            "generating redundant memory mov instructions and unrolled branch comparisons for every iteration. "
            "This highlights why static instruction count in unoptimized code is much higher, with lower CPI efficiency."
        )
    else:
        coa_insight = (
            "Static assembly instructions represent the binary layout, NOT the total instructions executed at runtime. "
            "A loop of 5 static instructions executed 1,000,000 times produces 5,000,000 dynamic instruction executions."
        )

    return AssemblyAnalysisResponse(
        language=language,
        compiler=compiler_bin,
        flags=sanitized,
        success=True,
        total_lines=len(instructions),
        instruction_count=static_instr_count,
        category_counts=category_counts,
        instructions=instructions,
        explanation=explanation,
        coa_insight=coa_insight,
    )


def _disassemble_python(source_code: str) -> AssemblyAnalysisResponse:
    """Disassemble Python source into CPython VM bytecode instructions."""
    import textwrap
    clean_code = textwrap.dedent(source_code).strip()
    try:
        compiled = compile(clean_code, "<benchmark>", "exec")
        bytecode = list(dis.get_instructions(compiled))
    except Exception as e:
        return AssemblyAnalysisResponse(
            language="python",
            compiler="CPython Bytecode Compiler",
            flags=[],
            success=False,
            total_lines=0,
            instruction_count=0,
            category_counts={},
            instructions=[],
            explanation="Failed to parse Python code into bytecode.",
            coa_insight="",
            error=str(e),
        )

    instructions: List[AssemblyInstruction] = []
    category_counts: Dict[str, int] = {
        "alu": 0,
        "data_transfer": 0,
        "control_transfer": 0,
        "comparison": 0,
        "other": 0,
    }

    for idx, instr in enumerate(bytecode, start=1):
        opname = instr.opname
        # Classify Python bytecode opcode
        if any(term in opname for term in ["BINARY", "INPLACE", "UNARY", "BUILD"]):
            cat = "alu"
        elif any(term in opname for term in ["LOAD", "STORE", "DELETE", "IMPORT"]):
            cat = "data_transfer"
        elif any(term in opname for term in ["JUMP", "FOR_ITER", "RETURN", "CALL"]):
            cat = "control_transfer"
        elif any(term in opname for term in ["COMPARE", "CONTAINS", "IS_OP"]):
            cat = "comparison"
        else:
            cat = "other"

        category_counts[cat] = category_counts.get(cat, 0) + 1
        arg_val = str(instr.argval) if instr.argval is not None else ""
        raw_text = f"{instr.offset:4d}  {opname:<20} {arg_val}"

        instructions.append(
            AssemblyInstruction(
                line_number=idx,
                raw_text=raw_text,
                opcode=opname,
                operands=arg_val,
                category=cat,
                comment=f"Source line {instr.starts_line}" if instr.starts_line else None,
            )
        )

    static_instr_count = len(bytecode)
    return AssemblyAnalysisResponse(
        language="python",
        compiler="CPython Bytecode VM",
        flags=["interpreted"],
        success=True,
        total_lines=len(instructions),
        instruction_count=static_instr_count,
        category_counts=category_counts,
        instructions=instructions,
        explanation=(
            f"Generated {static_instr_count} CPython virtual machine bytecode instructions. "
            f"Python does not execute native CPU instructions directly; each bytecode opcode is interpreted "
            f"by the CPython runtime's evaluation loop (ceval.c), adding interpreter dispatch overhead."
        ),
        coa_insight=(
            "In COA terms, an interpreted language adds a layer of software abstraction. While a C program compiles "
            "directly to bare-metal x86 instructions, each Python bytecode instruction requires dozens of native "
            "CPU instructions inside the Python interpreter loop to fetch, decode, and execute."
        ),
    )


def disassemble_source(
    language: str,
    source_code: str,
    compiler_flags: Optional[List[str]] = None,
) -> AssemblyAnalysisResponse:
    """Entry point for disassembling and analyzing code for C, C++, or Python."""
    lang = language.lower()
    if lang in ("c", "cpp"):
        return _disassemble_c_cpp(lang, source_code, compiler_flags)
    elif lang == "python":
        return _disassemble_python(source_code)
    else:
        return AssemblyAnalysisResponse(
            language=language,
            compiler="unknown",
            flags=[],
            success=False,
            total_lines=0,
            instruction_count=0,
            category_counts={},
            instructions=[],
            explanation=f"Unsupported language: {language}",
            coa_insight="",
            error=f"Unsupported language: {language}",
        )

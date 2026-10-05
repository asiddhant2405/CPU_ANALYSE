"""
Lightweight SQLite persistence for benchmark sessions and history.
"""

import sqlite3
import json
import os
from typing import List, Optional, Dict, Any
from app.models.schemas import BenchmarkSession

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "benchmarks.db")


def init_db(db_path: str = DB_FILE) -> None:
    """Initialize the SQLite schema."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS benchmark_sessions (
                id TEXT PRIMARY KEY,
                benchmark_name TEXT NOT NULL,
                status TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                session_data TEXT NOT NULL
            )
            """
        )
        conn.commit()


def save_session(session: BenchmarkSession, db_path: str = DB_FILE) -> None:
    """Persist or update a benchmark session."""
    init_db(db_path)
    session_json = session.model_dump_json()
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO benchmark_sessions (id, benchmark_name, status, timestamp, created_at, completed_at, session_data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status=excluded.status,
                completed_at=excluded.completed_at,
                session_data=excluded.session_data
            """,
            (
                session.id,
                session.config.benchmark_name,
                session.status,
                session.timestamp,
                session.created_at,
                session.completed_at,
                session_json,
            ),
        )
        conn.commit()


def get_session(session_id: str, db_path: str = DB_FILE) -> Optional[BenchmarkSession]:
    """Retrieve a benchmark session by ID."""
    init_db(db_path)
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT session_data FROM benchmark_sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return BenchmarkSession.model_validate_json(row[0])


def list_sessions(limit: int = 50, db_path: str = DB_FILE) -> List[Dict[str, Any]]:
    """List recent benchmark sessions with summary metadata."""
    init_db(db_path)
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, benchmark_name, status, timestamp, created_at, completed_at, session_data
            FROM benchmark_sessions
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        results = []
        for r in rows:
            data = json.loads(r[6])
            summaries = data.get("summaries", {})
            comparison = data.get("comparison", {})
            results.append({
                "id": r[0],
                "benchmark_name": r[1],
                "status": r[2],
                "timestamp": r[3],
                "created_at": r[4],
                "completed_at": r[5],
                "implementations": list(summaries.keys()),
                "verified_equivalent": comparison.get("verified_equivalent", False) if comparison else False,
                "summary_verdict": comparison.get("summary_verdict") if comparison else None,
                "faster_implementation": comparison.get("faster_implementation") if comparison else None,
                "speedup_factor": comparison.get("speedup_factor") if comparison else None,
            })
        return results


def delete_session(session_id: str, db_path: str = DB_FILE) -> bool:
    """Delete a benchmark session by ID."""
    init_db(db_path)
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM benchmark_sessions WHERE id = ?", (session_id,))
        conn.commit()
        return cursor.rowcount > 0

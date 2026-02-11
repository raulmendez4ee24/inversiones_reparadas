from __future__ import annotations

import json
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from pathlib import Path
from typing import Dict, List, Tuple

from .models import AnalysisOutput, BusinessInput

HOURS_PER_DAY = 8


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, column_type: str) -> None:
    existing = {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
    if column not in existing:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_type}")


def init_db(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                company_name TEXT NOT NULL,
                industry TEXT NOT NULL,
                business_focus TEXT,
                region TEXT NOT NULL,
                team_size INTEGER NOT NULL,
                team_size_target INTEGER,
                team_focus_same INTEGER,
                team_roles TEXT,
                avg_daily_cost_mxn REAL,
                manual_days_per_week REAL,
                avg_hourly_cost_usd REAL,
                manual_hours_per_week REAL,
                processes TEXT NOT NULL,
                bottlenecks TEXT NOT NULL,
                systems TEXT NOT NULL,
                goals TEXT NOT NULL,
                budget_range TEXT,
                contact_email TEXT,
                access_code_hash TEXT,
                access_code_hint TEXT,
                diagnosis_json TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                status TEXT NOT NULL,
                selected_modules_json TEXT NOT NULL,
                access_json TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (lead_id) REFERENCES leads (id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS oauth_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER NOT NULL,
                provider TEXT NOT NULL,
                access_token TEXT NOT NULL,
                token_type TEXT,
                expires_at TEXT,
                raw_json TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (lead_id) REFERENCES leads (id)
            )
            """
        )
        _ensure_column(conn, "leads", "avg_daily_cost_mxn", "REAL")
        _ensure_column(conn, "leads", "manual_days_per_week", "REAL")
        _ensure_column(conn, "leads", "avg_hourly_cost_usd", "REAL")
        _ensure_column(conn, "leads", "manual_hours_per_week", "REAL")
        _ensure_column(conn, "leads", "business_focus", "TEXT")
        _ensure_column(conn, "leads", "team_size_target", "INTEGER")
        _ensure_column(conn, "leads", "team_focus_same", "INTEGER")
        _ensure_column(conn, "leads", "team_roles", "TEXT")
        _ensure_column(conn, "leads", "access_code_hash", "TEXT")
        _ensure_column(conn, "leads", "access_code_hint", "TEXT")
        conn.commit()
    finally:
        conn.close()


def _hash_code(code: str) -> str:
    return sha256(code.encode("utf-8")).hexdigest()


def _generate_access_code() -> str:
    return f"{secrets.randbelow(10**6):06d}"


def save_lead(db_path: Path, payload: BusinessInput, analysis: AnalysisOutput) -> tuple[int, str]:
    conn = sqlite3.connect(db_path)
    access_code = _generate_access_code()
    access_code_hash = _hash_code(access_code)
    access_code_hint = access_code[-2:]
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO leads (
                created_at,
                company_name,
                industry,
                business_focus,
                region,
                team_size,
                team_size_target,
                avg_daily_cost_mxn,
                manual_days_per_week,
                avg_hourly_cost_usd,
                manual_hours_per_week,
                team_focus_same,
                team_roles,
                processes,
                bottlenecks,
                systems,
                goals,
                budget_range,
                contact_email,
                access_code_hash,
                access_code_hint,
                diagnosis_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                payload.company_name,
                payload.industry,
                payload.business_focus,
                payload.region,
                payload.team_size,
                payload.team_size_target,
                payload.avg_daily_cost_mxn,
                payload.manual_days_per_week,
                payload.avg_daily_cost_mxn / HOURS_PER_DAY,
                payload.manual_days_per_week * HOURS_PER_DAY,
                1 if payload.team_focus_same else 0 if payload.team_focus_same is not None else None,
                payload.team_roles,
                payload.processes,
                payload.bottlenecks,
                payload.systems,
                payload.goals,
                payload.budget_range,
                payload.contact_email,
                access_code_hash,
                access_code_hint,
                json.dumps(analysis.model_dump(), ensure_ascii=False),
            ),
        )
        conn.commit()
        return int(cursor.lastrowid), access_code
    finally:
        conn.close()


def fetch_lead(db_path: Path, lead_id: int) -> Tuple[BusinessInput, AnalysisOutput]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            """
            SELECT
                company_name,
                industry,
                business_focus,
                region,
                team_size,
                team_size_target,
                team_focus_same,
                team_roles,
                avg_daily_cost_mxn,
                manual_days_per_week,
                avg_hourly_cost_usd,
                manual_hours_per_week,
                processes,
                bottlenecks,
                systems,
                goals,
                budget_range,
                contact_email,
                access_code_hint,
                diagnosis_json
            FROM leads
            WHERE id = ?
            """,
            (lead_id,),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        raise ValueError("Lead not found")

    avg_daily_cost_mxn = row["avg_daily_cost_mxn"]
    manual_days_per_week = row["manual_days_per_week"]

    if avg_daily_cost_mxn is None and row["avg_hourly_cost_usd"] is not None:
        avg_daily_cost_mxn = row["avg_hourly_cost_usd"] * HOURS_PER_DAY

    if manual_days_per_week is None and row["manual_hours_per_week"] is not None:
        manual_days_per_week = row["manual_hours_per_week"] / HOURS_PER_DAY

    team_focus_same = row["team_focus_same"]
    if team_focus_same is not None:
        team_focus_same = bool(team_focus_same)

    payload = BusinessInput(
        company_name=row["company_name"],
        industry=row["industry"],
        business_focus=row["business_focus"] or row["industry"],
        region=row["region"],
        team_size=row["team_size"],
        team_size_target=row["team_size_target"],
        team_focus_same=team_focus_same,
        team_roles=row["team_roles"],
        avg_daily_cost_mxn=avg_daily_cost_mxn if avg_daily_cost_mxn is not None else 1.0,
        manual_days_per_week=manual_days_per_week or 0,
        processes=row["processes"],
        bottlenecks=row["bottlenecks"],
        systems=row["systems"],
        goals=row["goals"],
        budget_range=row["budget_range"],
        contact_email=row["contact_email"],
    )
    analysis = AnalysisOutput(**json.loads(row["diagnosis_json"]))
    return payload, analysis


def validate_portal_login(
    db_path: Path,
    lead_id: int,
    email: str | None,
    access_code: str,
) -> tuple[bool, str | None]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            """
            SELECT contact_email, access_code_hash
            FROM leads
            WHERE id = ?
            """,
            (lead_id,),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return False, "Folio no encontrado."

    if not access_code:
        return False, "Ingresa tu codigo de acceso."

    contact_email = (row["contact_email"] or "").strip().lower()
    if contact_email and (email or "").strip().lower() != contact_email:
        return False, "El correo no coincide con el registrado."

    stored_hash = row["access_code_hash"] or ""
    if stored_hash != _hash_code(access_code.strip()):
        return False, "Codigo incorrecto."

    return True, None


def fetch_latest_project(db_path: Path, lead_id: int) -> Dict[str, object] | None:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            """
            SELECT id, status, selected_modules_json, access_json, notes, created_at
            FROM projects
            WHERE lead_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (lead_id,),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return None

    return {
        "id": row["id"],
        "status": row["status"],
        "selected_modules": json.loads(row["selected_modules_json"]) if row["selected_modules_json"] else [],
        "access": json.loads(row["access_json"]) if row["access_json"] else {},
        "notes": row["notes"],
        "created_at": row["created_at"],
    }


def save_project(
    db_path: Path,
    lead_id: int,
    selected_modules: List[str],
    access_payload: Dict[str, str],
    notes: str,
    status: str,
) -> int:
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO projects (
                lead_id,
                created_at,
                status,
                selected_modules_json,
                access_json,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                lead_id,
                datetime.now(timezone.utc).isoformat(),
                status,
                json.dumps(selected_modules, ensure_ascii=False),
                json.dumps(access_payload, ensure_ascii=False),
                notes,
            ),
        )
        conn.commit()
        return int(cursor.lastrowid)
    finally:
        conn.close()


def update_project_status(db_path: Path, project_id: int, status: str) -> None:
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            "UPDATE projects SET status = ? WHERE id = ?",
            (status, project_id),
        )
        conn.commit()
    finally:
        conn.close()


def save_oauth_token(
    db_path: Path,
    lead_id: int,
    provider: str,
    token_data: Dict[str, object],
) -> None:
    access_token = str(token_data.get("access_token") or "").strip()
    if not access_token:
        return

    token_type = str(token_data.get("token_type") or "").strip() or None
    expires_at = token_data.get("expires_at")
    if not expires_at and token_data.get("expires_in"):
        try:
            seconds = int(token_data["expires_in"])
            expires_at = (datetime.now(timezone.utc) + timedelta(seconds=seconds)).isoformat()
        except (TypeError, ValueError):
            expires_at = None

    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            "DELETE FROM oauth_tokens WHERE lead_id = ? AND provider = ?",
            (lead_id, provider),
        )
        conn.execute(
            """
            INSERT INTO oauth_tokens (
                lead_id,
                provider,
                access_token,
                token_type,
                expires_at,
                raw_json,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                lead_id,
                provider,
                access_token,
                token_type,
                expires_at,
                json.dumps(token_data, ensure_ascii=False),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def fetch_oauth_token(
    db_path: Path,
    lead_id: int,
    provider: str,
) -> Dict[str, object] | None:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            """
            SELECT access_token, token_type, expires_at, raw_json
            FROM oauth_tokens
            WHERE lead_id = ? AND provider = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (lead_id, provider),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return None

    raw = {}
    if row["raw_json"]:
        try:
            raw = json.loads(row["raw_json"])
        except json.JSONDecodeError:
            raw = {}

    return {
        "access_token": row["access_token"],
        "token_type": row["token_type"],
        "expires_at": row["expires_at"],
        "raw": raw,
    }

from __future__ import annotations

import json
import secrets
import sqlite3
import hmac
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from pathlib import Path
from typing import Dict, List, Tuple

from .models import AnalysisOutput, BusinessInput
from .crypto import CryptoError, decrypt_json, decrypt_text, encrypt_json, encrypt_text, is_encrypted

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
                password_hash TEXT,
                password_salt TEXT,
                marketing_opt_in INTEGER,
                marketing_channel TEXT,
                access_code_hash TEXT,
                access_code_hint TEXT,
                diagnosis_json TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS lead_captures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                consent_contact INTEGER,
                source TEXT,
                user_agent TEXT,
                ip TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_lead_captures_email ON lead_captures (email)"
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
        _ensure_column(conn, "leads", "password_hash", "TEXT")
        _ensure_column(conn, "leads", "password_salt", "TEXT")
        _ensure_column(conn, "leads", "marketing_opt_in", "INTEGER")
        _ensure_column(conn, "leads", "marketing_channel", "TEXT")
        _ensure_column(conn, "leads", "access_code_hash", "TEXT")
        _ensure_column(conn, "leads", "access_code_hint", "TEXT")
        conn.commit()
    finally:
        conn.close()


def save_lead_capture(
    db_path: Path,
    email: str,
    phone: str | None,
    consent_contact: bool,
    source: str | None,
    user_agent: str | None,
    ip: str | None,
) -> int:
    email_clean = (email or "").strip().lower()
    if len(email_clean) < 6 or "@" not in email_clean:
        raise ValueError("Email invalido.")

    phone_clean = (phone or "").strip() or None
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO lead_captures (
                created_at,
                email,
                phone,
                consent_contact,
                source,
                user_agent,
                ip
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                email_clean,
                phone_clean,
                1 if consent_contact else 0,
                (source or "").strip() or None,
                (user_agent or "").strip() or None,
                (ip or "").strip() or None,
            ),
        )
        conn.commit()
        return int(cursor.lastrowid)
    finally:
        conn.close()


def _hash_code(code: str) -> str:
    return sha256(code.encode("utf-8")).hexdigest()


def _hash_password(password: str, salt: str) -> str:
    return sha256(f"{salt}{password}".encode("utf-8")).hexdigest()


def _hash_password_bcrypt(password: str) -> str:
    import bcrypt  # local import: optional dependency only used when enabled

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def _verify_password_bcrypt(password: str, stored_hash: str) -> bool:
    import bcrypt  # local import: optional dependency only used when enabled

    try:
        return bool(bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")))
    except ValueError:
        return False


def _password_is_bcrypt(stored_hash: str) -> bool:
    return stored_hash.startswith("$2a$") or stored_hash.startswith("$2b$") or stored_hash.startswith("$2y$")


def _generate_access_code() -> str:
    return f"{secrets.randbelow(10**6):06d}"


def save_lead(db_path: Path, payload: BusinessInput, analysis: AnalysisOutput) -> tuple[int, str]:
    conn = sqlite3.connect(db_path)
    access_code = _generate_access_code()
    access_code_hash = _hash_code(access_code)
    access_code_hint = access_code[-2:]
    avg_daily = float(payload.avg_daily_cost_mxn or 0)
    manual_days = float(payload.manual_days_per_week or 0)
    manual_hours = float(payload.manual_hours_per_week or (manual_days * HOURS_PER_DAY))

    # Backward compatibility: old DBs may enforce NOT NULL on these legacy columns.
    avg_daily_db = avg_daily if avg_daily > 0 else 0.0
    manual_days_db = manual_days if manual_days > 0 else (manual_hours / HOURS_PER_DAY if manual_hours > 0 else 0.0)
    avg_hourly_db = avg_daily_db / HOURS_PER_DAY
    manual_hours_db = manual_hours if manual_hours > 0 else (manual_days_db * HOURS_PER_DAY)
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
                avg_daily_db,
                manual_days_db,
                avg_hourly_db,
                manual_hours_db,
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
    manual_hours_per_week = row["manual_hours_per_week"]

    if avg_daily_cost_mxn is None and row["avg_hourly_cost_usd"] is not None:
        avg_daily_cost_mxn = row["avg_hourly_cost_usd"] * HOURS_PER_DAY

    if manual_days_per_week is None and row["manual_hours_per_week"] is not None:
        manual_days_per_week = row["manual_hours_per_week"] / HOURS_PER_DAY

    if manual_hours_per_week is None and manual_days_per_week is not None:
        manual_hours_per_week = manual_days_per_week * HOURS_PER_DAY

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
        manual_hours_per_week=manual_hours_per_week or 0,
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


def update_lead_credentials(
    db_path: Path,
    lead_id: int,
    email: str | None,
    password: str | None,
    marketing_opt_in: bool,
    marketing_channel: str | None,
) -> None:
    conn = sqlite3.connect(db_path)
    try:
        fields = []
        values: list[object] = []

        if email:
            fields.append("contact_email = ?")
            values.append(email.strip())

        if password:
            pwd_hash = _hash_password_bcrypt(password)
            fields.append("password_hash = ?")
            values.append(pwd_hash)
            fields.append("password_salt = ?")
            values.append(None)

        fields.append("marketing_opt_in = ?")
        values.append(1 if marketing_opt_in else 0)
        fields.append("marketing_channel = ?")
        values.append(marketing_channel or None)

        if not fields:
            return

        values.append(lead_id)
        conn.execute(
            f"UPDATE leads SET {', '.join(fields)} WHERE id = ?",
            tuple(values),
        )
        conn.commit()
    finally:
        conn.close()


def fetch_lead_id_by_email(db_path: Path, email: str) -> int | None:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            """
            SELECT id
            FROM leads
            WHERE lower(contact_email) = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.strip().lower(),),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return None
    return int(row["id"])


def validate_portal_login(
    db_path: Path,
    email: str,
    password: str,
) -> tuple[bool, str | None]:
    if not email:
        return False, "Ingresa tu correo."
    if not password:
        return False, "Ingresa tu contrasena."

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            """
            SELECT password_hash, password_salt
            FROM leads
            WHERE lower(contact_email) = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (email.strip().lower(),),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return False, "Correo no encontrado."

    stored_hash = row["password_hash"] or ""
    salt = row["password_salt"] or ""
    if not stored_hash:
        return False, "Tu cuenta aun no tiene contrasena activada."

    if _password_is_bcrypt(stored_hash):
        if not _verify_password_bcrypt(password.strip(), stored_hash):
            return False, "Contrasena incorrecta."
        return True, None

    # Legacy: sha256(salt+password) (kept for backward compatibility)
    if not salt:
        return False, "Tu cuenta aun no tiene contrasena activada."
    if not hmac.compare_digest(stored_hash, _hash_password(password.strip(), salt)):
        return False, "Contrasena incorrecta."

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

    access_raw = row["access_json"] or ""
    try:
        access_json = decrypt_text(access_raw)
    except CryptoError:
        # If we cannot decrypt (missing/wrong key), hide sensitive data in portal.
        access_json = "{}"

    return {
        "id": row["id"],
        "status": row["status"],
        "selected_modules": json.loads(row["selected_modules_json"]) if row["selected_modules_json"] else [],
        "access": json.loads(access_json) if access_json else {},
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
    access_blob = json.dumps(access_payload, ensure_ascii=False)
    if access_blob.strip() not in ("", "{}", "null"):
        try:
            access_blob = encrypt_text(access_blob)
        except CryptoError as exc:
            raise ValueError(str(exc)) from exc

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
                access_blob,
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

    try:
        access_token_db = encrypt_text(access_token)
        raw_json_db = encrypt_json(token_data)
    except CryptoError as exc:
        raise ValueError(str(exc)) from exc

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
                access_token_db,
                token_type,
                expires_at,
                raw_json_db,
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

    try:
        access_token = decrypt_text(row["access_token"])
    except CryptoError:
        return None

    raw: dict[str, object] = {}
    if row["raw_json"]:
        try:
            raw_obj = decrypt_json(row["raw_json"])
            if isinstance(raw_obj, dict):
                raw = raw_obj
        except Exception:
            raw = {}

    return {
        "access_token": access_token,
        "token_type": row["token_type"],
        "expires_at": row["expires_at"],
        "raw": raw,
    }

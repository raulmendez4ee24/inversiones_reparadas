from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, Tuple

import httpx

TEMPLATE_DIR = Path(__file__).resolve().parents[2] / "n8n_templates"


def _load_template(filename: str) -> Dict[str, Any]:
    path = TEMPLATE_DIR / filename
    return json.loads(path.read_text())


def _replace_placeholders(value: Any, mapping: Dict[str, str]) -> Any:
    if isinstance(value, str):
        for key, replacement in mapping.items():
            value = value.replace(f"{{{{{key}}}}}", replacement)
        return value
    if isinstance(value, list):
        return [_replace_placeholders(item, mapping) for item in value]
    if isinstance(value, dict):
        return {k: _replace_placeholders(v, mapping) for k, v in value.items()}
    return value


def _post_workflow(base_url: str, api_key: str, workflow: Dict[str, Any]) -> Tuple[bool, str]:
    headers = {"X-N8N-API-KEY": api_key, "Content-Type": "application/json"}
    url_candidates = [
        f"{base_url}/api/v1/workflows",
        f"{base_url}/rest/workflows",
    ]
    last_error = ""
    for url in url_candidates:
        try:
            resp = httpx.post(url, headers=headers, json=workflow, timeout=20)
            if resp.status_code in {200, 201}:
                return True, resp.text
            last_error = f"{resp.status_code}: {resp.text}"
        except httpx.HTTPError as exc:
            last_error = str(exc)
    return False, last_error


def provision_workflows(
    project_id: int,
    payload: Any,
    access: Dict[str, Any],
    options: Dict[str, Any],
    wants_whatsapp: bool,
    wants_messenger: bool,
) -> Dict[str, Any]:
    base_url = os.getenv("N8N_API_URL", "").strip().rstrip("/")
    api_key = os.getenv("N8N_API_KEY", "").strip()
    app_base_url = os.getenv("APP_PUBLIC_URL", "http://127.0.0.1:8000").strip().rstrip("/")
    advanced = bool(options.get("advanced_workflow"))

    if not base_url or not api_key:
        return {
            "status": "missing_config",
            "details": "N8N_API_URL or N8N_API_KEY not configured",
        }

    results = []
    if wants_whatsapp:
        workflow = _load_template("whatsapp_bot_advanced.json" if advanced else "whatsapp_bot.json")
        mapping = {
            "PROJECT_ID": str(project_id),
            "APP_BASE_URL": app_base_url,
            "WHATSAPP_TOKEN": access.get("whatsapp_token", ""),
            "WHATSAPP_PHONE_NUMBER_ID": access.get("whatsapp_phone_number_id", ""),
            "WHATSAPP_TEST_NUMBER": access.get("whatsapp_test_number", ""),
            "CRM_WEBHOOK_URL": options.get("crm_webhook_url", ""),
            "CALENDAR_WEBHOOK_URL": options.get("calendar_webhook_url", ""),
            "CRM_NAME": options.get("crm_name", ""),
            "CALENDAR_TOOL": options.get("calendar_tool", ""),
            "COMPANY_NAME": getattr(payload, "company_name", ""),
            "BUSINESS_FOCUS": getattr(payload, "business_focus", ""),
            "INDUSTRY": getattr(payload, "industry", ""),
            "GOALS": getattr(payload, "goals", ""),
        }
        workflow = _replace_placeholders(workflow, mapping)
        ok, detail = _post_workflow(base_url, api_key, workflow)
        results.append({"workflow": "whatsapp", "ok": ok, "detail": detail})

    if wants_messenger:
        workflow = _load_template("messenger_bot_advanced.json" if advanced else "messenger_bot.json")
        mapping = {
            "PROJECT_ID": str(project_id),
            "APP_BASE_URL": app_base_url,
            "FACEBOOK_PAGE_ID": access.get("facebook_page_id", ""),
            "MESSENGER_PAGE_TOKEN": access.get("messenger_page_token", ""),
            "MESSENGER_TEST_PSID": access.get("messenger_test_psid", ""),
            "CRM_WEBHOOK_URL": options.get("crm_webhook_url", ""),
            "CALENDAR_WEBHOOK_URL": options.get("calendar_webhook_url", ""),
            "CRM_NAME": options.get("crm_name", ""),
            "CALENDAR_TOOL": options.get("calendar_tool", ""),
            "COMPANY_NAME": getattr(payload, "company_name", ""),
            "BUSINESS_FOCUS": getattr(payload, "business_focus", ""),
            "INDUSTRY": getattr(payload, "industry", ""),
            "GOALS": getattr(payload, "goals", ""),
        }
        workflow = _replace_placeholders(workflow, mapping)
        ok, detail = _post_workflow(base_url, api_key, workflow)
        results.append({"workflow": "messenger", "ok": ok, "detail": detail})

    return {
        "status": "ok",
        "results": results,
    }

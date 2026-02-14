from __future__ import annotations

import os
from functools import lru_cache
from typing import Iterable

import httpx

DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL_CANDIDATES = (
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
)


def _normalize_model_name(name: str) -> str:
    value = (name or "").strip()
    if value.startswith("models/"):
        value = value.split("/", 1)[1]
    return value


def _dedupe(items: Iterable[str]) -> list[str]:
    unique: list[str] = []
    seen: set[str] = set()
    for item in items:
        cleaned = _normalize_model_name(item)
        if not cleaned or cleaned in seen:
            continue
        unique.append(cleaned)
        seen.add(cleaned)
    return unique


def extract_text(data: dict) -> str:
    for candidate in data.get("candidates", []) or []:
        content = candidate.get("content") or {}
        for part in content.get("parts", []) or []:
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()
    return ""


@lru_cache(maxsize=16)
def _cached_supported_models(api_key: str, base_url: str) -> tuple[str, ...]:
    if not api_key:
        return ()
    try:
        response = httpx.get(
            f"{base_url}/models",
            params={"key": api_key},
            timeout=12,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception:
        return ()

    supported: list[str] = []
    for item in payload.get("models", []) or []:
        methods = item.get("supportedGenerationMethods") or []
        if "generateContent" not in methods:
            continue
        name = _normalize_model_name(str(item.get("name", "")))
        if name:
            supported.append(name)
    return tuple(_dedupe(supported))


def resolve_model_candidates(
    api_key: str,
    base_url: str,
    preferred_model: str | None = None,
) -> list[str]:
    configured_model = os.getenv("GEMINI_MODEL", "").strip()
    static_candidates = _dedupe(
        [
            preferred_model or "",
            configured_model,
            *DEFAULT_MODEL_CANDIDATES,
        ]
    )
    available = list(_cached_supported_models(api_key, base_url))
    if not available:
        return static_candidates

    available_set = set(available)
    prioritized = [model for model in static_candidates if model in available_set]
    remaining = [model for model in available if model not in prioritized]
    return prioritized + remaining


def _response_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return (response.text or "").strip()[:240]

    error = payload.get("error")
    if isinstance(error, dict):
        return str(error.get("message") or error.get("status") or "").strip()
    return str(payload).strip()[:240]


def generate_content(
    prompt: str,
    max_output_tokens: int = 320,
    temperature: float = 0.2,
    preferred_model: str | None = None,
    timeout: float = 25,
) -> tuple[str | None, str | None, str | None]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None, None, "missing_api_key"

    base_url = (
        os.getenv("GEMINI_BASE_URL", DEFAULT_BASE_URL).strip().rstrip("/")
        or DEFAULT_BASE_URL
    )
    candidates = resolve_model_candidates(
        api_key=api_key,
        base_url=base_url,
        preferred_model=preferred_model,
    )
    if not candidates:
        return None, None, "no_candidate_models"

    last_error = "unknown_error"
    for model in candidates:
        try:
            response = httpx.post(
                f"{base_url}/models/{model}:generateContent",
                params={"key": api_key},
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_output_tokens,
                    },
                },
                timeout=timeout,
            )
        except Exception as exc:
            last_error = f"network_error: {exc}"
            continue

        if response.status_code == 404:
            last_error = f"model_not_found: {model}"
            continue

        if response.status_code >= 400:
            message = _response_error_message(response) or f"http_{response.status_code}"
            message_lower = message.lower()
            if "not found" in message_lower and "model" in message_lower:
                last_error = f"model_not_found: {model}"
                continue
            if "unsupported for generatecontent" in message_lower:
                last_error = f"model_unsupported: {model}"
                continue
            return None, model, message

        try:
            data = response.json()
        except ValueError:
            last_error = f"invalid_json: {model}"
            continue

        text = extract_text(data)
        if text:
            return text, model, None
        last_error = f"empty_response: {model}"

    return None, None, last_error


def healthcheck() -> dict[str, object]:
    configured_model = os.getenv("GEMINI_MODEL", "").strip() or None
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "ok": False,
            "provider": "gemini",
            "configured_model": configured_model,
            "active_model": None,
            "error": "missing_api_key",
            "reply": None,
        }

    text, active_model, error = generate_content(
        prompt="Responde solo: ok",
        max_output_tokens=8,
        temperature=0.0,
    )
    ok = bool(text and text.strip())
    return {
        "ok": ok,
        "provider": "gemini",
        "configured_model": configured_model,
        "active_model": active_model,
        "error": None if ok else error,
        "reply": text if ok else None,
    }

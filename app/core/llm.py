from __future__ import annotations

import json
import os
from typing import List, Optional

import httpx

from .models import BusinessInput


def _local_notes(payload: BusinessInput, friction_points: Optional[List[str]]) -> str:
    friction_summary = ", ".join(friction_points or []) or "operacion actual"
    team_target = f"El equipo objetivo es {payload.team_size_target}." if payload.team_size_target else ""
    return (
        f"{payload.company_name} opera en {payload.industry} ({payload.business_focus}). "
        f"El mayor bloqueo esta en "
        f"{friction_summary}. La oportunidad inmediata es reducir tareas manuales en "
        f"{payload.processes[:120].strip()}... {team_target} "
        "En rubros como salud o alimentos, la automatizacion se enfoca en procesos "
        "administrativos y repetitivos, no en el servicio humano."
    )


def _local_insights(
    payload: BusinessInput,
    friction_points: Optional[List[str]],
    recommended: List[str],
    optional: List[str],
) -> dict:
    summary = _local_notes(payload, friction_points)
    opportunities = []
    for name in recommended[:4]:
        opportunities.append(f"{name}: aplicar un flujo enfocado a tu operacion.")
    if not opportunities:
        opportunities = ["Priorizar tareas administrativas repetitivas para ahorrar tiempo."]

    limitations = [
        "No se automatiza el servicio humano o clinico; solo tareas administrativas.",
        "Se requiere validacion del cliente antes de mover dinero o datos sensibles.",
    ]
    if payload.team_focus_same is False:
        limitations.append("Equipo mixto: priorizar procesos transversales primero.")

    data_needed = [
        f"Accesos a sistemas: {payload.systems}.",
        "Volumen mensual de operaciones (ventas, citas, tickets).",
        "Responsable interno para validar procesos y cambios.",
    ]

    if optional:
        data_needed.append("Confirmar si quieres activar opciones adicionales.")

    return {
        "summary": summary,
        "opportunities": opportunities,
        "limitations": limitations,
        "data_needed": data_needed,
        "extra_options": optional,
    }


def _extract_output_text(data: dict) -> str:
    output_text = data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    for item in data.get("output", []) or []:
        for part in item.get("content", []) or []:
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()
    return ""


def _extract_json(text: str) -> Optional[dict]:
    if not text:
        return None
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None


def _gpt5_insights(
    payload: BusinessInput,
    friction_points: Optional[List[str]],
    recommended: List[str],
    optional: List[str],
) -> Optional[dict]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-5").strip()
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip().rstrip("/")
    friction_summary = ", ".join(friction_points or [])

    prompt = (
        "Eres un consultor senior de automatizacion para PyMEs. "
        "Devuelve SOLO JSON valido con estas claves: "
        "summary (string), opportunities (array), limitations (array), data_needed (array), extra_options (array).\n"
        "summary: 3-5 frases claras y especificas segun el rubro.\n"
        "opportunities: 3-5 bullets de automatizaciones concretas aplicables.\n"
        "limitations: 2-3 bullets de lo que NO se automatiza en este rubro.\n"
        "data_needed: 3-5 items de datos/accesos necesarios.\n"
        "extra_options: 2-4 opciones adicionales si aplican.\n\n"
        f"Empresa: {payload.company_name}\n"
        f"Industria: {payload.industry}\n"
        f"Actividad: {payload.business_focus}\n"
        f"Region: {payload.region}\n"
        f"Equipo: {payload.team_size}\n"
        f"Equipo objetivo: {payload.team_size_target or 'no especificado'}\n"
        f"Equipo en una sola area: {payload.team_focus_same if payload.team_focus_same is not None else 'no especificado'}\n"
        f"Roles del equipo: {payload.team_roles or 'no especificado'}\n"
        f"Procesos: {payload.processes}\n"
        f"Cuellos de botella: {payload.bottlenecks}\n"
        f"Sistemas actuales: {payload.systems}\n"
        f"Objetivos: {payload.goals}\n"
        f"Fricciones detectadas: {friction_summary or 'no especificado'}\n"
        f"Modulos recomendados: {', '.join(recommended) if recommended else 'no especificado'}\n"
        f"Opciones adicionales: {', '.join(optional) if optional else 'no especificado'}\n"
    )

    try:
        response = httpx.post(
            f"{base_url}/responses",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "input": prompt,
                "max_output_tokens": 320,
            },
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        text = _extract_output_text(data)
        parsed = _extract_json(text)
        if parsed:
            return parsed
        if text:
            return {
                "summary": text,
                "opportunities": [],
                "limitations": [],
                "data_needed": [],
                "extra_options": [],
            }
        return None
    except httpx.HTTPError:
        return None
    except Exception:
        return None


def consultant_insights(
    payload: BusinessInput,
    friction_points: Optional[List[str]],
    recommended_modules: List[object],
    optional_modules: List[object],
) -> dict:
    recommended = [module.name for module in recommended_modules]
    optional = [module.name for module in optional_modules]

    gpt = _gpt5_insights(payload, friction_points, recommended, optional)
    if gpt and isinstance(gpt, dict):
        return {
            "summary": gpt.get("summary") or _local_notes(payload, friction_points),
            "opportunities": gpt.get("opportunities") or [],
            "limitations": gpt.get("limitations") or [],
            "data_needed": gpt.get("data_needed") or [],
            "extra_options": gpt.get("extra_options") or [],
        }

    return _local_insights(payload, friction_points, recommended, optional)

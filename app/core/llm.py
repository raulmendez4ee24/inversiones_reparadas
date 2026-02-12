from __future__ import annotations

import json
import os
from typing import List, Optional

import httpx

from .models import BusinessInput


def _industry_flags(payload: BusinessInput) -> dict[str, bool]:
    text = f"{payload.industry} {payload.business_focus}".lower()
    health = any(key in text for key in ["salud", "medico", "clinica", "consultorio", "dentista"])
    food = any(key in text for key in ["restaurante", "alimentos", "cocina", "chef", "comida"])
    regulated = health or food
    return {"health": health, "food": food, "regulated": regulated}


def _local_notes(payload: BusinessInput, friction_points: Optional[List[str]]) -> str:
    friction_summary = ", ".join(friction_points or []) or "operacion actual"
    team_target = f"El equipo objetivo es {payload.team_size_target}." if payload.team_size_target else ""
    return (
        f"La empresa opera en {payload.industry} ({payload.business_focus}). "
        f"El mayor bloqueo esta en {friction_summary}. "
        f"La oportunidad inmediata es reducir tareas manuales en {payload.processes[:120].strip()}... "
        f"{team_target}".strip()
    )


def _local_insights(
    payload: BusinessInput,
    friction_points: Optional[List[str]],
    recommended: List[str],
    optional: List[str],
) -> dict:
    summary = _local_notes(payload, friction_points)
    text = f"{payload.processes} {payload.bottlenecks} {payload.systems}".lower()
    opportunities = []
    reasons = {
        "Bot de ventas para WhatsApp": "captura pedidos y prospectos en WhatsApp, reduce tiempos de respuesta y agenda seguimiento",
        "Chatbot de atencion al cliente": "responde dudas frecuentes y libera carga al equipo en soporte",
        "Conciliacion bancaria automatica": "cruza movimientos bancarios con ventas y facturas para cerrar finanzas mas rapido",
        "Facturacion inteligente": "genera y envia facturas automaticamente para evitar retrasos",
        "Sincronizacion Shopify-ERP": "actualiza inventario y pedidos en tiempo real para evitar stock desactualizado",
        "Enriquecimiento y limpieza de CRM": "ordena y limpia leads para que ventas enfoque esfuerzo en prospectos reales",
        "Reportes y dashboards operativos": "da visibilidad diaria de ventas, inventario y cumplimiento",
    }
    for name in recommended[:4]:
        reason = reasons.get(name, "automatiza una tarea repetitiva clave de tu operacion")
        opportunities.append(f"{name}: {reason}.")
    if not opportunities:
        opportunities = ["Priorizar tareas administrativas repetitivas para ahorrar tiempo."]

    flags = _industry_flags(payload)
    limitations = [
        "Se requiere validacion humana antes de mover dinero, datos sensibles o decisiones finales.",
    ]
    if flags["regulated"]:
        limitations.append("En rubros regulados, la automatizacion se limita a procesos administrativos, no al servicio humano.")
    if payload.team_focus_same is False:
        limitations.append("Equipo mixto: priorizar procesos transversales primero.")

    data_needed = [
        f"Accesos a sistemas: {payload.systems}.",
        "Volumen mensual de operaciones (ventas, tickets, pedidos).",
        "Responsable interno para validar procesos y cambios.",
    ]
    if "inventario" in text:
        data_needed.append("Catalogo de productos e inventario actualizado.")
    if "factura" in text or "facturacion" in text:
        data_needed.append("Acceso al sistema de facturacion o CFDI.")
    if "whatsapp" in text:
        data_needed.append("Linea y API de WhatsApp Business (o proveedor actual).")

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
        "summary: 3-5 frases claras, profesionales y especificas segun el rubro. "
        "Si el nombre contiene apodos o frases afectivas, no las repitas; usa 'la empresa'.\n"
        "opportunities: 3-5 bullets con formato 'Modulo: razon concreta basada en procesos o cuellos de botella'. "
        "Si recomiendas un bot, especifica el canal y el objetivo.\n"
        "limitations: 2-3 bullets de lo que NO se automatiza en este rubro. No menciones salud/alimentos si no aplica.\n"
        "data_needed: 3-5 items de datos/accesos necesarios (ej. inventario, facturacion, CRM, WhatsApp). "
        "No inventes sistemas que no se mencionan.\n"
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

from __future__ import annotations

import json
import os
from typing import List, Optional

from .gemini_client import generate_content
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
    focus = (payload.bottlenecks or payload.processes or "operaciones").strip()
    focus_short = (focus[:140] + "...") if len(focus) > 140 else focus
    hours = payload.manual_hours_per_week or 0
    jornadas_mes = (hours * 4.33) / 8 if hours else 0
    hours_note = (
        f"Hoy se regalan aprox. {jornadas_mes:.1f} dias de sueldo al mes en tareas manuales."
        if jornadas_mes
        else ""
    )
    return (
        f"La empresa opera en {payload.industry} ({payload.business_focus}). "
        f"{hours_note} "
        f"El mayor bloqueo esta en: {friction_summary}. "
        f"Prioridad inmediata: atacar {focus_short}. "
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
        "Conciliacion automatica (banco vs ventas)": "detecta diferencias entre banco, ventas y hojas para evitar fugas, fraudes y retrabajo",
        "Facturacion inteligente": "genera y envia facturas automaticamente para evitar retrasos",
        "Sincronizacion Shopify-ERP": "actualiza inventario y pedidos en tiempo real para evitar stock desactualizado",
        "Enriquecimiento y limpieza de CRM": "ordena y limpia leads para que ventas enfoque esfuerzo en prospectos reales",
        "Reportes y dashboards operativos": "da visibilidad diaria de ventas, inventario y cumplimiento",
        "Eficiencia administrativa (archivos y carpetas)": "automatiza carpetas y archivos para que nunca se pierdan documentos y todo quede ordenado 24/7",
        "Generador de documentos inteligente": "genera contratos/cotizaciones/facturas en PDF sin errores, sin copiar y pegar",
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
        limitations.append(
            "En rubros regulados, la automatizacion se limita a procesos administrativos, no al servicio humano."
        )
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


def _call_gemini(prompt: str, max_tokens: int = 520) -> Optional[str]:
    text, _, _ = generate_content(
        prompt=prompt,
        max_output_tokens=max_tokens,
        temperature=0.2,
    )
    return text


def _gemini_insights(
    payload: BusinessInput,
    friction_points: Optional[List[str]],
    recommended: List[str],
    optional: List[str],
) -> Optional[dict]:
    if not os.getenv("GEMINI_API_KEY", "").strip():
        return None
    friction_summary = ", ".join(friction_points or [])

    prompt = (
        "Actuas como un Arquitecto de Soluciones Empresariales de Elite (nivel Silicon Valley). "
        "Tu tono es visionario, seguro y profesional, enfocado en escalabilidad y seguridad de datos. "
        "Escribe para dueños de negocio exigentes: cero tecnicismos, puro valor estrategico. "
        "Traduce tiempo a jornadas laborales completas (8h) y a dias de sueldo. "
        "Incluye siempre: riesgo de error humano, costo de oportunidad (ventas/atencion), rotacion (reentrenamiento) y escalabilidad (evitar contratar mas). "
        "Devuelve SOLO JSON valido con estas claves: "
        "summary (string), opportunities (array), limitations (array), data_needed (array), extra_options (array), complexity_assessment (object).\n"
        "Matriz de pricing modular obligatoria: "
        "PAQUETE MICRO (uso personal/micro): agenda o chatbot basico, rango $2,000-$3,000 MXN; "
        "PAQUETE LITE si perfil micro y <=5 empleados, rango $8,000-$12,000 MXN; "
        "PAQUETE GROWTH si PyME con ventas/procesos y >10 empleados, rango $25,000-$45,000 MXN; "
        "PAQUETE ELITE si IA con memoria, scraping masivo, trading o ERP complejo, desde $60,000 MXN.\n"
        "summary: 3-5 frases claras, profesionales y especificas segun el rubro. "
        "Si el nombre contiene apodos o frases afectivas, no las repitas; usa 'la empresa'. "
        "Habla en terminos de dinero/tiempo que se pierde y la mejor palanca para corregirlo.\n"
        "opportunities: 3-5 bullets con formato 'Accion: por que aplica'. "
        "Si recomiendas un bot, especifica el canal (WhatsApp/Messenger/Web) y el objetivo (vender/soporte/agendar).\n"
        "limitations: 2-3 bullets de lo que NO se automatiza en este rubro. "
        "NO menciones salud/alimentos/regulado si no aplica a la industria/actividad.\n"
        "data_needed: 3-5 items de datos que el cliente SI entiende (ej. catalogo, inventario, facturas, lista de precios, horarios). "
        "No pidas tokens o API keys. No inventes sistemas que no se mencionan.\n"
        "extra_options: 2-4 opciones adicionales si aplican.\n\n"
        "complexity_assessment: Objeto con { \"level\": \"low\"|\"medium\"|\"high\", \"reasoning\": \"breve explicacion\" }. "
        "Define el nivel de complejidad/costo. "
        "'low': Micro-negocio o proceso aislado simple (ej. tienda local). "
        "'medium': PyME estandar. "
        "'high': Corporativo o integraciones complejas.\n\n"
        f"Industria: {payload.industry}\n"
        f"Actividad: {payload.business_focus}\n"
        f"Region: {payload.region}\n"
        f"Equipo total: {payload.team_size}\n"
        f"Tiempo manual: {payload.manual_hours_per_week or 'no especificado'} horas/semana (8h = 1 jornada)\n"
        f"Roles del equipo: {payload.team_roles or 'no especificado'}\n"
        f"Prioridades marcadas: {', '.join(payload.selected_modules) if payload.selected_modules else 'no especificado'}\n"
        f"Descripcion operacion (opcional): {payload.processes or 'no especificado'}\n"
        f"Lo que mas duele hoy: {payload.bottlenecks}\n"
        f"Herramientas actuales: {payload.systems or 'no especificado'}\n"
        f"Objetivos: {payload.goals or 'no especificado'}\n"
        f"Dinero que deja en la mesa: {friction_summary or 'no especificado'}\n"
        f"Modulos sugeridos por el sistema: {', '.join(recommended) if recommended else 'no especificado'}\n"
        f"Opciones extra: {', '.join(optional) if optional else 'no especificado'}\n"
    )

    text = _call_gemini(prompt, max_tokens=320)
    if not text:
        return None
    parsed = _extract_json(text)
    if parsed:
        return parsed
    return {
        "summary": text,
        "opportunities": [],
        "limitations": [],
        "data_needed": [],
        "extra_options": [],
    }


def consultant_diagnosis(
    payload: BusinessInput,
    friction_points_guess: List[str],
    available_modules: List[dict],
    roi_context: dict,
    recommended_guess: List[str] | None = None,
    optional_guess: List[str] | None = None,
) -> dict:
    """
    Uses Gemini 1.5 (if configured) to personalize:
    - primary bottleneck
    - pain statements
    - module selection (from the provided catalog)
    - executive summary + actions + data needed
    Falls back to local heuristics when GEMINI_API_KEY is missing.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    module_names = [str(item.get("name", "")).strip() for item in (available_modules or []) if item.get("name")]
    module_set = {name for name in module_names if name}

    # Local fallback (always available).
    fallback = _local_insights(
        payload,
        friction_points_guess,
        recommended_guess or [],
        optional_guess or [],
    )
    fallback_result = {
        "primary_bottleneck": (payload.bottlenecks or "").strip()[:140] or (friction_points_guess[0] if friction_points_guess else ""),
        "pain_points": friction_points_guess or ["Hay tiempos muertos y poca visibilidad: hoy no sabes que pasa en tiempo real."],
        "recommended_modules": recommended_guess or [],
        "optional_modules": optional_guess or [],
        "summary": fallback.get("summary", ""),
        "opportunities": fallback.get("opportunities", []),
        "limitations": fallback.get("limitations", []),
        "data_needed": fallback.get("data_needed", []),
        "extra_options": fallback.get("extra_options", []),
    }

    if not api_key or not module_set:
        return fallback_result

    # Keep the catalog compact: name + 1-liner + integrations.
    catalog_lines = []
    for item in available_modules[:24]:
        name = str(item.get("name", "")).strip()
        if not name:
            continue
        desc = str(item.get("description", "")).strip()
        integrations = item.get("integrations") or []
        integrations_text = ", ".join([str(x) for x in integrations if x]) if isinstance(integrations, list) else str(integrations)
        catalog_lines.append(f"- {name}: {desc} (Integraciones: {integrations_text})")

    jornadas_mes = 0.0
    try:
        jornadas_mes = float(roi_context.get("manual_jornadas_per_month") or 0)
    except (TypeError, ValueError):
        jornadas_mes = 0.0

    prompt = (
        "Actuas como Director de Estrategia Digital y Automatizacion para K'an (Expertos en IA y Seguridad). "
        "Tu objetivo es entregar un diagnostico de clase mundial, que inspire confianza total y profesionalismo. "
        "Escribe con autoridad, directo y empoderador (cero tecnicismos, enfoque en resultados y seguridad). "
        "Reglas:\n"
        "- Detecta el cuello de botella principal (1), y explica por que es la palanca #1.\n"
        "- No recomiendes WhatsApp/chatbots si el dolor NO menciona ventas/leads/mensajes/soporte/citas.\n"
        "- No recomiendes Shopify/ERP si NO se menciona ecommerce/inventario.\n"
        "- Siempre incluye: riesgo de error humano, costo de oportunidad (ventas/atencion), costo de rotacion (reentrenamiento) y escalabilidad (evitar contratar mas).\n"
        "- Traduce tiempo a jornadas completas (8h) y a dias de sueldo.\n"
        "- Elige modulos SOLO del catalogo (usa el nombre exacto).\n\n"
        "Devuelve SOLO JSON valido con estas claves:\n"
        "primary_bottleneck (string), pain_points (array<string> 3-6), recommended_modules (array<string> 3-5), optional_modules (array<string> 0-4), "
        "summary (string 3-5 frases), opportunities (array<string> 3-6 con formato 'Accion: por que aplica'), "
        "limitations (array<string> 2-3), data_needed (array<string> 3-6), complexity_assessment (object).\n\n"
        "Matriz de pricing modular (contexto obligatorio): "
        "MICRO: uso personal o agenda/chatbot basico ($2,000-$3,000 MXN). "
        "LITE: micro y <=5 empleados ($8,000-$12,000 MXN). "
        "GROWTH: PyME y procesos comerciales/integraciones (>10 empleados, $25,000-$45,000 MXN). "
        "ELITE: memoria IA/scraping masivo/trading/ERP complejo ($60,000+ MXN).\n"
        f"Industria: {payload.industry}\n"
        f"Actividad: {payload.business_focus}\n"
        f"Region: {payload.region}\n"
        f"Equipo total: {payload.team_size}\n"
        f"Roles del equipo: {payload.team_roles or 'no especificado'}\n"
        f"Prioridades marcadas (si las hay): {', '.join(payload.selected_modules) if payload.selected_modules else 'no especificado'}\n"
        f"Operacion (opcional): {payload.processes or 'no especificado'}\n"
        f"Cuello de botella (texto del cliente): {payload.bottlenecks}\n"
        f"Herramientas: {payload.systems or 'no especificado'}\n"
        f"Objetivos: {payload.goals or 'no especificado'}\n\n"
        "Contexto de impacto (estimado en MXN):\n"
        f"- Jornadas completas al mes (8h): {jornadas_mes:.1f}\n"
        f"- Sueldo regalado por tiempo: ${float(roi_context.get('time_value_mxn_per_month') or 0):.0f} MXN/mes\n"
        f"- Riesgo de error humano (impacto): ${float(roi_context.get('error_cost_mxn_per_month') or 0):.0f} MXN/mes\n"
        f"- Ahorro por errores evitados: ${float(roi_context.get('error_savings_mxn_per_month') or 0):.0f} MXN/mes\n"
        f"- Costo de oportunidad (ventas/atencion): ${float(roi_context.get('opportunity_cost_mxn_per_month') or 0):.0f} MXN/mes\n"
        f"- Impacto anual total proyectado: ${float(roi_context.get('total_with_opportunity_mxn_per_year') or 0):.0f} MXN/año\n"
        f"- Costo de rotacion (reentrenamiento): ${float(roi_context.get('rotation_cost_mxn_per_hire') or 0):.0f} MXN por reemplazo\n"
        f"- Escalabilidad: equivale a {float(roi_context.get('fte_equivalent') or 0):.2f} personas de tiempo completo\n"
        f"- Payback conservador (sin oportunidad): {float(roi_context.get('payback_months') or 0):.2f} meses\n\n"
        "Catalogo de modulos disponibles:\n"
        + "\n".join(catalog_lines)
        + "\n\n"
        "complexity_assessment: Objeto con { \"level\": \"low\"|\"medium\"|\"high\", \"reasoning\": \"breve explicacion\" }. "
        "Define el nivel de complejidad/costo. "
        "'low': Micro-negocio o proceso aislado simple (ej. tienda local). "
        "'medium': PyME estandar. "
        "'high': Corporativo o integraciones complejas.\n\n"
        "Sugerencia inicial del sistema (puedes corregirla):\n"
        f"- Dolor detectado: {', '.join(friction_points_guess) if friction_points_guess else 'no especificado'}\n"
        f"- Modulos sugeridos: {', '.join((recommended_guess or [])[:5]) if recommended_guess else 'no especificado'}\n"
    )

    text = _call_gemini(prompt, max_tokens=520)
    if not text:
        return fallback_result
    parsed = _extract_json(text) or {}
    if not isinstance(parsed, dict):
        return fallback_result

    primary = str(parsed.get("primary_bottleneck") or "").strip()
    if not primary:
        primary = fallback_result["primary_bottleneck"]

    pain = parsed.get("pain_points")
    if not isinstance(pain, list):
        pain = fallback_result["pain_points"]
    pain_points = [str(item).strip() for item in pain if str(item).strip()][:6]
    if not pain_points:
        pain_points = fallback_result["pain_points"]

    rec = parsed.get("recommended_modules")
    if not isinstance(rec, list):
        rec = fallback_result["recommended_modules"]
    rec_names = [str(item).strip() for item in rec if str(item).strip() in module_set][:5]
    if not rec_names:
        rec_names = [name for name in (recommended_guess or []) if name in module_set][:5] or fallback_result["recommended_modules"]

    opt = parsed.get("optional_modules")
    if not isinstance(opt, list):
        opt = fallback_result["optional_modules"]
    opt_names = [str(item).strip() for item in opt if str(item).strip() in module_set and str(item).strip() not in rec_names][:4]

    summary = str(parsed.get("summary") or "").strip() or fallback_result["summary"]

    def _list(name: str, default: list) -> list:
        value = parsed.get(name)
        if not isinstance(value, list):
            return default
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return cleaned

    opportunities = _list("opportunities", fallback_result["opportunities"])[:6]
    limitations = _list("limitations", fallback_result["limitations"])[:3]
    data_needed = _list("data_needed", fallback_result["data_needed"])[:6]

    complexity_data = parsed.get("complexity_assessment") or {}
    complexity_level = str(complexity_data.get("level", "")).lower().strip()
    if complexity_level not in ("low", "medium", "high"):
        complexity_level = None

    return {
        "primary_bottleneck": primary,
        "pain_points": pain_points,
        "recommended_modules": rec_names,
        "optional_modules": opt_names,
        "summary": summary,
        "opportunities": opportunities,
        "limitations": limitations,
        "data_needed": data_needed,
        "extra_options": _list("extra_options", fallback_result["extra_options"])[:4],
        "complexity_level": complexity_level,
    }


def consultant_insights(
    payload: BusinessInput,
    friction_points: Optional[List[str]],
    recommended_modules: List[object],
    optional_modules: List[object],
) -> dict:
    recommended = [module.name for module in recommended_modules]
    optional = [module.name for module in optional_modules]

    gemini = _gemini_insights(payload, friction_points, recommended, optional)
    if gemini and isinstance(gemini, dict):
        flags = _industry_flags(payload)
        limitations = gemini.get("limitations") or []
        if not flags["regulated"]:
            limitations = [item for item in limitations if "salud" not in str(item).lower() and "alimentos" not in str(item).lower()]
        return {
            "summary": gemini.get("summary") or _local_notes(payload, friction_points),
            "opportunities": gemini.get("opportunities") or [],
            "limitations": limitations,
            "data_needed": gemini.get("data_needed") or [],
            "extra_options": gemini.get("extra_options") or [],
        }

    return _local_insights(payload, friction_points, recommended, optional)

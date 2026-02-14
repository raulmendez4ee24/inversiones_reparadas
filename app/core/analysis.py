from __future__ import annotations

import math
import re
from typing import List

from .llm import consultant_diagnosis
from .models import AnalysisOutput, AutomationModule, BusinessInput, PricingQuote, RoadmapPhase
from .modules import catalog
from .pricing import (
    decide_service_tier,
    enforce_irresistible_roi,
    estimate_complexity_level,
    pricing_assumptions,
    roi_breakdown,
    suggest_setup_price,
)

HOURS_PER_DAY = 8


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower())


def _automation_scope_factor(payload: BusinessInput) -> float:
    text = _normalize(
        f"{payload.business_focus} {payload.processes} {payload.team_roles or ''}"
    )
    restricted = [
        "consultorio",
        "clinica",
        "dentista",
        "medico",
        "salud",
        "restaurante",
        "cocina",
        "chef",
        "barberia",
        "estetica",
    ]
    factor = 1.0
    if any(word in text for word in restricted):
        factor *= 0.65
    if payload.team_focus_same is False:
        factor *= 0.85
    return max(0.4, factor)


def _module_allowed(text: str, module: AutomationModule) -> bool:
    gates = {
        "Sincronizacion Shopify-ERP": [
            "shopify",
            "ecommerce",
            "tienda online",
            "tienda en linea",
            "woocommerce",
        ],
        "Conciliacion automatica (banco vs ventas)": [
            "banco",
            "conciliacion",
            "tesoreria",
            "finanzas",
            "contabilidad",
            "ventas",
        ],
        "Facturacion inteligente": ["factura", "facturacion", "comprobante", "sat"],
        "Ruteo de tickets de soporte": ["ticket", "soporte", "helpdesk", "sla"],
        "Enriquecimiento y limpieza de CRM": ["crm", "leads", "ventas"],
        "Bot de ventas para WhatsApp": [
            "whatsapp",
            "ventas",
            "leads",
            "cotizacion",
            "prospectos",
            "citas",
            "agenda",
            "reservas",
            "turnos",
        ],
        "Chatbot de atencion al cliente": [
            "chatbot",
            "soporte",
            "clientes",
            "atencion",
            "faq",
            "citas",
            "agenda",
        ],
        "Onboarding de personal": ["rh", "recursos humanos", "onboarding", "personal", "nomina"],
        "Eficiencia administrativa (archivos y carpetas)": [
            "carpeta",
            "carpetas",
            "archivo",
            "archivos",
            "documento",
            "documentos",
            "organizar",
            "papeleo",
            "drive",
            "onedrive",
            "dropbox",
        ],
        "Generador de documentos inteligente": [
            "factura",
            "facturacion",
            "contrato",
            "cotizacion",
            "pdf",
            "recibo",
            "firma",
            "firmar",
        ],
    }

    required = gates.get(module.name)
    if not required:
        return True
    return any(key in text for key in required)


def _pick_friction_points(payload: BusinessInput) -> List[str]:
    raw = (
        f"{payload.processes} {payload.bottlenecks} {payload.systems} "
        f"{payload.business_focus} {payload.team_roles or ''}"
    )
    text = _normalize(raw)
    points = []

    # Pain-first language (no technicismos).
    patterns = {
        "Tu equipo pierde horas cada semana en tareas repetitivas (capturas, copiar/pegar, Excel).": [
            "manual",
            "excel",
            "copiar",
            "pegar",
            "captura",
        ],
        "Tienes caos administrativo: se pierden archivos, carpetas y versiones (y eso cuesta dinero).": [
            "carpeta",
            "carpetas",
            "archivo",
            "archivos",
            "documento",
            "documentos",
            "papeleo",
            "organizar",
            "drive",
            "onedrive",
            "dropbox",
        ],
        "Los errores de copiar/pegar en documentos (cotizaciones, contratos, facturas) te salen caros.": [
            "cotizacion",
            "cotizar",
            "contrato",
            "factura",
            "facturacion",
            "pdf",
            "firma",
            "firmar",
        ],
        "Se te pueden ir ventas porque los leads se pierden entre WhatsApp, correos y notas.": [
            "whatsapp",
            "correo",
            "seguimiento",
            "leads",
            "prospect",
        ],
        "Tus clientes esperan demasiado por una respuesta (y eso mata conversion).": [
            "soporte",
            "ticket",
            "respuesta",
            "tard",
            "espera",
            "sla",
        ],
        "Pierdes ventas por inventario desactualizado (no sabes que hay realmente).": [
            "inventario",
            "stock",
            "erp",
            "shopify",
        ],
        "La facturacion te frena: capturas, correcciones y envios manuales.": [
            "factura",
            "facturacion",
            "comprobante",
            "cfdi",
            "sat",
        ],
        "Tus finanzas se cierran tarde por conciliacion manual y errores de captura.": [
            "banco",
            "conciliacion",
            "tesoreria",
            "contabilidad",
        ],
        "Tus reportes llegan tarde: tomas decisiones sin datos al dia.": [
            "reporte",
            "dashboard",
            "kpi",
            "indicador",
        ],
    }

    for label, keys in patterns.items():
        if any(key in text for key in keys):
            points.append(label)

    if not points:
        points.append("Hay tiempos muertos y poca visibilidad: hoy no sabes que pasa en tiempo real.")

    return points


def _score_modules(payload: BusinessInput) -> tuple[list[AutomationModule], list[AutomationModule]]:
    raw = (
        f"{payload.processes} {payload.bottlenecks} {payload.systems} "
        f"{payload.goals} {payload.business_focus} {payload.team_roles or ''}"
    )
    text = _normalize(raw)
    selected_keys = set(payload.selected_modules or [])
    selection_map = {
        # Selected modules are broad priorities (customer-friendly). Map them to concrete templates/modules.
        "whatsapp_ventas": [
            "Bot de ventas para WhatsApp",
            "Chatbot de atencion al cliente",
        ],
        "inventarios_datos": [
            "Sincronizacion Shopify-ERP",
            "Reportes y dashboards operativos",
            "Conciliacion automatica (banco vs ventas)",
        ],
        "dashboards_reportes": ["Reportes y dashboards operativos"],
        "eficiencia_administrativa": ["Eficiencia administrativa (archivos y carpetas)"],
        "documentos_inteligentes": [
            "Generador de documentos inteligente",
            "Facturacion inteligente",
        ],
        "conciliacion_automatica": ["Conciliacion automatica (banco vs ventas)"],
    }
    explicitly_requested = set()
    for key in selected_keys:
        explicitly_requested.update(selection_map.get(key, []))

    admin_keywords = [
        "carpeta",
        "carpetas",
        "archivo",
        "archivos",
        "firmar",
        "firma",
        "organizar",
        "organizacion",
        "papeleo",
        "papel",
        "documento",
        "documentos",
    ]
    has_admin_pain = any(key in text for key in admin_keywords)
    modules = catalog()

    scored = []
    for module in modules:
        score = sum(1 for tag in module.tags if tag in text)
        if module.name in explicitly_requested:
            # If the user explicitly selected a priority, it must show up in recommendations.
            score += 5
        # Pain boost: if the user talks about archivos/carpetas/firmas, admin efficiency must rise to the top.
        if has_admin_pain and module.name == "Eficiencia administrativa (archivos y carpetas)":
            score += 6
        if has_admin_pain and module.name == "Generador de documentos inteligente":
            score += 4
        allowed = (module.name in explicitly_requested) or _module_allowed(text, module)
        if score > 0 and allowed:
            scored.append((score, module))

    scored.sort(key=lambda item: item[0], reverse=True)
    ranked = [module for _, module in scored]
    selected = ranked[:5]
    optional = [module for module in ranked[5:9] if module not in selected]

    if not selected:
        generic = [
            "Eficiencia administrativa (archivos y carpetas)",
            "Generador de documentos inteligente",
            "Reportes y dashboards operativos",
            "Conciliacion automatica (banco vs ventas)",
            "Facturacion inteligente",
        ]
        ranked = [module for module in modules if module.name in generic]
        selected = ranked[:3]
        optional = ranked[3:6]

    if not selected:
        selected = modules[:3]
        optional = modules[3:6]

    return selected, optional


def _estimate_savings(payload: BusinessInput, module_count: int) -> float:
    base_ratio = 0.15 + (module_count * 0.1)
    ratio = min(base_ratio, 0.6)
    ratio *= _automation_scope_factor(payload)
    weekly_hours = (payload.manual_hours_per_week or 0) or ((payload.manual_days_per_week or 0) * HOURS_PER_DAY)
    weekly_saved = weekly_hours * ratio
    return weekly_saved * 4.33


def _build_roadmap(
    modules: List[AutomationModule],
    implementation_eta: str | None = None,
) -> List[RoadmapPhase]:
    build_weeks = sum(module.estimated_weeks for module in modules)
    implementation_weeks = max(2, min(6, math.ceil(build_weeks / 2)))
    diagnostic_label = "1 semana"
    escala_label = "1 semana"

    implementation_label = implementation_eta
    if implementation_eta:
        eta = implementation_eta.lower()
        if "hora" in eta or "dia" in eta:
            diagnostic_label = "1-2 dias"
            implementation_weeks = 1

    return [
        RoadmapPhase(
            name="Diagnostico",
            focus="Diagnostico y mapeo de procesos",
            duration_weeks=1,
            duration_label=diagnostic_label,
            deliverable="Mapa de flujo y lista priorizada",
        ),
        RoadmapPhase(
            name="Implementacion",
            focus="Automatizaciones modulares y pruebas",
            duration_weeks=implementation_weeks,
            duration_label=implementation_label,
            deliverable="Flujos en produccion con control de calidad",
        ),
        RoadmapPhase(
            name="Escala",
            focus="Optimizacion de prompts, monitoreo y mejoras",
            duration_weeks=1,
            duration_label=escala_label,
            deliverable="Tablero de indicadores y plan de mejora continua",
        ),
    ]


def run_analysis(payload: BusinessInput) -> AnalysisOutput:
    friction_points_guess = _pick_friction_points(payload)
    modules_guess, optional_modules_guess = _score_modules(payload)
    module_catalog = catalog()

    # ROI + pricing (Mexico-focused).
    roi = roi_breakdown(
        payload.manual_hours_per_week or 0,
        f"{payload.bottlenecks} {payload.processes} {payload.systems}",
        payload.selected_modules,
    )

    # 1) Initial complexity seed.
    heuristic_level = estimate_complexity_level(payload.team_size)
    selected_for_pricing = payload.selected_modules or [module.name for module in modules_guess]
    seed_tier = decide_service_tier(
        payload,
        f"{payload.bottlenecks} {payload.processes} {payload.systems} {payload.goals}",
        selected_for_pricing,
        complexity_level=heuristic_level,
    )
    setup = suggest_setup_price(
        seed_tier,
        selected_for_pricing,
        payload.tooling_level,
        payload.transaction_volume,
    )
    payback = setup / max(roi.total_mxn_per_month, 1)

    available_modules = [
        {
            "name": module.name,
            "description": module.description,
            "integrations": module.integrations,
            "estimated_weeks": module.estimated_weeks,
            "impact": module.impact,
        }
        for module in module_catalog
    ]
    roi_context = {
        "manual_hours_per_month": roi.manual_hours_per_month,
        "manual_jornadas_per_month": roi.manual_jornadas_per_month,
        "loaded_daily_cost_mxn": roi.loaded_daily_cost_mxn,
        "loaded_monthly_cost_mxn": roi.loaded_monthly_cost_mxn,
        "time_value_mxn_per_month": roi.time_value_mxn_per_month,
        "error_cost_mxn_per_month": roi.error_cost_mxn_per_month,
        "error_savings_mxn_per_month": roi.error_savings_mxn_per_month,
        "opportunity_cost_mxn_per_month": roi.opportunity_cost_mxn_per_month,
        "total_with_opportunity_mxn_per_year": roi.total_with_opportunity_mxn_per_year,
        "rotation_cost_mxn_per_hire": roi.rotation_cost_mxn_per_hire,
        "fte_equivalent": roi.fte_equivalent,
        "payback_months": payback,
        "setup_fee_mxn": setup,
    }
    diagnosis = consultant_diagnosis(
        payload,
        friction_points_guess,
        available_modules,
        roi_context,
        recommended_guess=[module.name for module in modules_guess],
        optional_guess=[module.name for module in optional_modules_guess],
    )

    # 2) Refine complexity based on GPT signal.
    gpt_level = diagnosis.get("complexity_level")
    final_level = gpt_level if gpt_level else heuristic_level

    tier_decision = decide_service_tier(
        payload,
        f"{payload.bottlenecks} {payload.processes} {payload.systems} {payload.goals}",
        selected_for_pricing,
        complexity_level=final_level,
    )
    base_setup = suggest_setup_price(
        tier_decision,
        selected_for_pricing,
        payload.tooling_level,
        payload.transaction_volume,
    )

    loaded_hourly_cost = roi.loaded_daily_cost_mxn / HOURS_PER_DAY
    estimated_hours_saved_per_month = _estimate_savings(payload, len(modules_guess))
    estimated_hours_saved_per_year = estimated_hours_saved_per_month * 12
    roi_annual_formula = estimated_hours_saved_per_year * loaded_hourly_cost
    setup, roi_adjusted_to_3x, _ = enforce_irresistible_roi(base_setup, roi_annual_formula)
    payback = setup / max(roi.total_mxn_per_month, 1)
    roi_multiple = roi_annual_formula / max(setup, 1)
    roi_annual_net = roi_annual_formula - setup

    pricing = PricingQuote(
        setup_fee_mxn=setup,
        monthly_retainer_mxn=0,
        assumptions=pricing_assumptions(),
        implementation_tier=final_level.title(),
        implementation_eta=None,
        service_tier=tier_decision.tier,
        service_tier_reason=tier_decision.reason,
        suggested_range_min_mxn=tier_decision.min_price_mxn,
        suggested_range_max_mxn=tier_decision.max_price_mxn,
        roi_annual_formula_mxn=round(roi_annual_formula, 2),
        roi_annual_net_mxn=round(roi_annual_net, 2),
        roi_multiple=round(roi_multiple, 2),
        roi_adjusted_to_3x=roi_adjusted_to_3x,
    )

    # Final pain points + modules (GPT can override; fallback keeps heuristic selection).
    friction_points = diagnosis.get("pain_points") or friction_points_guess
    catalog_by_name = {module.name: module for module in module_catalog}
    recommended_names = diagnosis.get("recommended_modules") or [module.name for module in modules_guess]
    optional_names = diagnosis.get("optional_modules") or [module.name for module in optional_modules_guess]
    modules = [catalog_by_name[name] for name in recommended_names if name in catalog_by_name]
    if not modules:
        modules = modules_guess or module_catalog[:3]
    optional_modules = [catalog_by_name[name] for name in optional_names if name in catalog_by_name and name not in {m.name for m in modules}]

    return AnalysisOutput(
        friction_points=friction_points,
        recommended_modules=modules,
        optional_modules=optional_modules,
        opportunities=diagnosis.get("opportunities") or [],
        limitations=diagnosis.get("limitations") or [],
        data_needed=diagnosis.get("data_needed") or [],
        primary_bottleneck=diagnosis.get("primary_bottleneck") or "",
        # Reuse existing fields but the UI will show them in plain language:
        # - roi_hours_saved_per_month ~= horas manuales/mes (para que el UI lo convierta a jornadas de 8h)
        # - roi_mxn_saved_per_month ~= ahorro recurrente mensual (conservador, sin incluir oportunidad)
        roi_hours_saved_per_month=round(roi.manual_hours_per_month, 1),
        roi_time_value_mxn_per_month=round(roi.time_value_mxn_per_month, 2),
        roi_error_cost_mxn_per_month=round(roi.error_cost_mxn_per_month, 2),
        roi_error_savings_mxn_per_month=round(roi.error_savings_mxn_per_month, 2),
        roi_opportunity_mxn_per_month=round(roi.opportunity_cost_mxn_per_month, 2),
        roi_total_with_opportunity_mxn_per_month=round(roi.total_with_opportunity_mxn_per_month, 2),
        roi_total_with_opportunity_mxn_per_year=round(roi.total_with_opportunity_mxn_per_year, 2),
        roi_loaded_daily_cost_mxn=round(roi.loaded_daily_cost_mxn, 2),
        roi_loaded_monthly_cost_mxn=round(roi.loaded_monthly_cost_mxn, 2),
        roi_rotation_cost_mxn_per_hire=round(roi.rotation_cost_mxn_per_hire, 2),
        roi_fte_equivalent=round(roi.fte_equivalent, 2),
        roi_mxn_saved_per_month=round(roi.total_mxn_per_month, 2),
        payback_months=round(payback, 2),
        roadmap=_build_roadmap(modules, implementation_eta=None),
        pricing=pricing,
        notes=diagnosis.get("summary") or "",
    )

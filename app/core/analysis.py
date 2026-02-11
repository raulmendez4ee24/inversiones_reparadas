from __future__ import annotations

import math
import re
from typing import List

from .llm import consultant_insights
from .models import AnalysisOutput, AutomationModule, BusinessInput, PricingQuote, RoadmapPhase
from .modules import catalog
from .pricing import monthly_retainer, pricing_assumptions, setup_fee

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
        "Conciliacion bancaria automatica": [
            "banco",
            "conciliacion",
            "tesoreria",
            "finanzas",
            "contabilidad",
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

    patterns = {
        "Trabajo manual excesivo": ["manual", "excel", "copiar", "pegar"],
        "Seguimiento de clientes disperso": ["whatsapp", "correo", "seguimiento", "leads"],
        "Errores en conciliacion / finanzas": ["banco", "conciliacion", "tesoreria"],
        "Inventario desactualizado": ["inventario", "stock", "erp", "shopify"],
        "Facturacion lenta": ["factura", "facturacion", "comprobante"],
        "Reportes tardios": ["reporte", "dashboard", "kpi"],
    }

    for label, keys in patterns.items():
        if any(key in text for key in keys):
            points.append(label)

    if not points:
        points.append("Procesos con tiempos muertos y baja visibilidad operativa")

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
    if any(word in text for word in restricted):
        points.append(
            "En este rubro la automatizacion se enfoca en tareas administrativas y repetitivas"
        )

    return points


def _score_modules(payload: BusinessInput) -> tuple[list[AutomationModule], list[AutomationModule]]:
    raw = (
        f"{payload.processes} {payload.bottlenecks} {payload.systems} "
        f"{payload.goals} {payload.business_focus} {payload.team_roles or ''}"
    )
    text = _normalize(raw)
    modules = catalog()

    scored = []
    for module in modules:
        score = sum(1 for tag in module.tags if tag in text)
        if score > 0 and _module_allowed(text, module):
            scored.append((score, module))

    scored.sort(key=lambda item: item[0], reverse=True)
    ranked = [module for _, module in scored]
    selected = ranked[:5]
    optional = [module for module in ranked[5:9] if module not in selected]

    if not selected:
        generic = [
            "Reportes y dashboards operativos",
            "Automatizacion de correo",
            "Facturacion inteligente",
            "Enriquecimiento y limpieza de CRM",
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
    weekly_hours = payload.manual_days_per_week * HOURS_PER_DAY
    weekly_saved = weekly_hours * ratio
    return weekly_saved * 4.33


def _build_roadmap(modules: List[AutomationModule]) -> List[RoadmapPhase]:
    build_weeks = sum(module.estimated_weeks for module in modules)
    return [
        RoadmapPhase(
            name="Diagnostico",
            focus="Diagnostico y mapeo de procesos",
            duration_weeks=1,
            deliverable="Mapa de flujo y lista priorizada",
        ),
        RoadmapPhase(
            name="Implementacion",
            focus="Automatizaciones modulares y pruebas",
            duration_weeks=max(2, min(6, math.ceil(build_weeks / 2))),
            deliverable="Flujos en produccion con control de calidad",
        ),
        RoadmapPhase(
            name="Escala",
            focus="Optimizacion de prompts, monitoreo y mejoras",
            duration_weeks=1,
            deliverable="Tablero de indicadores y plan de mejora continua",
        ),
    ]


def run_analysis(payload: BusinessInput) -> AnalysisOutput:
    friction_points = _pick_friction_points(payload)
    modules, optional_modules = _score_modules(payload)
    hours_saved = _estimate_savings(payload, len(modules))
    hourly_cost_mxn = payload.avg_daily_cost_mxn / HOURS_PER_DAY
    mxn_saved = hours_saved * hourly_cost_mxn

    integration_count = len({integration for module in modules for integration in module.integrations})
    setup = setup_fee(len(modules), integration_count)
    retainer = monthly_retainer(len(modules))
    payback = setup / max(mxn_saved, 1)

    pricing = PricingQuote(
        setup_fee_mxn=setup,
        monthly_retainer_mxn=retainer,
        assumptions=pricing_assumptions(),
    )

    insights = consultant_insights(
        payload,
        friction_points,
        modules,
        optional_modules,
    )

    return AnalysisOutput(
        friction_points=friction_points,
        recommended_modules=modules,
        optional_modules=optional_modules,
        opportunities=insights["opportunities"],
        limitations=insights["limitations"],
        data_needed=insights["data_needed"],
        roi_hours_saved_per_month=round(hours_saved, 1),
        roi_mxn_saved_per_month=round(mxn_saved, 2),
        payback_months=round(payback, 2),
        roadmap=_build_roadmap(modules),
        pricing=pricing,
        notes=insights["summary"],
    )

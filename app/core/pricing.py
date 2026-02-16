from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Dict, List

from .models import BusinessInput


HOURS_PER_DAY = 8
WORKDAYS_PER_MONTH_MX = 22
WEEKS_PER_MONTH = 4.33

# Mexico-focused conservative assumptions (can be overridden by env vars).
DEFAULT_NET_MONTHLY_SALARY_MXN = 10_000
DEFAULT_BENEFITS_RATE = 0.30  # IMSS/carga prestacional aproximada.
BASE_PRICE_MXN = 5000
ERROR_REDUCTION_FACTOR = 0.6


MODULE_PRICE_MXN: Dict[str, int] = {
    "whatsapp_ventas": 10_000,
    "inventarios_datos": 15_000,
    "dashboards_reportes": 8_000,
    "eficiencia_administrativa": 7_000,
    "documentos_inteligentes": 12_000,
    "conciliacion_automatica": 15_000,
}

MODULE_LABELS: Dict[str, str] = {
    "whatsapp_ventas": "WhatsApp/Ventas",
    "inventarios_datos": "Inventarios/Datos",
    "dashboards_reportes": "Dashboards/Reportes",
    "eficiencia_administrativa": "Eficiencia Administrativa",
    "documentos_inteligentes": "Documentos Inteligentes (PDF)",
    "conciliacion_automatica": "Conciliacion Automatica",
}

PRICING_TIERS = {
    "low": {"base": 2000, "multiplier": 0.35},
    "medium": {"base": 5000, "multiplier": 1.0},
    "high": {"base": 15000, "multiplier": 1.8},
}

SERVICE_TIER_RANGES_MXN = {
    "MICRO": (2_000, 3_000),
    "LITE": (8_000, 12_000),
    "GROWTH": (25_000, 45_000),
    "ELITE": (60_000, 120_000),
}

TOOLING_COMPLEXITY = {
    "solo_whatsapp": 0,
    "excel": 1,
    "shopify": 2,
    "erp_complejo": 3,
}


@dataclass(frozen=True)
class PricingBreakdown:
    base_mxn: int
    module_fees_mxn: Dict[str, int]
    complexity_multiplier: float
    final_price_mxn: int


@dataclass(frozen=True)
class ServiceTierDecision:
    tier: str
    min_price_mxn: int
    max_price_mxn: int
    reason: str


def _employee_band_from_team_size(team_size: int) -> str:
    if team_size <= 5:
        return "1-5"
    if team_size <= 20:
        return "6-20"
    return "21-100+"


def decide_service_tier(
    payload: BusinessInput,
    pain_text: str,
    selected_modules: List[str],
    complexity_level: str | None = None,
) -> ServiceTierDecision:
    employee_band = (payload.employee_band or _employee_band_from_team_size(payload.team_size)).strip()
    volume = (payload.transaction_volume or "").strip().lower()
    tooling = (payload.tooling_level or "").strip().lower()
    raw = (pain_text or "").lower()
    selected = set(selected_modules or [])
    team_size = max(1, int(payload.team_size or 1))
    micro_signals = any(
        key in raw for key in ["agenda", "citas", "recordatorio", "calendario", "personal", "asistente personal"]
    )
    ultra_micro_size = team_size <= 2

    elite_signals = any(
        key in raw for key in ["memoria", "scraping", "masivo", "trading", "erp", "multi-sucursal", "multisucursal"]
    ) or tooling == "erp_complejo"
    growth_signals = any(
        key in raw for key in ["ventas", "crm", "pipeline", "leads", "inventario", "soporte"]
    ) or bool(selected)

    if elite_signals or employee_band == "21-100+" or volume == "alto" or complexity_level == "high":
        low, high = SERVICE_TIER_RANGES_MXN["ELITE"]
        return ServiceTierDecision(
            tier="ELITE",
            min_price_mxn=low,
            max_price_mxn=high,
            reason="Operacion de alto volumen o integraciones avanzadas (ERP/IA compleja).",
        )

    if (
        employee_band == "1-5"
        and volume in ("", "bajo")
        and tooling in ("", "solo_whatsapp", "excel")
        and (len(selected) <= 1 or micro_signals or ultra_micro_size)
    ):
        low, high = SERVICE_TIER_RANGES_MXN["MICRO"]
        return ServiceTierDecision(
            tier="MICRO",
            min_price_mxn=low,
            max_price_mxn=high,
            reason="Uso personal o micro-negocio con alcance puntual (agenda/chatbot basico).",
        )

    if (employee_band == "1-5" and volume in ("", "bajo") and tooling in ("", "solo_whatsapp", "excel")) or complexity_level == "low":
        low, high = SERVICE_TIER_RANGES_MXN["LITE"]
        return ServiceTierDecision(
            tier="LITE",
            min_price_mxn=low,
            max_price_mxn=high,
            reason="Micro-negocio con flujo simple y enfoque en automatizacion rapida.",
        )

    # Guard rail: small businesses with low volume and simple tools should not jump to enterprise-like pricing.
    if (
        team_size <= 10
        and volume in ("", "bajo")
        and tooling in ("", "solo_whatsapp", "excel")
        and not elite_signals
        and complexity_level != "high"
    ):
        low, high = SERVICE_TIER_RANGES_MXN["LITE"]
        return ServiceTierDecision(
            tier="LITE",
            min_price_mxn=low,
            max_price_mxn=high,
            reason="Negocio pequeno de bajo volumen: conviene empezar en LITE y escalar por modulos.",
        )

    if growth_signals or employee_band == "6-20" or volume == "medio" or complexity_level == "medium":
        low, high = SERVICE_TIER_RANGES_MXN["GROWTH"]
        return ServiceTierDecision(
            tier="GROWTH",
            min_price_mxn=low,
            max_price_mxn=high,
            reason="PyME con procesos comerciales/operativos que requieren integraciones.",
        )

    low, high = SERVICE_TIER_RANGES_MXN["GROWTH"]
    return ServiceTierDecision(
        tier="GROWTH",
        min_price_mxn=low,
        max_price_mxn=high,
        reason="Perfil intermedio con potencial de escalamiento.",
    )


def suggest_setup_price(
    tier_decision: ServiceTierDecision,
    selected_modules: List[str],
    tooling_level: str | None,
    transaction_volume: str | None,
) -> int:
    module_count = len(selected_modules or [])
    if tier_decision.tier == "MICRO":
        raw_micro = tier_decision.min_price_mxn + (module_count * 500)
        bounded_micro = min(tier_decision.max_price_mxn, max(tier_decision.min_price_mxn, raw_micro))
        return int(round(bounded_micro / 100.0) * 100)

    tooling_score = TOOLING_COMPLEXITY.get((tooling_level or "").strip().lower(), 1)
    volume_score = {"bajo": 0, "medio": 1, "alto": 2}.get((transaction_volume or "").strip().lower(), 1)

    # Pricing por capas: parte de un base del paquete y sube por alcance adicional.
    extra = (module_count * 1_500) + (tooling_score * 2_000) + (volume_score * 2_500)
    raw = tier_decision.min_price_mxn + extra
    bounded = min(tier_decision.max_price_mxn, max(tier_decision.min_price_mxn, raw))
    return int(round(bounded / 500.0) * 500)


def enforce_irresistible_roi(price_mxn: float, annual_savings_mxn: float) -> tuple[int, bool, float]:
    investment = max(1.0, float(price_mxn or 0))
    annual_savings = max(0.0, float(annual_savings_mxn or 0))
    max_for_3x = annual_savings / 3.0
    adjusted = False

    if max_for_3x > 0 and investment > max_for_3x:
        investment = max(1_000.0, max_for_3x)
        adjusted = True

    final_price = int(round(investment / 500.0) * 500)
    final_price = max(1_000, final_price)
    return final_price, adjusted, max_for_3x


def estimate_complexity_level(num_empleados: int) -> str:
    if num_empleados <= 5:
        return "low"
    if num_empleados <= 25:
        return "medium"
    return "high"


def calculate_final_price(
    num_empleados: int, modulos_seleccionados: List[str], complexity_level: str | None = None
) -> PricingBreakdown:
    if not complexity_level:
        complexity_level = estimate_complexity_level(num_empleados)

    tier = PRICING_TIERS.get(complexity_level.lower(), PRICING_TIERS["medium"])
    selected = [key for key in (modulos_seleccionados or []) if key in MODULE_PRICE_MXN]
    module_fees = {
        key: int(round((MODULE_PRICE_MXN[key] * tier["multiplier"]) / 100.0)) * 100 for key in selected
    }
    subtotal = tier["base"] + sum(module_fees.values())

    return PricingBreakdown(
        base_mxn=tier["base"],
        module_fees_mxn=module_fees,
        complexity_multiplier=tier["multiplier"],
        final_price_mxn=subtotal,
    )


@dataclass(frozen=True)
class ROIBreakdown:
    time_value_mxn_per_month: float
    error_cost_mxn_per_month: float
    error_savings_mxn_per_month: float
    opportunity_cost_mxn_per_month: float
    total_mxn_per_month: float
    total_with_opportunity_mxn_per_month: float
    total_mxn_per_year: float
    total_with_opportunity_mxn_per_year: float
    error_risk_factor: float
    manual_hours_per_month: float
    manual_jornadas_per_month: float
    loaded_daily_cost_mxn: float
    loaded_monthly_cost_mxn: float
    rotation_cost_mxn_per_hire: float
    fte_equivalent: float


def _error_risk_factor(text: str, modulos_seleccionados: List[str]) -> float:
    """
    Estimacion conservadora:
    - Si hay papeleo/archivos/firma/documentos: errores cuestan mas (factor mayor).
    - Si hay finanzas/inventario/conciliacion: factor medio.
    - Si no hay señales: factor bajo.
    """
    raw = (text or "").lower()

    admin_keywords = [
        "carpeta",
        "carpetas",
        "archivo",
        "archivos",
        "organizar",
        "papeleo",
        "documento",
        "documentos",
        "contrato",
        "firmar",
        "firma",
        "pdf",
    ]
    finance_keywords = [
        "banco",
        "conciliacion",
        "tesoreria",
        "contabilidad",
        "factura",
        "facturacion",
        "inventario",
        "stock",
    ]

    selected = set(modulos_seleccionados or [])
    if "eficiencia_administrativa" in selected or "documentos_inteligentes" in selected:
        return 0.35
    if "conciliacion_automatica" in selected or "inventarios_datos" in selected:
        return 0.25
    if any(k in raw for k in admin_keywords):
        return 0.35
    if any(k in raw for k in finance_keywords):
        return 0.25
    return 0.15


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        return float(default)
    try:
        return float(raw)
    except ValueError:
        return float(default)


def _labor_cost_config() -> tuple[float, float, float, float, float]:
    """
    Returns (net_monthly, benefits_rate, workdays_per_month, hours_per_day, weeks_per_month).
    """
    net_monthly = _env_float("ROI_NET_MONTHLY_SALARY_MXN", DEFAULT_NET_MONTHLY_SALARY_MXN)
    benefits_rate = _env_float("ROI_BENEFITS_RATE", DEFAULT_BENEFITS_RATE)
    workdays = _env_float("ROI_WORKDAYS_PER_MONTH", WORKDAYS_PER_MONTH_MX)
    hours_day = _env_float("ROI_HOURS_PER_DAY", HOURS_PER_DAY)
    weeks_month = _env_float("ROI_WEEKS_PER_MONTH", WEEKS_PER_MONTH)
    return net_monthly, benefits_rate, workdays, hours_day, weeks_month


def _opportunity_factor(text: str, modulos_seleccionados: List[str]) -> float:
    """
    Estimacion conservadora de costo de oportunidad (ventas/atencion) sobre el costo de tiempo:
    - Si el dolor es ventas/WhatsApp/leads: factor mas alto.
    - Si es mas administrativo: factor mas bajo.
    """
    raw = (text or "").lower()
    selected = set(modulos_seleccionados or [])
    if "whatsapp_ventas" in selected:
        return 0.8

    sales_keywords = [
        "ventas",
        "lead",
        "leads",
        "prospect",
        "prospecto",
        "prospectos",
        "whatsapp",
        "conversion",
        "cotizacion",
        "cotizar",
        "cierre",
        "seguimiento",
        "mensaje",
        "mensajes",
        "clientes",
        "atencion",
        "responder",
        "soporte",
    ]
    if any(k in raw for k in sales_keywords):
        return 0.6
    return 0.3


def _rotation_training_days(text: str, modulos_seleccionados: List[str]) -> int:
    """
    Costo de rotacion (por reemplazo): dias de entrenamiento y tiempo muerto por procesos no estandarizados.
    """
    raw = (text or "").lower()
    selected = set(modulos_seleccionados or [])
    if "eficiencia_administrativa" in selected or "documentos_inteligentes" in selected:
        return 10

    admin_keywords = [
        "carpeta",
        "carpetas",
        "archivo",
        "archivos",
        "organizar",
        "papeleo",
        "documento",
        "documentos",
        "contrato",
        "firmar",
        "firma",
        "pdf",
    ]
    if any(k in raw for k in admin_keywords):
        return 10
    return 7


def roi_breakdown(
    horas_manuales_semana: float,
    pain_text: str,
    modulos_seleccionados: List[str],
) -> ROIBreakdown:
    """
    ROI Mexico-focused (operaciones) con 3 componentes:
    - Sueldo regalado (tiempo): convierte horas a jornadas (8h) y valora con sueldo neto + 30% carga.
    - Riesgo de error humano: impacto mensual estimado por capturas/documentos/conciliacion.
      Ahorro por reduccion de errores = costo_error * 60%.
    - Costo de oportunidad: dinero que deja de ganar por tener al equipo en Excel en vez de vender/atender.
    """
    hours_week = max(0.0, float(horas_manuales_semana or 0))
    net_monthly, benefits_rate, workdays, hours_day, weeks_month = _labor_cost_config()
    loaded_monthly = net_monthly * (1.0 + benefits_rate)
    loaded_daily = loaded_monthly / max(workdays, 1.0)
    loaded_hourly = loaded_daily / max(hours_day, 1.0)

    manual_hours_month = hours_week * weeks_month
    manual_jornadas_month = manual_hours_month / max(hours_day, 1.0)

    time_monthly = manual_hours_month * loaded_hourly

    factor = _error_risk_factor(pain_text, modulos_seleccionados)
    error_cost = time_monthly * factor
    error_savings = error_cost * ERROR_REDUCTION_FACTOR

    opportunity = time_monthly * _opportunity_factor(pain_text, modulos_seleccionados)
    total_monthly = time_monthly + error_savings
    total_with_opportunity = total_monthly + opportunity
    total_year = total_monthly * 12
    total_with_opportunity_year = total_with_opportunity * 12

    training_days = _rotation_training_days(pain_text, modulos_seleccionados)
    rotation_cost = loaded_daily * training_days
    fte_equivalent = manual_jornadas_month / max(workdays, 1.0)

    return ROIBreakdown(
        time_value_mxn_per_month=time_monthly,
        error_cost_mxn_per_month=error_cost,
        error_savings_mxn_per_month=error_savings,
        opportunity_cost_mxn_per_month=opportunity,
        total_mxn_per_month=total_monthly,
        total_with_opportunity_mxn_per_month=total_with_opportunity,
        total_mxn_per_year=total_year,
        total_with_opportunity_mxn_per_year=total_with_opportunity_year,
        error_risk_factor=factor,
        manual_hours_per_month=manual_hours_month,
        manual_jornadas_per_month=manual_jornadas_month,
        loaded_daily_cost_mxn=loaded_daily,
        loaded_monthly_cost_mxn=loaded_monthly,
        rotation_cost_mxn_per_hire=rotation_cost,
        fte_equivalent=fte_equivalent,
    )


def pricing_assumptions() -> List[str]:
    net_monthly, benefits_rate, workdays, _, _ = _labor_cost_config()
    loaded_monthly = net_monthly * (1.0 + benefits_rate)
    loaded_daily = loaded_monthly / max(workdays, 1.0)
    return [
        "PRIVACIDAD GARANTIZADA: Toda tu información y credenciales se encriptan (AES-256) y nunca se comparten con terceros.",
        "Ingeniería 'Llave en Mano': nuestro equipo experto configura, conecta y asegura todo (sin tecnicismos para ti).",
        "Infraestructura Blindada: No almacenamos datos sensibles en texto plano. Tu seguridad es prioridad #1.",
        "El alcance se certifica en la sesión de ingeniería (15 min) antes del despliegue.",
        f"Base de cálculo ROI (México): sueldo neto ${int(net_monthly):,} MXN/mes + {int(benefits_rate*100)}% carga prestacional.",
    ]

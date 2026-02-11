from __future__ import annotations

from typing import List


def clamp(value: int, min_value: int, max_value: int) -> int:
    return max(min_value, min(max_value, value))


def setup_fee(module_count: int, integration_count: int) -> int:
    base = 9000
    fee = base + (module_count * 3500) + (integration_count * 1800)
    return clamp(fee, 9000, 50000)


def monthly_retainer(module_count: int) -> int:
    base = 2500
    retainer = base + (module_count * 900)
    return clamp(retainer, 2000, 12000)


def pricing_assumptions() -> List[str]:
    return [
        "Incluye diseno, implementacion y monitoreo inicial.",
        "No incluye costos de infraestructura de terceros.",
        "El alcance final puede ajustarse despues del diagnostico.",
        "La automatizacion aplica solo a procesos administrativos o repetitivos.",
    ]

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class BusinessInput(BaseModel):
    company_name: str = Field(..., min_length=2)
    industry: str = Field(..., min_length=2)
    business_focus: str = Field(..., min_length=2)
    region: str = Field(default="LATAM")
    team_size: int = Field(..., ge=1)
    team_size_target: Optional[int] = Field(default=None, ge=1)
    team_focus_same: Optional[bool] = None
    team_roles: Optional[str] = None
    employee_band: Optional[str] = None
    transaction_volume: Optional[str] = None
    tooling_level: Optional[str] = None
    # New simplified inputs for ROI/pricing (keep legacy fields optional for backward compatibility).
    manual_hours_per_week: float = Field(default=0, ge=0)
    selected_modules: List[str] = Field(default_factory=list)

    # Legacy (deprecated): kept so older leads still load.
    avg_daily_cost_mxn: Optional[float] = Field(default=None, ge=0)
    manual_days_per_week: Optional[float] = Field(default=None, ge=0)

    processes: str = Field(default="")
    bottlenecks: str = Field(..., min_length=5)
    systems: str = Field(default="")
    goals: str = Field(default="")
    budget_range: Optional[str] = None
    contact_email: Optional[str] = None
    contact_whatsapp: Optional[str] = None


class AutomationModule(BaseModel):
    name: str
    description: str
    effort: str
    impact: int
    integrations: List[str]
    estimated_weeks: int
    tags: List[str]


class RoadmapPhase(BaseModel):
    name: str
    focus: str
    duration_weeks: int
    duration_label: Optional[str] = None
    deliverable: str


class PricingQuote(BaseModel):
    setup_fee_mxn: int
    monthly_retainer_mxn: int
    assumptions: List[str]
    implementation_tier: Optional[str] = None
    implementation_eta: Optional[str] = None
    service_tier: Optional[str] = None
    service_tier_reason: Optional[str] = None
    suggested_range_min_mxn: Optional[int] = None
    suggested_range_max_mxn: Optional[int] = None
    roi_annual_formula_mxn: Optional[float] = None
    roi_annual_net_mxn: Optional[float] = None
    roi_multiple: Optional[float] = None
    roi_adjusted_to_3x: bool = False


class AnalysisOutput(BaseModel):
    friction_points: List[str]
    recommended_modules: List[AutomationModule]
    optional_modules: List[AutomationModule] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    data_needed: List[str] = Field(default_factory=list)
    primary_bottleneck: str = ""
    roi_hours_saved_per_month: float
    roi_time_value_mxn_per_month: float = 0
    roi_error_cost_mxn_per_month: float = 0
    roi_error_savings_mxn_per_month: float = 0
    roi_opportunity_mxn_per_month: float = 0
    roi_total_with_opportunity_mxn_per_month: float = 0
    roi_total_with_opportunity_mxn_per_year: float = 0
    roi_loaded_daily_cost_mxn: float = 0
    roi_loaded_monthly_cost_mxn: float = 0
    roi_rotation_cost_mxn_per_hire: float = 0
    roi_fte_equivalent: float = 0
    roi_mxn_saved_per_month: float
    payback_months: float
    roadmap: List[RoadmapPhase]
    pricing: PricingQuote
    notes: str

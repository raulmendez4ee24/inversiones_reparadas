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
    avg_daily_cost_mxn: float = Field(..., ge=1)
    manual_days_per_week: float = Field(..., ge=0)
    processes: str = Field(..., min_length=5)
    bottlenecks: str = Field(..., min_length=5)
    systems: str = Field(..., min_length=2)
    goals: str = Field(..., min_length=2)
    budget_range: Optional[str] = None
    contact_email: Optional[str] = None


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
    deliverable: str


class PricingQuote(BaseModel):
    setup_fee_mxn: int
    monthly_retainer_mxn: int
    assumptions: List[str]


class AnalysisOutput(BaseModel):
    friction_points: List[str]
    recommended_modules: List[AutomationModule]
    optional_modules: List[AutomationModule] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    data_needed: List[str] = Field(default_factory=list)
    roi_hours_saved_per_month: float
    roi_mxn_saved_per_month: float
    payback_months: float
    roadmap: List[RoadmapPhase]
    pricing: PricingQuote
    notes: str

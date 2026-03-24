"""
core/schemas.py
All Pydantic request / response models.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from enum import Enum


class UserType(str, Enum):
    salaried_private = "salaried_private"
    salaried_govt    = "salaried_govt"
    shopkeeper       = "shopkeeper"
    businessman      = "businessman"
    self_employed    = "self_employed"


class RiskBand(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


# ── Predict ──────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    user_type: UserType
    features: Dict[str, Optional[float]] = Field(
        default={},
        description="Feature key-value pairs. Missing features will be GMM-imputed.",
        example={
            "monthly_avg_income": 75000,
            "salary_day_consistency": 0.95,
            "emi_paid_ontime_ratio": 0.97,
            "net_savings_rate": 0.30,
            "utility_payment_consistency": 0.92,
            "cheque_bounce_count": 0,
            "account_vintage_months": 60,
        }
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_type": "salaried_private",
                "features": {
                    "monthly_avg_income": 75000,
                    "salary_day_consistency": 0.95,
                    "emi_paid_ontime_ratio": 0.97,
                    "net_savings_rate": 0.30,
                    "utility_payment_consistency": 0.92,
                    "cheque_bounce_count": 0,
                    "account_vintage_months": 60,
                }
            }
        }


class PredictResponse(BaseModel):
    credit_score:          int
    risk_band:             str
    risk_band_label:       str
    loan_decision:         str
    decision_color:        str
    score_percentile:      float
    dimension_scores:      Dict[str, float]
    top_positive_factors:  Dict[str, float]
    top_negative_factors:  Dict[str, float]
    cluster_membership:    Dict[str, float]
    imputed_features:      List[str]
    imputed_count:         int
    features_provided:     int
    completeness_pct:      float


# ── Users ────────────────────────────────────────────────────────

class UserSummary(BaseModel):
    user_id:      int
    user_type:    str
    credit_score: int
    risk_band:    str
    age:          Optional[int]
    monthly_avg_income: Optional[float]
    account_vintage_months: Optional[int]


class UserDetail(UserSummary):
    features: Dict[str, Any]


class UserListResponse(BaseModel):
    total:   int
    page:    int
    limit:   int
    results: List[UserSummary]


# ── Analytics ────────────────────────────────────────────────────

class BandDistribution(BaseModel):
    band:    str
    label:   str
    count:   int
    pct:     float
    color:   str


class ScoreHistogram(BaseModel):
    bins:   List[str]
    counts: List[int]


class UserTypeBreakdown(BaseModel):
    user_type: str
    count:     int
    avg_score: float
    pct:       float


class FeatureImportance(BaseModel):
    feature:    str
    importance: float
    rank:       int


class AgeScoreData(BaseModel):
    age_group: str
    avg_score: float
    count:     int


# ── Dashboard ────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_users:       int
    avg_credit_score:  float
    median_score:      float
    auto_approve_pct:  float
    manual_review_pct: float
    reject_pct:        float
    band_distribution: List[BandDistribution]
    model_mae:         Optional[float]
    model_r2:          Optional[float]


# ── Batch ────────────────────────────────────────────────────────

class BatchPredictItem(BaseModel):
    user_id:   Optional[str] = None
    user_type: UserType
    features:  Dict[str, Optional[float]]


class BatchPredictRequest(BaseModel):
    users: List[BatchPredictItem]


class BatchPredictResultItem(BaseModel):
    user_id:       Optional[str]
    credit_score:  int
    risk_band:     str
    loan_decision: str
    score_percentile: float
    imputed_count: int


class BatchPredictResponse(BaseModel):
    total:       int
    results:     List[BatchPredictResultItem]
    band_summary: Dict[str, int]
    avg_score:   float
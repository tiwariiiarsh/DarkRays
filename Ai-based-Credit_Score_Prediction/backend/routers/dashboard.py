"""
routers/analytics.py
Analytics endpoints — score distributions, feature importance,
age/type breakdowns, correlation data, all chart-ready.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import numpy as np
import pandas as pd
import math

from core.model_loader import ModelStore

router = APIRouter()

BAND_COLORS  = {"A": "#22c55e", "B": "#3b82f6", "C": "#f59e0b", "D": "#ef4444"}
BAND_LABELS  = {"A": "Excellent (750–900)", "B": "Good (650–749)", "C": "Fair (550–649)", "D": "Poor (300–549)"}


# ── Score distribution ────────────────────────────────────────────

@router.get(
    "/score-distribution",
    summary="Credit score histogram",
    description="Histogram data for credit score distribution. Ready for Chart.js bar chart.",
)
def score_distribution(
    bins:      int           = Query(30, ge=5,  le=100),
    user_type: Optional[str] = Query(None),
    risk_band: Optional[str] = Query(None),
):
    df = _filtered(user_type, risk_band)
    scores = df["credit_score"].values
    hist, edges = np.histogram(scores, bins=bins, range=(300, 900))

    labels = [f"{int(edges[i])}–{int(edges[i+1])}" for i in range(len(edges)-1)]
    return {
        "labels": labels,
        "counts": hist.tolist(),
        "mean":   round(float(scores.mean()), 1),
        "median": round(float(np.median(scores)), 1),
        "std":    round(float(scores.std()), 1),
        "min":    int(scores.min()),
        "max":    int(scores.max()),
        "total":  len(scores),
    }


# ── Band distribution ─────────────────────────────────────────────

@router.get(
    "/band-distribution",
    summary="Risk band pie/donut chart data",
    description="Count and percentage per risk band. Ready for Chart.js pie/doughnut.",
)
def band_distribution(user_type: Optional[str] = Query(None)):
    df    = _filtered(user_type, None)
    total = len(df)
    vc    = df["risk_band"].value_counts()

    result = []
    for band in ["A", "B", "C", "D"]:
        count = int(vc.get(band, 0))
        result.append({
            "band":  band,
            "label": BAND_LABELS[band],
            "count": count,
            "pct":   round(count / total * 100, 2) if total else 0,
            "color": BAND_COLORS[band],
        })
    return {"total": total, "bands": result}


# ── User type breakdown ───────────────────────────────────────────

@router.get(
    "/user-type-breakdown",
    summary="Score stats per user type",
    description="Average score and band distribution per user type. Good for grouped bar chart.",
)
def user_type_breakdown():
    df    = ModelStore.get_all_users()
    total = len(df)

    result = []
    for utype, grp in df.groupby("user_type"):
        vc = grp["risk_band"].value_counts()
        result.append({
            "user_type":   utype,
            "count":       len(grp),
            "pct":         round(len(grp) / total * 100, 2),
            "avg_score":   round(float(grp["credit_score"].mean()), 1),
            "median_score":round(float(grp["credit_score"].median()), 1),
            "band_A_pct":  round(int(vc.get("A", 0)) / len(grp) * 100, 1),
            "band_B_pct":  round(int(vc.get("B", 0)) / len(grp) * 100, 1),
            "band_C_pct":  round(int(vc.get("C", 0)) / len(grp) * 100, 1),
            "band_D_pct":  round(int(vc.get("D", 0)) / len(grp) * 100, 1),
        })

    result.sort(key=lambda x: x["avg_score"], reverse=True)
    return {"user_type_stats": result}


# ── Age vs score ──────────────────────────────────────────────────

@router.get(
    "/age-score",
    summary="Credit score by age group",
    description="Average score bucketed by age bands. Good for line / bar chart.",
)
def age_score():
    df = ModelStore.get_all_users().copy()
    df = df[df["age"].notna() & df["credit_score"].notna()]
    df["age_group"] = pd.cut(
        df["age"].astype(int),
        bins=[20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
        labels=["20-25", "25-30", "30-35", "35-40", "40-45", "45-50", "50-55", "55-60", "60-65"],
    )
    grp = df.groupby("age_group", observed=True)["credit_score"].agg(["mean", "median", "count"]).reset_index()
    return {
        "labels":         grp["age_group"].astype(str).tolist(),
        "avg_scores":     [round(float(v), 1) for v in grp["mean"]],
        "median_scores":  [round(float(v), 1) for v in grp["median"]],
        "counts":         grp["count"].tolist(),
    }


# ── Feature importance ────────────────────────────────────────────

@router.get(
    "/feature-importance",
    summary="Top feature importances from XGBoost",
    description="Returns XGBoost feature_importances_ sorted by score. Good for horizontal bar chart.",
)
def feature_importance(top_n: int = Query(20, ge=5, le=64)):
    ms  = ModelStore
    mdl = ms.xgb_model
    fc  = ms.feat_cols + ["user_type_enc"]
    imp = mdl.feature_importances_

    paired = sorted(zip(fc, imp.tolist()), key=lambda x: x[1], reverse=True)[:top_n]
    return {
        "features":    [p[0] for p in paired],
        "importances": [round(p[1], 6) for p in paired],
        "total_features": len(fc),
    }


# ── Income vs score scatter ───────────────────────────────────────

@router.get(
    "/income-vs-score",
    summary="Income vs credit score scatter data",
    description="Sampled scatter plot data for income vs credit score. Colour by risk band.",
)
def income_vs_score(
    sample:    int           = Query(2000, ge=100, le=10000),
    user_type: Optional[str] = Query(None),
):
    df = _filtered(user_type, None)
    if len(df) > sample:
        df = df.sample(sample, random_state=42)

    df = df[df["monthly_avg_income"].notna() & df["credit_score"].notna()]
    return {
        "points": [
            {
                "x":         round(float(r["monthly_avg_income"]), 2),
                "y":         int(r["credit_score"]),
                "band":      str(r["risk_band"]),
                "color":     BAND_COLORS.get(str(r["risk_band"]), "#6b7280"),
                "user_type": str(r["user_type"]),
            }
            for _, r in df.iterrows()
        ]
    }


# ── Score by vintage ──────────────────────────────────────────────

@router.get(
    "/vintage-score",
    summary="Account vintage vs credit score",
    description="Average score bucketed by account age (months). Radar/bar chart.",
)
def vintage_score():
    df = ModelStore.get_all_users().copy()
    df = df[df["account_vintage_months"].notna()]
    df["vintage_grp"] = pd.cut(
        df["account_vintage_months"].astype(int),
        bins=[0, 12, 24, 48, 72, 120, 180, 240],
        labels=["0-1yr", "1-2yr", "2-4yr", "4-6yr", "6-10yr", "10-15yr", "15yr+"],
    )
    grp = df.groupby("vintage_grp", observed=True)["credit_score"].agg(["mean", "count"]).reset_index()
    return {
        "labels":     grp["vintage_grp"].astype(str).tolist(),
        "avg_scores": [round(float(v), 1) for v in grp["mean"]],
        "counts":     grp["count"].tolist(),
    }


# ── EMI bounce impact ─────────────────────────────────────────────

@router.get(
    "/emi-bounce-impact",
    summary="EMI bounce count vs avg credit score",
    description="Shows how EMI bounces drag down credit score. Good for line chart.",
)
def emi_bounce_impact():
    df = ModelStore.get_all_users().copy()
    df = df[df["emi_bounce_count"].notna()]
    grp = df.groupby("emi_bounce_count")["credit_score"].agg(["mean", "count"]).reset_index()
    grp = grp[grp["count"] >= 10]  # filter thin groups
    return {
        "bounce_counts": grp["emi_bounce_count"].astype(int).tolist(),
        "avg_scores":    [round(float(v), 1) for v in grp["mean"]],
        "user_counts":   grp["count"].tolist(),
    }


# ── Savings rate vs score ─────────────────────────────────────────

@router.get(
    "/savings-score-correlation",
    summary="Net savings rate vs credit score",
    description="Binned savings rate vs avg score. Scatter trend line data.",
)
def savings_vs_score():
    df = ModelStore.get_all_users().copy()
    df = df[df["net_savings_rate"].notna()]
    df["sav_bin"] = pd.cut(df["net_savings_rate"], bins=20)
    grp = df.groupby("sav_bin", observed=True)["credit_score"].agg(["mean", "count"]).reset_index()
    return {
        "bins":       [str(b) for b in grp["sav_bin"]],
        "avg_scores": [round(float(v), 1) for v in grp["mean"]],
        "counts":     grp["count"].tolist(),
    }


# ── Score percentile table ────────────────────────────────────────

@router.get(
    "/percentile-table",
    summary="Score-to-percentile mapping",
    description="Full percentile table for credit scores. Useful for gauge charts.",
)
def percentile_table():
    df     = ModelStore.get_all_users()
    scores = df["credit_score"].values
    pcts   = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99]
    return {
        "percentiles": {
            str(p): int(np.percentile(scores, p)) for p in pcts
        }
    }


# ── Spend category breakdown ──────────────────────────────────────

@router.get(
    "/spend-breakdown",
    summary="Average spend ratios across categories",
    description="Average spend ratios for grocery, utility, entertainment, shopping, ATM. Radar chart.",
)
def spend_breakdown(user_type: Optional[str] = Query(None)):
    df = _filtered(user_type, None)
    cols = [
        "grocery_spend_ratio",
        "utility_spend_ratio",
        "entertainment_spend_ratio",
        "online_shopping_ratio",
        "atm_withdrawal_ratio",
    ]
    labels = ["Grocery", "Utility", "Entertainment", "Online Shopping", "ATM"]
    result = {}
    for band in ["A", "B", "C", "D"]:
        grp = df[df["risk_band"] == band]
        if len(grp) == 0:
            continue
        result[band] = {
            "values": [round(float(grp[c].mean()), 4) if c in grp.columns else 0 for c in cols],
            "color":  BAND_COLORS[band],
        }
    return {"labels": labels, "band_data": result}


# ── KYC completeness ──────────────────────────────────────────────

@router.get(
    "/kyc-score-impact",
    summary="KYC completeness score vs credit score",
    description="Binned KYC score vs avg credit score. Bar chart.",
)
def kyc_score_impact():
    df = ModelStore.get_all_users().copy()
    df = df[df["kyc_completeness_score"].notna()]
    df["kyc_bin"] = pd.cut(
        df["kyc_completeness_score"],
        bins=[0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        labels=["0.5-0.6", "0.6-0.7", "0.7-0.8", "0.8-0.9", "0.9-1.0"],
    )
    grp = df.groupby("kyc_bin", observed=True)["credit_score"].agg(["mean", "count"]).reset_index()
    return {
        "bins":       [str(b) for b in grp["kyc_bin"]],
        "avg_scores": [round(float(v), 1) for v in grp["mean"]],
        "counts":     grp["count"].tolist(),
    }


# ── helper ────────────────────────────────────────────────────────

def _filtered(user_type: Optional[str], risk_band: Optional[str]) -> pd.DataFrame:
    df = ModelStore.get_all_users()
    if user_type: df = df[df["user_type"] == user_type]
    if risk_band: df = df[df["risk_band"] == risk_band.upper()]
    return df
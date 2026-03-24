"""
routers/users.py
User data endpoints — list, search, filter, detail, feature explorer.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import numpy as np
import pandas as pd
import math

from core.model_loader import ModelStore
from core.schemas import UserSummary, UserDetail, UserListResponse

router = APIRouter()

BAND_COLORS = {"A": "#22c55e", "B": "#3b82f6", "C": "#f59e0b", "D": "#ef4444"}


def _row_to_summary(r) -> dict:
    return {
        "user_id":              int(r["user_id"]),
        "user_type":            str(r["user_type"]),
        "credit_score":         int(r["credit_score"]),
        "risk_band":            str(r["risk_band"]),
        "band_color":           BAND_COLORS.get(str(r["risk_band"]), "#6b7280"),
        "age":                  int(r["age"])              if not _isnan(r.get("age"))              else None,
        "monthly_avg_income":   float(r["monthly_avg_income"]) if not _isnan(r.get("monthly_avg_income")) else None,
        "account_vintage_months": int(r["account_vintage_months"]) if not _isnan(r.get("account_vintage_months")) else None,
    }


def _isnan(v):
    try:
        return math.isnan(float(v))
    except (TypeError, ValueError):
        return True


@router.get(
    "/",
    summary="List all users (paginated)",
    description="Browse all 1 lakh users with pagination, filtering and sorting.",
)
def list_users(
    page:       int   = Query(1, ge=1),
    limit:      int   = Query(20, ge=1, le=200),
    user_type:  Optional[str] = Query(None, description="Filter by user type"),
    risk_band:  Optional[str] = Query(None, description="Filter by risk band: A/B/C/D"),
    min_score:  Optional[int] = Query(None, ge=300, le=900),
    max_score:  Optional[int] = Query(None, ge=300, le=900),
    sort_by:    str   = Query("credit_score", description="Sort field"),
    sort_dir:   str   = Query("desc", description="asc or desc"),
):
    df = ModelStore.get_all_users().copy()

    if user_type: df = df[df["user_type"] == user_type]
    if risk_band: df = df[df["risk_band"] == risk_band.upper()]
    if min_score: df = df[df["credit_score"] >= min_score]
    if max_score: df = df[df["credit_score"] <= max_score]

    if sort_by in df.columns:
        df = df.sort_values(sort_by, ascending=(sort_dir == "asc"))

    total  = len(df)
    offset = (page - 1) * limit
    chunk  = df.iloc[offset: offset + limit]

    return {
        "total":   total,
        "page":    page,
        "limit":   limit,
        "pages":   math.ceil(total / limit),
        "results": [_row_to_summary(r) for _, r in chunk.iterrows()],
    }


@router.get(
    "/search",
    summary="Search users by user_id",
    description="Exact match on user_id or prefix search.",
)
def search_users(
    q:     str = Query(..., description="user_id to search"),
    limit: int = Query(10, ge=1, le=50),
):
    df = ModelStore.get_all_users()
    try:
        uid = int(q)
        result = df[df["user_id"] == uid]
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id must be an integer")

    return {
        "query":   q,
        "total":   len(result),
        "results": [_row_to_summary(r) for _, r in result.head(limit).iterrows()],
    }


@router.get(
    "/{user_id}",
    summary="Get full user detail",
    description="All 60+ features + score + metadata for a single user.",
)
def get_user(user_id: int):
    df  = ModelStore.get_all_users()
    row = df[df["user_id"] == user_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    r        = row.iloc[0]
    summary  = _row_to_summary(r)
    fc       = ModelStore.feat_cols

    # Build feature dict grouped by category
    features_raw = {
        col: (float(r[col]) if not _isnan(r.get(col)) else None)
        for col in fc if col in r.index
    }

    # Group features
    feature_groups = _group_features(features_raw, fc)

    return {
        **summary,
        "features_raw":    features_raw,
        "feature_groups":  feature_groups,
        "total_features":  len(fc),
        "missing_features": [c for c in fc if _isnan(r.get(c))],
    }


@router.get(
    "/{user_id}/score-breakdown",
    summary="Score dimension breakdown for a user",
    description="Returns detailed dimension-level scores and contributing factors.",
)
def get_score_breakdown(user_id: int):
    from core.scorer import score_user
    df  = ModelStore.get_all_users()
    row = df[df["user_id"] == user_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    r         = row.iloc[0]
    fc        = ModelStore.feat_cols
    user_type = str(r["user_type"])
    feat_dict = {c: float(r[c]) for c in fc if c in r.index and not _isnan(r.get(c))}

    result = score_user(feat_dict, user_type)
    result["user_id"]   = user_id
    result["user_type"] = user_type
    return result


@router.get(
    "/{user_id}/compare/{other_id}",
    summary="Compare two users side-by-side",
    description="Returns feature and score comparison between two user IDs.",
)
def compare_users(user_id: int, other_id: int):
    df = ModelStore.get_all_users()
    fc = ModelStore.feat_cols

    r1 = df[df["user_id"] == user_id]
    r2 = df[df["user_id"] == other_id]
    if r1.empty: raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    if r2.empty: raise HTTPException(status_code=404, detail=f"User {other_id} not found")

    r1, r2 = r1.iloc[0], r2.iloc[0]

    comparison = {}
    for col in fc:
        v1 = float(r1[col]) if col in r1.index and not _isnan(r1.get(col)) else None
        v2 = float(r2[col]) if col in r2.index and not _isnan(r2.get(col)) else None
        if v1 is not None and v2 is not None:
            diff = round(v2 - v1, 4)
        else:
            diff = None
        comparison[col] = {"user_a": v1, "user_b": v2, "diff": diff}

    return {
        "user_a": _row_to_summary(r1),
        "user_b": _row_to_summary(r2),
        "feature_comparison": comparison,
        "score_diff": int(r2["credit_score"]) - int(r1["credit_score"]),
    }


@router.get(
    "/{user_id}/neighbors",
    summary="Find similar users (by score)",
    description="Returns users with closest credit scores to the given user.",
)
def get_neighbors(user_id: int, n: int = Query(5, ge=1, le=20)):
    df  = ModelStore.get_all_users()
    row = df[df["user_id"] == user_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    score = int(row.iloc[0]["credit_score"])
    others = df[df["user_id"] != user_id].copy()
    others["_dist"] = (others["credit_score"] - score).abs()
    nearest = others.nsmallest(n, "_dist")

    return {
        "user_id":   user_id,
        "score":     score,
        "neighbors": [_row_to_summary(r) for _, r in nearest.iterrows()],
    }


# ── helpers ──────────────────────────────────────────────────────

def _group_features(features: dict, fc: list) -> dict:
    groups = {
        "income":   {},
        "balance":  {},
        "spending": {},
        "emi":      {},
        "bills":    {},
        "savings":  {},
        "digital":  {},
        "bnpl":     {},
        "business": {},
        "profile":  {},
    }
    tag_map = {
        "income":   ["income", "salary", "inflow", "annual", "secondary"],
        "balance":  ["balance", "negative", "breach"],
        "spending": ["spend", "debit", "grocery", "atm", "shopping", "entertainment", "upi", "weekend"],
        "emi":      ["emi", "nach", "loan", "bounce"],
        "bills":    ["bill", "electricity", "mobile", "broadband", "utility", "insurance", "standing", "cheque"],
        "savings":  ["saving", "rd_fd", "sweep", "investment", "net_sav"],
        "digital":  ["netbanking", "app_sess", "autopay", "debit_card"],
        "bnpl":     ["bnpl"],
        "business": ["business", "pos_txn", "gst", "trade", "receivables"],
        "profile":  ["age", "vintage", "kyc", "co_applicant", "relationship", "history"],
    }
    for col, val in features.items():
        placed = False
        for grp, tags in tag_map.items():
            if any(t in col for t in tags):
                groups[grp][col] = val
                placed = True
                break
        if not placed:
            groups["profile"][col] = val
    return groups
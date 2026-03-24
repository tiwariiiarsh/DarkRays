"""
core/scorer.py
Central scoring engine — GMM imputation → XGBoost → structured result.
Mirrors the score_new_user() function from the notebook exactly.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from core.model_loader import ModelStore


BAND_LABELS = {
    "A": "Excellent",
    "B": "Good",
    "C": "Fair",
    "D": "Poor",
}

DECISION_MAP = {
    "A": "AUTO_APPROVE",
    "B": "APPROVE_LOWER_LIMIT",
    "C": "MANUAL_REVIEW",
    "D": "REJECT",
}

DECISION_COLOR = {
    "AUTO_APPROVE":         "green",
    "APPROVE_LOWER_LIMIT":  "blue",
    "MANUAL_REVIEW":        "orange",
    "REJECT":               "red",
}


def score_user(feat_dict: Dict[str, Any], user_type: str) -> Dict[str, Any]:
    """
    Score a single user.

    Parameters
    ----------
    feat_dict : dict  — raw feature values (missing values = None / absent)
    user_type : str   — one of salaried_private, salaried_govt, shopkeeper,
                        businessman, self_employed

    Returns
    -------
    Structured prediction dict ready for API response.
    """
    ms = ModelStore
    if not ms.is_loaded():
        raise RuntimeError("Models not loaded")

    fc  = ms.feat_cols
    sc  = ms.scaler
    gmm = ms.gmm
    mdl = ms.xgb_model
    le  = ms.label_encoder
    szc = ms.structural_zero_cols

    # ── Build feature vector ─────────────────────────────────────
    row  = np.array([feat_dict.get(c, np.nan) for c in fc], dtype=float)
    mask = np.isnan(row)
    mi   = np.where(mask)[0]
    oi   = np.where(~mask)[0]
    imputed_features = [fc[i] for i in mi]

    # ── GMM imputation ───────────────────────────────────────────
    if len(mi) > 0:
        mu_s = gmm.means_
        mu_o = sc.inverse_transform(gmm.means_)
        cv   = gmm.covariances_
        lw   = np.log(gmm.weights_ + 1e-10)
        K    = gmm.n_components

        if len(oi) == 0:
            probs = np.exp(lw - lw.max())
            probs /= probs.sum()
        else:
            tmp = row.copy()
            tmp[mi] = mu_o[:, mi].mean(axis=0)
            ts = sc.transform(tmp.reshape(1, -1))[0]
            lp = lw.copy()
            for k in range(K):
                d  = ts[oi] - mu_s[k, oi]
                v  = cv[k, oi] + 1e-6
                lp[k] += -0.5 * np.sum(d ** 2 / v + np.log(2 * np.pi * v))
            lp -= lp.max()
            probs = np.exp(lp)
            probs /= probs.sum()

        row[mi] = probs @ mu_o[:, mi]

        # Enforce structural zeros for non-business users
        if user_type not in ["shopkeeper", "businessman"]:
            for col in szc:
                if col in fc:
                    row[fc.index(col)] = 0.0

    # ── XGBoost prediction ───────────────────────────────────────
    X = pd.DataFrame([dict(zip(fc, row))])
    X["user_type_enc"] = le.transform([user_type])
    X = X[fc + ["user_type_enc"]]

    raw   = float(mdl.predict(X)[0])
    score = int(np.clip(round(raw), 300, 900))
    band  = _to_band(score)

    # ── Dimension scores ─────────────────────────────────────────
    f = dict(zip(fc, row))

    def c(x):
        return float(np.clip(x, 0, 1))

    dims = {
        "Income Stability":    round(c(f.get("salary_day_consistency", 0) * 0.4
                                       + f.get("net_savings_rate", 0) * 0.3) * 100, 1),
        "Balance Behaviour":   round(c(1 - f.get("balance_utilisation_ratio", 0.5)) * 100, 1),
        "Spending Discipline": round(c(1 - f.get("spend_to_income_ratio", 0.7)) * 100, 1),
        "EMI Repayment":       round(c(f.get("emi_paid_ontime_ratio", 0.5)) * 100, 1),
        "Bill Payments":       round(c(f.get("utility_payment_consistency", 0.5)) * 100, 1),
        "Savings Rate":        round(c(f.get("net_savings_rate", 0) / 0.55 + 0.18) * 100, 1),
        "BNPL Behaviour":      round(c(f.get("bnpl_repayment_ratio", 0.8)) * 100, 1),
    }

    sorted_dims = sorted(dims.items(), key=lambda x: x[1], reverse=True)

    # ── Cluster membership ───────────────────────────────────────
    cp = gmm.predict_proba(sc.transform(row.reshape(1, -1)))[0]
    top_clusters = {
        f"Cluster_{i}": round(float(p), 4)
        for i, p in sorted(enumerate(cp), key=lambda x: x[1], reverse=True)[:5]
    }

    decision = DECISION_MAP[band]

    return {
        "credit_score":           score,
        "risk_band":              band,
        "risk_band_label":        BAND_LABELS[band],
        "loan_decision":          decision,
        "decision_color":         DECISION_COLOR[decision],
        "score_percentile":       _score_to_percentile(score),
        "dimension_scores":       dims,
        "top_positive_factors":   dict(sorted_dims[:3]),
        "top_negative_factors":   dict(sorted_dims[-3:]),
        "cluster_membership":     top_clusters,
        "imputed_features":       imputed_features,
        "imputed_count":          len(imputed_features),
        "features_provided":      len(oi),
        "completeness_pct":       round(len(oi) / len(fc) * 100, 1),
    }


def _to_band(score: int) -> str:
    if score >= 750: return "A"
    if score >= 650: return "B"
    if score >= 550: return "C"
    return "D"


def _score_to_percentile(score: int) -> float:
    """Approximate CIBIL-style percentile (300–900 range)."""
    return round(float(np.clip((score - 300) / 600 * 100, 0, 100)), 1)
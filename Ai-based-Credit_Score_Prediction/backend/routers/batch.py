"""
routers/batch.py
Batch prediction endpoints — JSON body + CSV file upload.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
import numpy as np
import pandas as pd
import io

from core.schemas import BatchPredictRequest, BatchPredictResponse
from core.scorer import score_user

router = APIRouter()


@router.post(
    "/predict",
    response_model=BatchPredictResponse,
    summary="Batch predict — JSON body",
    description="""
Score multiple users in one call.

Pass a list of `{user_id, user_type, features}` objects.
Returns individual predictions + portfolio summary.
Max 500 users per call.
    """,
)
def batch_predict(req: BatchPredictRequest):
    if len(req.users) > 500:
        raise HTTPException(status_code=400, detail="Max 500 users per batch call")

    results   = []
    band_cnts = {"A": 0, "B": 0, "C": 0, "D": 0}

    for item in req.users:
        try:
            feat = {k: v for k, v in item.features.items() if v is not None}
            out  = score_user(feat, item.user_type.value)
            band_cnts[out["risk_band"]] += 1
            results.append({
                "user_id":        item.user_id,
                "credit_score":   out["credit_score"],
                "risk_band":      out["risk_band"],
                "loan_decision":  out["loan_decision"],
                "score_percentile": out["score_percentile"],
                "imputed_count":  out["imputed_count"],
            })
        except Exception as e:
            results.append({
                "user_id":        item.user_id,
                "credit_score":   None,
                "risk_band":      None,
                "loan_decision":  "ERROR",
                "score_percentile": None,
                "imputed_count":  None,
                "error":          str(e),
            })

    valid_scores = [r["credit_score"] for r in results if r["credit_score"] is not None]

    return {
        "total":        len(results),
        "results":      results,
        "band_summary": band_cnts,
        "avg_score":    round(float(np.mean(valid_scores)), 1) if valid_scores else 0,
    }


@router.post(
    "/predict-csv",
    summary="Batch predict — CSV file upload",
    description="""
Upload a CSV file with columns matching the feature names.
**Required column:** `user_type`
**Optional columns:** any features from `/api/v1/predict/features`

Returns predictions as JSON.
    """,
)
async def batch_predict_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    if "user_type" not in df.columns:
        raise HTTPException(status_code=400, detail="CSV must have 'user_type' column")

    if len(df) > 1000:
        raise HTTPException(status_code=400, detail="Max 1000 rows per CSV upload")

    from core.model_loader import ModelStore
    fc      = ModelStore.feat_cols
    results = []
    band_cnts = {"A": 0, "B": 0, "C": 0, "D": 0}

    for _, row in df.iterrows():
        user_type = str(row.get("user_type", "salaried_private"))
        user_id   = str(row.get("user_id", "")) if "user_id" in df.columns else None
        feat = {}
        for c in fc:
            if c in row.index:
                v = row[c]
                try:
                    fv = float(v)
                    if not np.isnan(fv):
                        feat[c] = fv
                except (ValueError, TypeError):
                    pass
        try:
            out = score_user(feat, user_type)
            band_cnts[out["risk_band"]] += 1
            results.append({
                "user_id":        user_id,
                "credit_score":   out["credit_score"],
                "risk_band":      out["risk_band"],
                "loan_decision":  out["loan_decision"],
                "score_percentile": out["score_percentile"],
                "imputed_count":  out["imputed_count"],
            })
        except Exception as e:
            results.append({
                "user_id":       user_id,
                "credit_score":  None,
                "risk_band":     None,
                "loan_decision": "ERROR",
                "error":         str(e),
            })

    valid_scores = [r["credit_score"] for r in results if r["credit_score"] is not None]

    return {
        "filename":     file.filename,
        "total":        len(results),
        "results":      results,
        "band_summary": band_cnts,
        "avg_score":    round(float(np.mean(valid_scores)), 1) if valid_scores else 0,
    }


@router.get(
    "/test-predictions",
    summary="Run predictions on the 10k test set",
    description="Predict scores for the pre-built test.csv users and compare to ground truth.",
)
def test_set_predictions(sample: int = 100):
    from core.model_loader import ModelStore
    df_test = ModelStore.get_test_users()
    df_gt   = ModelStore.get_ground_truth()

    sample = min(sample, len(df_test), 500)
    df_s   = df_test.sample(sample, random_state=42)

    fc      = ModelStore.feat_cols
    results = []

    for _, row in df_s.iterrows():
        uid       = int(row["user_id"])
        user_type = str(row.get("user_type", "salaried_private"))
        feat = {}
        for c in fc:
            if c in row.index:
                try:
                    v = float(row[c])
                    if not np.isnan(v):
                        feat[c] = v
                except (ValueError, TypeError):
                    pass

        try:
            out = score_user(feat, user_type)
            gt_row = df_gt[df_gt["user_id"] == uid]
            actual_score = int(gt_row.iloc[0]["credit_score"]) if not gt_row.empty else None
            actual_band  = str(gt_row.iloc[0]["risk_band"])    if not gt_row.empty else None

            results.append({
                "user_id":       uid,
                "user_type":     user_type,
                "pred_score":    out["credit_score"],
                "pred_band":     out["risk_band"],
                "actual_score":  actual_score,
                "actual_band":   actual_band,
                "score_error":   abs(out["credit_score"] - actual_score) if actual_score else None,
                "band_correct":  out["risk_band"] == actual_band if actual_band else None,
                "loan_decision": out["loan_decision"],
            })
        except Exception as e:
            results.append({"user_id": uid, "error": str(e)})

    valid  = [r for r in results if "error" not in r and r["score_error"] is not None]
    mae    = round(float(np.mean([r["score_error"] for r in valid])), 2)     if valid else None
    ba     = round(float(np.mean([r["band_correct"] for r in valid])) * 100, 2) if valid else None

    return {
        "sample_size":  sample,
        "mae":          mae,
        "band_accuracy": ba,
        "results":      results,
    }
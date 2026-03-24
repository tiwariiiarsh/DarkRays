"""
routers/predict.py
Real-time credit scoring endpoints.
"""

from fastapi import APIRouter, HTTPException
from core.schemas import PredictRequest, PredictResponse
from core.scorer import score_user
from core.model_loader import ModelStore
import math

router = APIRouter()


# ────────────────────────────────────────────────────────────────
# 🔹 Predict new user (manual input)
# ────────────────────────────────────────────────────────────────
@router.post(
    "/score",
    response_model=PredictResponse,
    summary="Score a new user",
)
def predict_score(req: PredictRequest):
    try:
        result = score_user(
            feat_dict={k: v for k, v in req.features.items() if v is not None},
            user_type=req.user_type.value,
        )
        return result

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    except Exception as e:
        print("🔥 Prediction Error:", e)
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")


# ────────────────────────────────────────────────────────────────
# 🔹 Predict using existing user_id (FROM test.csv)
# ────────────────────────────────────────────────────────────────
@router.get(
    "/user/{user_id}",
    response_model=PredictResponse,
    summary="Re-score dataset user (from test.csv)",
)
def rescore_existing_user(user_id: int):
    try:
        # 🔥 Load TEST dataset
        df = ModelStore.get_test_users()

        # 🔍 Find user
        row = df[df["user_id"] == user_id]
        if row.empty:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")

        r = row.iloc[0]

        # 🧠 Extract user type
        user_type = str(r["user_type"])

        # 📊 Feature columns
        fc = ModelStore.feat_cols

        # 🔥 SAFE FEATURE EXTRACTION
        feat_dict = {}

        for c in fc:
            if c in r.index:
                try:
                    v = float(r[c])
                    if not math.isnan(v):
                        feat_dict[c] = v
                except:
                    # skip invalid values
                    pass

        # 🧪 DEBUG LOGS
        print("===================================")
        print("USER ID:", user_id)
        print("USER TYPE:", user_type)
        print("FEATURE COUNT:", len(feat_dict))
        print("===================================")

        # 🚀 Run model
        result = score_user(feat_dict, user_type)

        return result

    except HTTPException:
        raise

    except Exception as e:
        print("🔥 ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ────────────────────────────────────────────────────────────────
# 🔹 List features
# ────────────────────────────────────────────────────────────────
@router.get(
    "/features",
    summary="List all available feature names",
)
def list_features():
    if not ModelStore.is_loaded():
        raise HTTPException(status_code=503, detail="Models not loaded")

    return {
        "total_features": len(ModelStore.feat_cols),
        "features": ModelStore.feat_cols,
        "structural_zero_cols": ModelStore.structural_zero_cols,
        "feature_groups": {
            "income":   [f for f in ModelStore.feat_cols if any(k in f for k in ["income", "salary", "inflow", "annual"])],
            "balance":  [f for f in ModelStore.feat_cols if any(k in f for k in ["balance", "negative", "breach"])],
            "spending": [f for f in ModelStore.feat_cols if any(k in f for k in ["spend", "debit", "grocery", "atm", "shopping", "entertainment", "upi"])],
            "emi":      [f for f in ModelStore.feat_cols if any(k in f for k in ["emi", "nach", "loan", "bounce"])],
            "bills":    [f for f in ModelStore.feat_cols if any(k in f for k in ["bill", "electricity", "mobile", "broadband", "utility", "insurance", "standing"])],
            "savings":  [f for f in ModelStore.feat_cols if any(k in f for k in ["saving", "rd_fd", "sweep", "investment", "net_sav"])],
            "digital":  [f for f in ModelStore.feat_cols if any(k in f for k in ["netbanking", "app_sess", "autopay", "debit_card"])],
            "bnpl":     [f for f in ModelStore.feat_cols if "bnpl" in f],
            "business": [f for f in ModelStore.feat_cols if any(k in f for k in ["business", "pos_txn", "gst", "trade", "receivables"])],
            "profile":  [f for f in ModelStore.feat_cols if any(k in f for k in ["age", "vintage", "kyc", "co_applicant", "relationship", "history"])],
        }
    }
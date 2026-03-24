"""
core/model_loader.py
Singleton that loads all trained artefacts once at startup.
"""

import joblib, json, os
import numpy as np
import pandas as pd
from pathlib import Path

# MODELS_DIR = Path(os.getenv("DARCRAYS_MODELS_DIR", "models"))
# DATA_DIR   = Path(os.getenv("DARCRAYS_DATA_DIR",   "data"))

# from pathlib import Path
# import os

BASE_DIR = Path(__file__).resolve().parent.parent

MODELS_DIR = BASE_DIR / "models"
DATA_DIR   = BASE_DIR / "data"


class ModelStore:
    scaler        = None
    gmm           = None
    xgb_model     = None
    label_encoder = None
    feat_cols     = None
    structural_zero_cols = None

    # Dataset references (loaded lazily for speed)
    _df_all  = None
    _df_test = None
    _df_gt   = None

    @classmethod
    def load(cls):
        cls.scaler               = joblib.load(MODELS_DIR / "scaler.pkl")
        cls.gmm                  = joblib.load(MODELS_DIR / "gmm_model.pkl")
        cls.xgb_model            = joblib.load(MODELS_DIR / "xgb_model.pkl")
        cls.label_encoder        = joblib.load(MODELS_DIR / "label_encoder.pkl")
        cls.feat_cols            = joblib.load(MODELS_DIR / "feature_cols.pkl")
        cls.structural_zero_cols = joblib.load(MODELS_DIR / "structural_zero_cols.pkl")

    @classmethod
    def is_loaded(cls):
        return cls.xgb_model is not None

    # ── Lazy data loaders ────────────────────────────────────────
    @classmethod
    def get_all_users(cls) -> pd.DataFrame:
        if cls._df_all is None:
            cls._df_all = pd.read_csv(DATA_DIR / "all_users.csv")
        return cls._df_all

    @classmethod
    def get_test_users(cls) -> pd.DataFrame:
        if cls._df_test is None:
            cls._df_test = pd.read_csv(DATA_DIR / "test.csv")
        return cls._df_test

    @classmethod
    def get_ground_truth(cls) -> pd.DataFrame:
        if cls._df_gt is None:
            cls._df_gt = pd.read_csv(DATA_DIR / "all_users_ground_truth.csv")
        return cls._df_gt
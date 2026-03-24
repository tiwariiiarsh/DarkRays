"""
=====================================================================
DARCRAYS — FastAPI Backend
=====================================================================
Full REST API for the DARCRAYS Credit Scoring System.
Serves predictions, user data, analytics and charts for the UI.
=====================================================================
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn

from routers import predict, users, analytics, dashboard, batch
from core.model_loader import ModelStore

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all models on startup
    print("🚀 Loading DARCRAYS models...")
    ModelStore.load()
    print("✅ Models ready")
    yield
    print("👋 DARCRAYS shutting down")

app = FastAPI(
    title="DARCRAYS — AI Credit Scoring API",
    description="""
## 🏦 DARCRAYS — Alternate Credit Scoring Engine

AI-powered credit scoring using **GMM imputation + XGBoost** on bank transaction data.

### Features
- 🎯 Real-time credit score prediction (300–900)
- 👥 User lookup & feature explorer
- 📊 Portfolio analytics & risk distribution
- 📈 Score trend charts
- 🔬 SHAP-style factor breakdown
- 🗂️ Batch prediction (CSV upload)
    """,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ────────────────────────────────────────────────
app.include_router(predict.router,   prefix="/api/v1/predict",   tags=["🎯 Predict"])
app.include_router(users.router,     prefix="/api/v1/users",     tags=["👥 Users"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["📊 Analytics"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["🏠 Dashboard"])
app.include_router(batch.router,     prefix="/api/v1/batch",     tags=["🗂️ Batch"])

@app.get("/", tags=["Health"])
def root():
    return {
        "project": "DARCRAYS",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
    }

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "models_loaded": ModelStore.is_loaded(),
        "feature_count": len(ModelStore.feat_cols) if ModelStore.is_loaded() else 0,
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
"""Main module - FastAPI server exposing admin reports as JSON and PNG charts."""
import os

from fastapi import Depends, FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import reports
import charts
import qr
from auth import require_admin

load_dotenv()

app = FastAPI(title="DragCanvas Admin Reports")

# Only our own frontends may call this service. It used to allow every origin,
# which combined with no authentication meant anyone could read the statistics.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://dragcanvasapp.netlify.app",
]
if os.getenv("FRONTEND_URL"):
    ALLOWED_ORIGINS.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["Authorization", "Content-Type"],
)


# ---------- JSON endpoints (tables) ----------

@app.get("/api/stats/summary", dependencies=[Depends(require_admin)])
def get_summary():
    return reports.summary_stats()


@app.get("/api/stats/registrations", dependencies=[Depends(require_admin)])
def get_registrations():
    return reports.registrations_by_month().to_dict(orient="records")


@app.get("/api/stats/projects-per-user", dependencies=[Depends(require_admin)])
def get_projects_per_user():
    return reports.projects_per_user().to_dict(orient="records")


@app.get("/api/stats/published", dependencies=[Depends(require_admin)])
def get_published():
    return reports.published_vs_draft().to_dict(orient="records")


@app.get("/api/stats/actions", dependencies=[Depends(require_admin)])
def get_actions():
    return reports.actions_breakdown().to_dict(orient="records")


# ---------- PNG endpoints (charts) ----------

@app.get("/api/charts/registrations", dependencies=[Depends(require_admin)])
def chart_registrations():
    return StreamingResponse(charts.registrations_chart(), media_type="image/png")


@app.get("/api/charts/projects-per-user", dependencies=[Depends(require_admin)])
def chart_projects_per_user():
    return StreamingResponse(charts.projects_per_user_chart(),
media_type="image/png")


@app.get("/api/charts/published", dependencies=[Depends(require_admin)])
def chart_published():
    return StreamingResponse(charts.published_pie_chart(), media_type="image/png")


@app.get("/api/charts/actions", dependencies=[Depends(require_admin)])
def chart_actions():
    return StreamingResponse(charts.actions_chart(), media_type="image/png")


@app.get("/api/charts/project-sizes", dependencies=[Depends(require_admin)])
def chart_project_sizes():
    return StreamingResponse(charts.project_sizes_chart(), media_type="image/png")


# ---------- QR code ----------

@app.get("/api/qr")
def get_qr(url: str):
    return StreamingResponse(qr.generate_qr(url), media_type="image/png")

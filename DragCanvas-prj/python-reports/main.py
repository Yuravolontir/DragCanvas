"""Main module - FastAPI server exposing admin reports as JSON and PNG charts."""
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import reports
import charts

app = FastAPI(title="DragCanvas Admin Reports")

# Allow the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- JSON endpoints (tables) ----------

@app.get("/api/stats/summary")
def get_summary():
    return reports.summary_stats()


@app.get("/api/stats/registrations")
def get_registrations():
    return reports.registrations_by_month().to_dict(orient="records")


@app.get("/api/stats/projects-per-user")
def get_projects_per_user():
    return reports.projects_per_user().to_dict(orient="records")


@app.get("/api/stats/published")
def get_published():
    return reports.published_vs_draft().to_dict(orient="records")


@app.get("/api/stats/actions")
def get_actions():
    return reports.actions_breakdown().to_dict(orient="records")


# ---------- PNG endpoints (charts) ----------

@app.get("/api/charts/registrations")
def chart_registrations():
    return StreamingResponse(charts.registrations_chart(), media_type="image/png")


@app.get("/api/charts/projects-per-user")
def chart_projects_per_user():
    return StreamingResponse(charts.projects_per_user_chart(),
media_type="image/png")


@app.get("/api/charts/published")
def chart_published():
    return StreamingResponse(charts.published_pie_chart(), media_type="image/png")


@app.get("/api/charts/actions")
def chart_actions():
    return StreamingResponse(charts.actions_chart(), media_type="image/png")


@app.get("/api/charts/project-sizes")
def chart_project_sizes():
    return StreamingResponse(charts.project_sizes_chart(), media_type="image/png")

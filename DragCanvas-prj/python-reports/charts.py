"""Charts module - renders report data as PNG images with matplotlib."""
import io
import matplotlib
matplotlib.use("Agg")  # render without a GUI window (needed for server use)
import matplotlib.pyplot as plt
import reports


def figure_to_png(fig):
    """Convert a matplotlib figure to PNG bytes (in-memory, no file)."""
    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight", dpi=120)
    plt.close(fig)
    buffer.seek(0)
    return buffer


def registrations_chart():
    """Bar chart: user registrations per month."""
    df = reports.registrations_by_month()
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(df["month"], df["registrations"], color="#4e79a7")
    ax.set_title("User Registrations by Month")
    ax.set_xlabel("Month")
    ax.set_ylabel("Registrations")
    return figure_to_png(fig)


def projects_per_user_chart():
    """Horizontal bar chart: top 10 users by project count."""
    df = reports.projects_per_user()
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.barh(df["UserName"], df["project_count"], color="#59a14f")
    ax.set_title("Projects per User (Top 10)")
    ax.set_xlabel("Projects")
    ax.invert_yaxis()  # biggest on top
    return figure_to_png(fig)


def published_pie_chart():
    """Pie chart: published projects vs drafts."""
    df = reports.published_vs_draft()
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.pie(df["total"], labels=df["status"], autopct="%1.0f%%",
            colors=["#59a14f", "#e15759"], startangle=90)
    ax.set_title("Published vs Draft Projects")
    return figure_to_png(fig)


def actions_chart():
    """Bar chart: audit log actions by type."""
    df = reports.actions_breakdown()
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(df["ActionType"], df["total"], color="#f28e2b")
    ax.set_title("Audit Log - Actions by Type")
    ax.set_ylabel("Count")
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    return figure_to_png(fig)


def project_sizes_chart():
    """Histogram: distribution of project sizes in KB."""
    df = reports.project_sizes()
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.hist(df["ProjectSizeKB"], bins=10, color="#76b7b2", edgecolor="white")
    ax.set_title("Project Size Distribution")
    ax.set_xlabel("Size (KB)")
    ax.set_ylabel("Projects")
    return figure_to_png(fig)


if __name__ == "__main__":
    # Test: save every chart as a PNG file
    chart_functions = {
        "registrations.png": registrations_chart,
        "projects_per_user.png": projects_per_user_chart,
        "published_pie.png": published_pie_chart,
        "actions.png": actions_chart,
        "project_sizes.png": project_sizes_chart,
    }
    for filename, chart_function in chart_functions.items():
        png = chart_function()
        with open(filename, "wb") as f:
            f.write(png.read())
        print("Saved", filename)
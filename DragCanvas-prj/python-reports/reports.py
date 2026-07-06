"""Reports module - statistical reports built with pandas."""
import pandas as pd
from db import fetch_all


def query_dataframe(query):
    """Run a query and return the result as a pandas DataFrame."""
    column_names, rows = fetch_all(query)
    return pd.DataFrame(rows, columns=column_names)


def registrations_by_month():
    """Report 1: how many users registered each month."""
    df = query_dataframe('SELECT "CreatedDate" FROM "TBUsers"')
    df["month"] = pd.to_datetime(df["CreatedDate"]).dt.to_period("M").astype(str)
    return df.groupby("month").size().reset_index(name="registrations")


def projects_per_user():
    """Report 2: number of projects for each user (top 10)."""
    df = query_dataframe('''
        SELECT u."UserName", COUNT(p."Project_ID") AS project_count
        FROM "TBUsers" u
        LEFT JOIN "TBProjects" p ON p."User_ID" = u."User_ID" AND p."IsDeleted" = false
        GROUP BY u."UserName"
        ORDER BY project_count DESC
        LIMIT 10
    ''')
    return df


def published_vs_draft():
    """Report 3: published projects vs drafts."""
    df = query_dataframe('''
        SELECT "IsPublished", COUNT(*) AS total
        FROM "TBProjects"
        WHERE "IsDeleted" = false
        GROUP BY "IsPublished"
    ''')
    # dictionary: map boolean to a readable label
    labels = {True: "Published", False: "Draft"}
    df["status"] = df["IsPublished"].map(labels)
    return df[["status", "total"]]


def actions_breakdown():
    """Report 4: audit log actions by type."""
    df = query_dataframe('''
        SELECT "ActionType", COUNT(*) AS total
        FROM "TBAuditLog"
        GROUP BY "ActionType"
        ORDER BY total DESC
    ''')
    return df


def project_sizes():
    """Report 5: project size distribution in KB."""
    df = query_dataframe('SELECT "ProjectSizeKB" FROM "TBProjects" WHERE "IsDeleted" = false')
    return df


def summary_stats():
    """General summary: totals for the dashboard (returns a dictionary)."""
    users_df = query_dataframe('SELECT "User_ID", "IsActive" FROM "TBUsers"')
    projects_df = query_dataframe('SELECT "Project_ID", "User_ID", "IsPublished" FROM "TBProjects" WHERE "IsDeleted" = false')

    # set: unique users that own at least one project
    users_with_projects = set(projects_df["User_ID"].tolist())

    # dictionary: key summary numbers
    summary = {
        "total_users": len(users_df),
        "active_users": int(users_df["IsActive"].sum()),
        "total_projects": len(projects_df),
        "published_projects": int(projects_df["IsPublished"].sum()),
        "users_with_projects": len(users_with_projects),
    }
    return summary


if __name__ == "__main__":
    print("=== Summary ===")
    print(summary_stats())
    print("\n=== Registrations by month ===")
    print(registrations_by_month())
    print("\n=== Projects per user ===")
    print(projects_per_user())
    print("\n=== Published vs Draft ===")
    print(published_vs_draft())
    print("\n=== Actions breakdown ===")
    print(actions_breakdown())
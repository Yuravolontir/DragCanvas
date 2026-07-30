"""Database module - connection to Supabase PostgreSQL."""
import os
import psycopg2  # Postgres driver
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    """Create and return a new database connection."""
    return psycopg2.connect(DATABASE_URL)


def fetch_all(query, params=None):
    """Run a SELECT query and return all rows as a list of tuples."""
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        # list comprehension: collect column names from cursor metadata
        column_names = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        return column_names, rows
    finally:
        connection.close()


if __name__ == "__main__":
    # Quick connection test
    columns, users = fetch_all('SELECT "User_ID", "UserName", "UserEmail" FROM "TBUsers" LIMIT 5')
    print("Columns:", columns)
    for user in users:
        print(user)

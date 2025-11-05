"""Main FastAPI application module."""
from fastapi import FastAPI
import psycopg2

app = FastAPI()


@app.get("/")
def read_root():
    """
    Root endpoint returning a welcome message.
    """
    return {"message": "Welcome to wealth Management App"}


@app.get("/health/db")
def check_db():
    """Check database connection."""
    try:
        conn = psycopg2.connect(
            host="db",
            database="wealth_db",
            user="postgres",
            password="examplepassword"
        )
        conn.close()
        return {"status": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

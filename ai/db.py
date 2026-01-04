import os
import psycopg2
import psycopg2.extras

DB_URL = os.getenv("GCZ_DB")
if not DB_URL:
    raise RuntimeError("GCZ_DB not set")

def get_conn():
    return psycopg2.connect(DB_URL, sslmode="require")

def fetchone(query, params=None):
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, params or ())
        return cur.fetchone()

def fetchall(query, params=None):
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, params or ())
        return cur.fetchall()

def execute(query, params=None):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(query, params or ())
        conn.commit()
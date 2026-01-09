import psycopg2, glob, os

dsn = os.getenv("AI_DB")
files = sorted(glob.glob(os.path.join(os.path.dirname(__file__), "*.sql")))

with psycopg2.connect(dsn) as conn:
    with conn.cursor() as cur:
        for f in files:
            with open(f) as sql:
                print(f"Running {f}")
                cur.execute(sql.read())

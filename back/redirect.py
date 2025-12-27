from flask import Flask, redirect
import csv
import os

app = Flask(__name__)
csv_path = os.getenv("AFFILIATESCSVPATH", "/var/www/html/gcz/master_affiliates.csv")
cache = {}

def load_affiliates():
    global cache
    cache.clear()
    try:
        with open(csv_path, newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sitename = row["name"].strip().lower()
                cache[sitename] = row["affiliate_url"]
    except Exception as e:
        print("Failed to load affiliates:", e)

@app.route("/affiliates/redirect/<sitename>")
def redirect_affiliate(sitename):
    sitename = sitename.strip().lower()
    if not cache:
        load_affiliates()
    url = cache.get(sitename)
    if url:
        print(f"Redirecting {sitename} -> {url}")
        return redirect(url)
    return redirect("https://gamblecodez.com")  # fallback

if __name__ == "__main__":
    load_affiliates()
    app.run(host="0.0.0.0", port=8080)


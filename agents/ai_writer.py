import os
import requests

CURSOR_API_KEY = os.environ.get("CURSOR_API_KEY")

def write_code_for_task(file_path):
    if not CURSOR_API_KEY:
        return "❌ CURSOR_API_KEY not set. Skipping."

    prompt = f"Write missing or incomplete code for the file: {file_path}. Scan for TODOs or fixmes and complete them."
    headers = {
        "Authorization": f"Bearer {CURSOR_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            "https://api.cursor.sh/v1/chat/completions",
            headers=headers,
            json={
                "model": "sonar-medium",
                "messages": [
                    {"role": "system", "content": "You are a senior full-stack engineer."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4
            }
        )

        result = response.json()
        code = result["choices"][0]["message"]["content"]
        return f"# Cursor API fix for {file_path}\n{code}\n"

    except Exception as e:
        return f"❌ Error using Cursor API: {e}"

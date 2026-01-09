#!/usr/bin/env python3
import os
import sys
from anthropic import Anthropic

# Load .env if exists
env_path = "/var/www/html/gcz/.env"
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, _, value = line.partition('=')
                os.environ.setdefault(key.strip(), value.strip().strip('"'))

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def chat(prompt):
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text

if __name__ == "__main__":
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
    else:
        prompt = sys.stdin.read()
    
    if not prompt.strip():
        print("Usage: cc 'your question' or echo 'question' | cc")
        sys.exit(1)
    
    print(chat(prompt))
from perplexity import Perplexity
import os

API_KEY = os.environ.get("PERPLEXITY_API_KEY")
client = Perplexity(api_key=API_KEY)

def ask_perplexity(prompt: str, model: str = "sonar-pro") -> str:
    completion = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}]
    )
    return completion.choices[0].message.content

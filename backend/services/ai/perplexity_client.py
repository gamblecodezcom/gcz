import os
from perplexity import Perplexity

# Initialize Perplexity client using environment variable
client = Perplexity(api_key=os.environ.get("PERPLEXITY_API_KEY"))

def sonar_pro(prompt: str):
    """
    Unified GCZ Sonar-Pro AI function.
    Call this from any backend route or service.
    """
    completion = client.chat.completions.create(
        model="sonar-pro",
        messages=[{"role": "user", "content": prompt}]
    )
    return completion.choices[0].message.content

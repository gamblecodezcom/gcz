import os
from perplexity import Perplexity

client = Perplexity(api_key=os.environ.get("PERPLEXITY_API_KEY"))

def sonar_pro(prompt: str):
    completion = client.chat.completions.create(
        model="sonar-pro",
        messages=[{"role": "user", "content": prompt}]
    )
    print(completion.choices[0].message.content)

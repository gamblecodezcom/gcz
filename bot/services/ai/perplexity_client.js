import fetch from "node-fetch";

export async function sonar(prompt) {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "No response";
}

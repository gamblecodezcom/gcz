export async function sonar(prompt) {
  const res = await fetch("/api/ai/sonar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  return data.answer;
}

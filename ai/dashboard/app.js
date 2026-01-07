const API = "http://127.0.0.1:8010";

async function api(path, options = {}) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error(`API ERROR ${path}:`, err);
    return { error: true, message: err.message };
  }
}

async function load() {
  render("memory", await api("/memory"));
  render("health", await api("/health"));
  render("anomalies", await api("/anomalies"));
}

function render(id, data) {
  const el = document.getElementById(id);

  if (!data || data.error) {
    el.innerHTML = `<div class="card error">⚠ API Offline</div>`;
    return;
  }

  if (Array.isArray(data)) {
    el.innerHTML = data
      .map(r => `<div class="card">${escape(JSON.stringify(r, null, 2))}</div>`)
      .join("");
  } else {
    el.innerHTML = `<div class="card">${escape(JSON.stringify(data, null, 2))}</div>`;
  }
}

function escape(x) {
  return x.replace(/[&<>]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[c]));
}

async function scan() {
  await api("/scan", { method: "POST" });
  await load();
}

load();
setInterval(load, 5000);
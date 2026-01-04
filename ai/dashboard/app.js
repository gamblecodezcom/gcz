const API = "http://localhost:8010";

async function load() {
  render("memory", await (await fetch(`${API}/memory`)).json());
  render("health", await (await fetch(`${API}/health`)).json());
  render("anomalies", await (await fetch(`${API}/anomalies`)).json());
}

function render(id, rows) {
  document.getElementById(id).innerHTML =
    rows.map(r => `<div class="card">${JSON.stringify(r)}</div>`).join("");
}

async function scan() {
  await fetch(`${API}/scan`, { method: "POST" });
  load();
}

load();
setInterval(load, 5000);
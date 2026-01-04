import fetch from "node-fetch";

export class MemoryClient {
  constructor(base = "http://127.0.0.1:8010") {
    this.base = base;
  }

  async add(category, message, source = "cli", meta = {}) {
    return this._post("/memory", { category, message, source, meta });
  }

  async list(limit = 200) {
    const res = await fetch(`${this.base}/memory`);
    return res.json();
  }

  async health() {
    const res = await fetch(`${this.base}/health`);
    return res.json();
  }

  async anomalies() {
    const res = await fetch(`${this.base}/anomalies`);
    return res.json();
  }

  async scan() {
    return this._post("/scan", {});
  }

  async _post(path, body) {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return res.json();
  }
}
import fetch from "node-fetch";

export const SchedulerService = {
  async getScheduled() {
    const res = await fetch("https://gamblecodez.com/api/schedule");
    return res.json();
  },

  async add(payload) {
    const res = await fetch("https://gamblecodez.com/api/schedule/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
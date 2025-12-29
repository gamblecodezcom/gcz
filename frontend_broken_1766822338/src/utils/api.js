const API_BASE = process.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  getSites: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/sites?${query}`).then(r => r.json());
  },
  
  redirectSite: async (siteId) => {
    const res = await fetch(`${API_BASE}/redirect/${siteId}`, { method: 'POST' });
    return await res.json();
  },
  
  subscribeNewsletter: async (email, telegramHandle, payoutId) => {
    return fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, telegram_handle: telegramHandle, payout_id: payoutId }),
    }).then(r => r.json());
  },
  
  getRaffles: async () => {
    return fetch(`${API_BASE}/raffles`).then(r => r.json());
  },
  
  enterRaffle: async (raffleId, email) => {
    return fetch(`${API_BASE}/raffles/${raffleId}/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(r => r.json());
  },
  
  submitContact: async (name, email, subject, message) => {
    return fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    }).then(r => r.json());
  },
};

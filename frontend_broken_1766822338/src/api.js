const API_BASE = process.env.REACT_APP_API_BASE || 'https://gamblecodez.com/api';

export const get = async (path) => {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
};

export const post = async (path, data) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};
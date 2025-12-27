import fetch from 'node-fetch';
import { config } from '../config.js';

export async function getRaffles() {
  const res = await fetch(`${config.API_BASE_URL}/api/raffles`);
  return res.ok ? res.json() : [];
}

export async function logGiveawayResult(result) {
  return await fetch(`${config.API_BASE_URL}/api/giveaway/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  });
}

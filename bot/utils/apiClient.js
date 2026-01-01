import fetch from 'node-fetch';
import { config } from '../config.js';
import { logger } from './logger.js';

export async function getRaffles() {
  try {
    const res = await fetch(`${config.API_BASE_URL}/api/raffles`);
    if (!res.ok) {
      logger.error(`Failed to fetch raffles: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return data.raffles || [];
  } catch (error) {
    logger.error('Error fetching raffles:', error);
    return [];
  }
}

export async function enterRaffle(userId, raffleId) {
  try {
    const res = await fetch(`${config.API_BASE_URL}/api/raffles/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, raffle_id: raffleId })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    logger.error('Error entering raffle:', error);
    throw error;
  }
}

export async function logGiveawayResult(result) {
  try {
    const res = await fetch(`${config.API_BASE_URL}/api/giveaway/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    });
    return res.ok;
  } catch (error) {
    logger.error('Error logging giveaway:', error);
    return false;
  }
}

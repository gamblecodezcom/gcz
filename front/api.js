// frontend/src/utils/api.js
import axios from "axios";

const BASE_URL = "https://gamblecodez.com/api";

export const getDailySpinEligibility = (user_id) =>
  axios.get(`${BASE_URL}/daily-spin/eligibility`, { params: { user_id } }).then(res => res.data);

export const spinDaily = (user_id) =>
  axios.post(`${BASE_URL}/daily-spin`, { user_id }).then(res => res.data);

export const getRaffles = () =>
  axios.get(`${BASE_URL}/raffles`).then(res => res.data);

export const enterRaffle = (user_id, raffle_id) =>
  axios.post(`${BASE_URL}/raffles/enter`, { user_id, raffle_id }).then(res => res.data);
import { Pool } from "pg";
import { log } from "../utils/logger";

export const pool = new Pool({
  connectionString: process.env.GCZ_DB || process.env.DATABASE_URL
});

export async function query(sql: string, params: any[] = []) {
  log(`SQL → ${sql}`);
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    client.release();
  }
}

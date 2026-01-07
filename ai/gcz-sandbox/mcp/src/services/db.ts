import pg from "pg";

const { Pool } = pg;
const dbUrl = process.env.AI_AGENT_NEON_DB_URL;

if (!dbUrl) {
  throw new Error("Missing env AI_AGENT_NEON_DB_URL");
}

export const pool = new Pool({
  connectionString: dbUrl
});

export async function query(sql: string, params: unknown[] = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function logSpin({ user_id, reward, ip_address, user_agent }) {
  return pool.query(
    `INSERT INTO spin_logs (user_id, reward, ip_address, user_agent)
     VALUES ($1, $2, $3, $4)`,
    [user_id, reward, ip_address, user_agent]
  );
}
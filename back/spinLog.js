const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.getLastSpin = async (user_id) => {
  const result = await pool.query(
    "SELECT * FROM spin_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1",
    [user_id]
  );
  return result.rows[0];
};

exports.logSpin = async (user_id, result) => {
  await pool.query(
    "INSERT INTO spin_logs (user_id, result, timestamp) VALUES ($1, $2, NOW())",
    [user_id, result]
  );
};

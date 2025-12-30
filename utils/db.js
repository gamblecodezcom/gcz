import pkg from "pg";
const { Pool } = pkg;

// Create a single pool instance for the application
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.AI_AGENT_NEON_DB_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech") ? { rejectUnauthorized: false } : false,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;

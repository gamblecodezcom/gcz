import pkg from "pg";
const { Pool } = pkg;

/**
 * Determine which connection string to use.
 * Priority:
 * 1. DATABASE_URL (local or production)
 * 2. AI_AGENT_NEON_DB_URL (Neon cloud)
 */
const connectionString =
  process.env.DATABASE_URL ||
  process.env.AI_AGENT_NEON_DB_URL;

/**
 * Detect if the connection is Neon.
 * Neon requires SSL with rejectUnauthorized: false
 */
const isNeon =
  typeof connectionString === "string" &&
  connectionString.includes("neon.tech");

const pool = new Pool({
  connectionString,
  ssl: isNeon
    ? { rejectUnauthorized: false }
    : false,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;

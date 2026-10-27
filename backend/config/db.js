import pg from "pg";

// const { Pool } = pg;

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // TODO: enable CA and hostname verification before production
  max: Number(process.env.DB_POOL_MAX) || 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 10000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function connectDB() {
  const result = await pool.query("SELECT NOW() AS current_time");
  console.log("PostgreSQL connected successfully:", result.rows[0].current_time);
}

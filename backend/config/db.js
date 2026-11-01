import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX) || 10,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  statement_timeout: 30000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function connectDB(retries = 3) {
  for (let i = 1; i <= retries; i++) {
    try {
      const result = await pool.query("SELECT NOW() AS current_time");
      console.log("PostgreSQL connected successfully:", result.rows[0].current_time);
      return;
    } catch (err) {
      console.warn(`Database connection attempt ${i} failed: ${err.message}`);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

import "dotenv/config";
import app from "./app.js";
import { connectDB, pool } from "./config/db.js";

// Fail fast: refuse to boot with a weak or missing secret.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with a strong secret.");
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    await pool.end();
    process.exit(1);
  }
}

startServer();
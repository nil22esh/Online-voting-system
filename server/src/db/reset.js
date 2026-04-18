import { pool } from "./db.js";

const reset = async () => {
  const client = await pool.connect();
  try {
    await client.query("DROP TABLE IF EXISTS audit_logs CASCADE");
    await client.query("DROP TABLE IF EXISTS refresh_tokens CASCADE");
    await client.query("DROP TABLE IF EXISTS votes CASCADE");
    await client.query("DROP TABLE IF EXISTS candidates CASCADE");
    await client.query("DROP TABLE IF EXISTS elections CASCADE");
    await client.query("DROP TABLE IF EXISTS users CASCADE");
    await client.query("DROP FUNCTION IF EXISTS update_updated_at_column CASCADE");
    console.log("All tables dropped successfully");
    process.exit(0);
  } catch (error) {
    console.error("Reset failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
  }
};

reset();

import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const migration = `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
  ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
  ALTER TABLE users ALTER COLUMN aadhar_number DROP NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("Running Google OAuth migration...");
    await client.query(migration);
    console.log("✅ Migration successful!");

    // Verify columns exist
    const verify = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('google_id', 'avatar_url', 'password', 'phone_number', 'aadhar_number')
      ORDER BY column_name;
    `);
    console.log("\nColumn verification:");
    verify.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type}, nullable=${r.is_nullable}`);
    });
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

import { pool } from "./db.js";

const addMissingColumns = async () => {
    const client = await pool.connect();
    try {
        console.log("Starting database schema update...");
        
        // Add columns to votes table
        await client.query("ALTER TABLE votes ADD COLUMN IF NOT EXISTS vote_hash TEXT");
        await client.query("ALTER TABLE votes ADD COLUMN IF NOT EXISTS previous_vote_hash TEXT");
        await client.query("ALTER TABLE votes ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)");
        await client.query("ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_agent TEXT");
        
        console.log("✅ Database columns updated successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Database update failed:", error.message);
        process.exit(1);
    } finally {
        client.release();
    }
};

addMissingColumns();

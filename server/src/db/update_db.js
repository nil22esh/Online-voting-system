import { pool } from "./db.js";

const updateDB = async () => {
    try {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(15)");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhar_number VARCHAR(12)");
        console.log("Database updated successfully");
        process.exit(0);
    } catch (error) {
        console.error("Database update failed:", error);
        process.exit(1);
    }
};

updateDB();

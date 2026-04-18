import { pool } from "./db.js";

const updateCandidateSchema = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("Starting candidate table schema update...");

    // 1. Rename 'party' to 'party_name' if 'party' exists and 'party_name' doesn't
    const checkPartyColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'candidates' AND column_name = 'party'
    `);

    const checkPartyNameColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'candidates' AND column_name = 'party_name'
    `);

    if (checkPartyColumn.rows.length > 0 && checkPartyNameColumn.rows.length === 0) {
      await client.query("ALTER TABLE candidates RENAME COLUMN party TO party_name");
      console.log("- Renamed 'party' to 'party_name'");
    } else if (checkPartyColumn.rows.length === 0 && checkPartyNameColumn.rows.length === 0) {
      await client.query("ALTER TABLE candidates ADD COLUMN party_name VARCHAR(100)");
      console.log("- Added 'party_name' column");
    }

    // 2. Add other missing columns
    const columnsToAdd = [
      { name: "party_symbol", type: "VARCHAR(255)" },
      { name: "age", type: "INTEGER" },
      { name: "gender", type: "VARCHAR(20)" },
      { name: "education", type: "VARCHAR(255)" },
      { name: "profession", type: "VARCHAR(255)" },
      { name: "experience_years", type: "VARCHAR(50)" },
      { name: "manifesto", type: "JSONB DEFAULT '[]'" },
      { name: "social_links", type: "JSONB DEFAULT '{\"website\":\"\", \"twitter\":\"\", \"linkedin\":\"\"}'" }
    ];

    for (const col of columnsToAdd) {
      const checkCol = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'candidates' AND column_name = '${col.name}'
      `);

      if (checkCol.rows.length === 0) {
        await client.query(`ALTER TABLE candidates ADD COLUMN ${col.name} ${col.type}`);
        console.log(`- Added '${col.name}' column`);
      }
    }

    await client.query("COMMIT");
    console.log("\n✅ Candidate schema updated successfully!");
    process.exit(0);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Schema update failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
};

updateCandidateSchema();

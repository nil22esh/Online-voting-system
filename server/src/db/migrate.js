import { pool } from "./db.js";

const runMigration = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log("1/6 UUID extension OK");

    // 1. USERS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'voter'
          CHECK (role IN ('admin', 'officer', 'voter')),
        is_verified BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        phone_number VARCHAR(15),
        aadhar_number VARCHAR(12),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
    console.log("2/6 Users table OK");

    // 2. ELECTIONS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS elections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'upcoming'
          CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_anonymous BOOLEAN DEFAULT FALSE,
        election_level VARCHAR(20) DEFAULT 'local'
          CHECK (election_level IN ('national', 'state', 'local')),
        results_published BOOLEAN DEFAULT FALSE,
        CONSTRAINT valid_election_time CHECK (end_time > start_time)
      )
    `);
    await client.query("CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_elections_created_by ON elections(created_by)");
    console.log("3/6 Elections table OK");

    // 3. CANDIDATES TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        party_name VARCHAR(100),
        party_symbol VARCHAR(255),
        age INTEGER,
        gender VARCHAR(20),
        education VARCHAR(255),
        profession VARCHAR(255),
        experience_years VARCHAR(50),
        bio TEXT,
        manifesto JSONB DEFAULT '[]',
        social_links JSONB DEFAULT '{"website":"", "twitter":"", "linkedin":""}',
        photo_url VARCHAR(500),
        election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query("CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates(election_id)");
    console.log("4/6 Candidates table OK");

    // 4. VOTES TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        vote_hash TEXT,
        previous_vote_hash TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        CONSTRAINT unique_vote_per_election UNIQUE (user_id, election_id)
      )
    `);
    await client.query("CREATE INDEX IF NOT EXISTS idx_votes_election ON votes(election_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id)");
    console.log("5/6 Votes table OK");

    // 5. REFRESH TOKENS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)");

    // 6. AUDIT LOGS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        entity_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)");
    console.log("6/6 Audit logs & refresh tokens OK");
 
    // 7. OTPS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query("CREATE INDEX IF NOT EXISTS idx_otps_user ON otps(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_otps_code ON otps(code)");
    console.log("7/7 OTPS table OK");

    // Auto-update trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $t$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $t$ language 'plpgsql'
    `);

    // Create triggers
    const tables = ["users", "elections", "candidates"];
    for (const table of tables) {
      await client.query(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table}`);
      await client.query(`
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
    }
    console.log("Triggers created OK");

    await client.query("COMMIT");
    console.log("\n✅ Database migration completed successfully!");
    process.exit(0);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Migration failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
};

runMigration();

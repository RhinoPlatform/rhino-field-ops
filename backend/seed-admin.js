const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('--- SEEDING INITIAL MASTER SYSTEM ACCOUNT PRINCIPAL ---');
  try {
    const check = await pool.query("SELECT id FROM users WHERE role = 'Admin' LIMIT 1;");
    if (check.rows.length > 0) {
      console.log('⚠️ Matrix already possesses an admin user.');
      process.exit(0);
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('RhinoMasterOps2026!', salt);
    await pool.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3);", ['master.admin@rhino.com', hash, 'Admin']);
    console.log('✅ MASTER PROFILE CREATED: master.admin@rhino.com / RhinoMasterOps2026!');
  } catch (e) { console.error(e); } finally { await pool.end(); }
}
seed();

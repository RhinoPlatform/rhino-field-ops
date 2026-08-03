const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Database schema initialized successfully.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initDatabase();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'rhino_field_ops_ultra_secure_secret_2026';

const authController = {
  register: async (req, res) => {
    const { username, password, role } = req.body;
    if (!['Admin', 'Dispatcher', 'Technician'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid security role assigned.' });
    }
    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const query = `
        INSERT INTO users (username, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, username, role, is_active;
      `;
      const result = await pool.query(query, [username, passwordHash, role]);
      res.status(201).json({ success: true, user: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') return res.status(400).json({ success: false, error: 'Username already exists.' });
      res.status(500).json({ success: false, error: 'Internal system error during registration.' });
    }
  },

  login: async (req, res) => {
    const { username, password } = req.body;
    try {
      const query = 'SELECT * FROM users WHERE username = $1 AND is_active = TRUE;';
      const result = await pool.query(query, [username]);
      if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid credentials.' });

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials.' });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
      res.status(200).json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'System error processing login.' });
    }
  }
};

module.exports = authController;

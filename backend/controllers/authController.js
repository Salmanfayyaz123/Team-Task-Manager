const bcrypt = require('bcrypt');
const passport = require('../config/passport');
const pool = require('../config/db');

const SALT_ROUNDS = 12;

/**
 * POST /auth/register
 */
async function register(req, res, next) {
  const { name, email, password } = req.body;
  try {
    // Check for existing user
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, password_hash]
    );
    const user = result.rows[0];

    // Auto-login after registration
    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(201).json({ user });
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 */
function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Authentication failed.' });

    req.login(user, (err) => {
      if (err) return next(err);
      const { password_hash, ...safeUser } = user;
      return res.json({ user: safeUser });
    });
  })(req, res, next);
}

/**
 * POST /auth/logout
 */
function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully.' });
    });
  });
}

/**
 * GET /auth/me
 */
function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, logout, me };

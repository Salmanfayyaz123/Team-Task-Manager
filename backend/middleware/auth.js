/**
 * Middleware: ensure the request has an authenticated session.
 * Protects all non-auth routes.
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Unauthorized. Please log in.' });
}

/**
 * Middleware: ensure the authenticated user is a member of the requested team.
 * Expects :teamId in route params.
 */
const pool = require('../config/db');

async function isTeamMember(req, res, next) {
  const { teamId } = req.params;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Forbidden. You are not a member of this team.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: ensure the authenticated user is the owner of the requested team.
 */
async function isTeamOwner(req, res, next) {
  const { teamId } = req.params;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'owner'",
      [teamId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Forbidden. Only team owners can perform this action.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { isAuthenticated, isTeamMember, isTeamOwner };

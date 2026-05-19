const pool = require('../config/db');

/**
 * GET /teams
 * Returns all teams the authenticated user belongs to.
 */
async function getTeams(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.*, tm.role,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count,
              u.name AS created_by_name
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       JOIN users u ON t.created_by = u.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json({ teams: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /teams/:teamId
 * Returns a single team with its members.
 */
async function getTeam(req, res, next) {
  const { teamId } = req.params;
  try {
    const teamResult = await pool.query(
      `SELECT t.*, u.name AS created_by_name
       FROM teams t
       JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [teamId]
    );
    if (teamResult.rowCount === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );

    res.json({ team: teamResult.rows[0], members: membersResult.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /teams
 * Creates a new team and adds the creator as owner.
 */
async function createTeam(req, res, next) {
  const { name, description } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const teamResult = await client.query(
      'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, req.user.id]
    );
    const team = teamResult.rows[0];

    await client.query(
      "INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')",
      [team.id, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ team });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * PUT /teams/:teamId
 * Updates team name/description. Owner only.
 */
async function updateTeam(req, res, next) {
  const { teamId } = req.params;
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE teams SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description || null, teamId]
    );
    res.json({ team: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /teams/:teamId
 * Deletes a team. Owner only.
 */
async function deleteTeam(req, res, next) {
  const { teamId } = req.params;
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
    res.json({ message: 'Team deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /teams/:teamId/members
 * Adds a member to a team by email. Owner only.
 */
async function addMember(req, res, next) {
  const { teamId } = req.params;
  const { email } = req.body;
  try {
    const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [
      email,
    ]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'No user found with that email.' });
    }
    const user = userResult.rows[0];

    // Check already a member
    const existing = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, user.id]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'User is already a member of this team.' });
    }

    await pool.query(
      "INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')",
      [teamId, user.id]
    );

    res.status(201).json({ message: `${user.name} added to team.`, user });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /teams/:teamId/members/:userId
 * Removes a member from a team. Owner only (cannot remove themselves if last owner).
 */
async function removeMember(req, res, next) {
  const { teamId, userId } = req.params;
  try {
    // Prevent removing the last owner
    const ownerCheck = await pool.query(
      "SELECT COUNT(*) FROM team_members WHERE team_id = $1 AND role = 'owner'",
      [teamId]
    );
    const ownerCount = parseInt(ownerCheck.rows[0].count);
    const isOwner = await pool.query(
      "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'owner'",
      [teamId, userId]
    );
    if (ownerCount === 1 && isOwner.rowCount > 0) {
      return res.status(400).json({ error: 'Cannot remove the last owner of a team.' });
    }

    await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [
      teamId,
      userId,
    ]);
    res.json({ message: 'Member removed from team.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTeams, getTeam, createTeam, updateTeam, deleteTeam, addMember, removeMember };

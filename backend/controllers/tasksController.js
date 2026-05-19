const pool = require('../config/db');

/**
 * GET /tasks
 * Returns tasks visible to the user (in their teams).
 * Query params: teamId, assignedTo, status, priority, search
 */
async function getTasks(req, res, next) {
  const { teamId, assignedTo, status, priority, search } = req.query;
  try {
    let query = `
      SELECT t.*,
             u_assignee.name AS assigned_to_name,
             u_creator.name AS created_by_name,
             teams.name AS team_name
      FROM tasks t
      LEFT JOIN users u_assignee ON t.assigned_to = u_assignee.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN teams ON t.team_id = teams.id
      WHERE t.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = $1
      )
    `;
    const params = [req.user.id];
    let idx = 2;

    if (teamId) {
      query += ` AND t.team_id = $${idx++}`;
      params.push(teamId);
    }
    if (assignedTo) {
      query += ` AND t.assigned_to = $${idx++}`;
      params.push(assignedTo);
    }
    if (status) {
      query += ` AND t.status = $${idx++}`;
      params.push(status);
    }
    if (priority) {
      query += ` AND t.priority = $${idx++}`;
      params.push(priority);
    }
    if (search) {
      query += ` AND (t.title ILIKE $${idx} OR t.description ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /tasks/:taskId
 */
async function getTask(req, res, next) {
  const { taskId } = req.params;
  try {
    const result = await pool.query(
      `SELECT t.*,
              u_assignee.name AS assigned_to_name,
              u_creator.name AS created_by_name,
              teams.name AS team_name
       FROM tasks t
       LEFT JOIN users u_assignee ON t.assigned_to = u_assignee.id
       LEFT JOIN users u_creator ON t.created_by = u_creator.id
       LEFT JOIN teams ON t.team_id = teams.id
       WHERE t.id = $1
         AND t.team_id IN (SELECT team_id FROM team_members WHERE user_id = $2)`,
      [taskId, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /tasks
 * Creates a new task. Creator must be a member of the team.
 */
async function createTask(req, res, next) {
  const { title, description, status, priority, team_id, assigned_to, due_date } = req.body;
  try {
    // Verify creator is in the team
    const memberCheck = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [team_id, req.user.id]
    );
    if (memberCheck.rowCount === 0) {
      return res.status(403).json({ error: 'You are not a member of this team.' });
    }

    // If assigned_to is provided, verify they're also in the team
    if (assigned_to) {
      const assigneeCheck = await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team_id, assigned_to]
      );
      if (assigneeCheck.rowCount === 0) {
        return res.status(400).json({ error: 'Assignee is not a member of this team.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, team_id, assigned_to, created_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description || null,
        status || 'todo',
        priority || 'medium',
        team_id,
        assigned_to || null,
        req.user.id,
        due_date || null,
      ]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /tasks/:taskId
 * Updates a task. Only team members can update.
 */
async function updateTask(req, res, next) {
  const { taskId } = req.params;
  const { title, description, status, priority, assigned_to, due_date } = req.body;
  try {
    // Verify task exists and user has access
    const taskCheck = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND team_id IN (SELECT team_id FROM team_members WHERE user_id = $2)',
      [taskId, req.user.id]
    );
    if (taskCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = taskCheck.rows[0];

    const result = await pool.query(
      `UPDATE tasks SET
         title = $1,
         description = $2,
         status = $3,
         priority = $4,
         assigned_to = $5,
         due_date = $6
       WHERE id = $7
       RETURNING *`,
      [
        title ?? task.title,
        description !== undefined ? description : task.description,
        status ?? task.status,
        priority ?? task.priority,
        assigned_to !== undefined ? assigned_to : task.assigned_to,
        due_date !== undefined ? due_date : task.due_date,
        taskId,
      ]
    );
    res.json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /tasks/:taskId
 * Deletes a task. Only the task creator or team owner can delete.
 */
async function deleteTask(req, res, next) {
  const { taskId } = req.params;
  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    const task = taskResult.rows[0];

    // Check if user is task creator OR team owner
    const ownerCheck = await pool.query(
      "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'owner'",
      [task.team_id, req.user.id]
    );
    const isCreator = task.created_by === req.user.id;
    const isOwner = ownerCheck.rowCount > 0;

    if (!isCreator && !isOwner) {
      return res
        .status(403)
        .json({ error: 'Only the task creator or team owner can delete this task.' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /tasks/due-soon
 * Returns tasks due in the next 24 hours for the authenticated user.
 */
async function getDueSoon(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.*, teams.name AS team_name, u.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN teams ON t.team_id = teams.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.assigned_to = $1
         AND t.due_date IS NOT NULL
         AND t.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
         AND t.status != 'done'
       ORDER BY t.due_date ASC`,
      [req.user.id]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getDueSoon };

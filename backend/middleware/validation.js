const { body, validationResult } = require('express-validator');

/** Run validation checks and return 422 if any fail */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const teamRules = [
  body('name').trim().notEmpty().withMessage('Team name is required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

const taskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 255 }),
  body('description').optional().trim(),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority'),
  body('team_id').isInt({ min: 1 }).withMessage('Valid team_id is required'),
  body('assigned_to').optional({ nullable: true }).isInt({ min: 1 }),
  body('due_date').optional({ nullable: true }).isISO8601().toDate(),
];

module.exports = { validate, registerRules, loginRules, teamRules, taskRules };

const express = require('express');
const router = express.Router();
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
} = require('../controllers/teamsController');
const { isAuthenticated, isTeamMember, isTeamOwner } = require('../middleware/auth');
const { teamRules, validate } = require('../middleware/validation');
const { body } = require('express-validator');

// All team routes require authentication
router.use(isAuthenticated);

router.get('/', getTeams);
router.post('/', teamRules, validate, createTeam);

router.get('/:teamId', isTeamMember, getTeam);
router.put('/:teamId', isTeamMember, isTeamOwner, teamRules, validate, updateTeam);
router.delete('/:teamId', isTeamMember, isTeamOwner, deleteTeam);

// Member management (owner only)
router.post(
  '/:teamId/members',
  isTeamMember,
  isTeamOwner,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  validate,
  addMember
);
router.delete('/:teamId/members/:userId', isTeamMember, isTeamOwner, removeMember);

module.exports = router;

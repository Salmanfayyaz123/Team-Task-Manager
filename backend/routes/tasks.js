const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getDueSoon,
} = require('../controllers/tasksController');
const { isAuthenticated } = require('../middleware/auth');
const { taskRules, validate } = require('../middleware/validation');

// All task routes require authentication
router.use(isAuthenticated);

router.get('/', getTasks);
router.get('/due-soon', getDueSoon);
router.get('/:taskId', getTask);
router.post('/', taskRules, validate, createTask);
router.put('/:taskId', validate, updateTask);
router.delete('/:taskId', deleteTask);

module.exports = router;

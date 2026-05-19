const express = require('express');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/authController');
const { registerRules, loginRules, validate } = require('../middleware/validation');
const { isAuthenticated } = require('../middleware/auth');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/logout', isAuthenticated, logout);
router.get('/me', isAuthenticated, me);

module.exports = router;

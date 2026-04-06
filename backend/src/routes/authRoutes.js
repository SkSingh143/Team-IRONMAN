const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerRules = [
  body('email').isEmail().normalizeEmail(),
  body('username').isAlphanumeric().isLength({ min: 2, max: 30 }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', authLimiter, registerRules, authController.register);
router.post('/login', authLimiter, loginRules, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

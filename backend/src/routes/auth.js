const express = require('express');
const {
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resetPassword,
  updateProfile
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');
const validate = require('../middleware/validate');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 5, // Higher rate limit in dev
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginLimiter, loginValidation, validate, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', body('email').isEmail(), validate, authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password',
  body('newPassword').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  validate,
  authController.resetPassword
);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, uploadProfileImage.single('profileImage'), authController.updateProfile);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const verifyCsrf = require('../middleware/verifyCsrf');
const { register, login, refresh, logout, googleAuth, googleCallback, guestLogin, verifyOtp, resendOtp } = require('../controllers/authControllers');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, register);

router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
], validate, verifyOtp);

router.post('/resend-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
], validate, resendOtp);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, login);

// Both routes rely solely on the httpOnly cookie for auth, so both need
// the CSRF check (login/register don't, since there's no cookie yet to steal).
router.get('/refresh', verifyCsrf, refresh);
router.post('/logout', verifyCsrf, logout);

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

router.post('/guest', guestLogin);

module.exports = router;

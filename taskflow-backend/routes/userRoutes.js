const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const verifyJWT = require('../middleware/verifyJWT');
const { getMe, updateMe, upgradeGuest } = require('../controllers/userControllers');

router.use(verifyJWT);

router.get('/me', getMe);
router.patch('/me', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('defaultPriority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
], validate, updateMe);

router.post('/upgrade', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, upgradeGuest);

module.exports = router;
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const verifyJWT = require('../middleware/verifyJWT');
const { getAllTasks, createTask, updateTask, deleteTask } = require('../controllers/taskControllers');
const Task = require('../models/Task');

router.use(verifyJWT);

router.get('/', getAllTasks);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'inprogress', 'done']).withMessage('Invalid status'),
], validate, createTask);

router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'inprogress', 'done']).withMessage('Invalid status'),
], validate, updateTask);

router.delete('/', async (req, res) => {
  try {
    await Task.deleteMany({ user: req.user.id });
    res.json({ message: 'All tasks deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', deleteTask);

module.exports = router;
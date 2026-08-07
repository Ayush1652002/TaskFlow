const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const verifyJWT = require('../middleware/verifyJWT');
const { requireWorkspaceRole } = require('../middleware/workspaceAuth');
const { getAllTasks, createTask, updateTask, deleteTask, reorderTasks, getTrash, restoreTask, purgeTask } = require('../controllers/taskControllers');
const { getComments, addComment } = require('../controllers/commentControllers');
const { getTaskHistory } = require('../controllers/activityControllers');
const { uploadAttachment, deleteAttachment } = require('../controllers/attachmentControllers');
const upload = require('../middleware/upload');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

// All task routes are nested under a workspace: /tasks/:workspaceId/...
router.use('/:workspaceId', verifyJWT, requireWorkspaceRole('member'));

router.get('/:workspaceId', getAllTasks);

router.post('/:workspaceId', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'inprogress', 'done']).withMessage('Invalid status'),
  body('assignee').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid assignee'),
  body('recurrence').optional().isIn(['none', 'daily', 'weekly', 'monthly']).withMessage('Invalid recurrence'),
], validate, createTask);

router.patch('/:workspaceId/reorder', reorderTasks);

router.put('/:workspaceId/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'inprogress', 'done']).withMessage('Invalid status'),
  body('assignee').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid assignee'),
  body('recurrence').optional().isIn(['none', 'daily', 'weekly', 'monthly']).withMessage('Invalid recurrence'),
], validate, updateTask);

router.delete('/:workspaceId', asyncHandler(async (req, res) => {
  await Task.updateMany({ workspace: req.workspace._id, deletedAt: null }, { deletedAt: new Date() });
  res.json({ message: 'All tasks moved to trash' });
}));

router.get('/:workspaceId/trash', getTrash);
router.patch('/:workspaceId/:id/restore', restoreTask);
router.delete('/:workspaceId/:id/purge', purgeTask);

router.delete('/:workspaceId/:id', deleteTask);

router.get('/:workspaceId/:taskId/comments', getComments);
router.post('/:workspaceId/:taskId/comments', [
  body('text').trim().notEmpty().withMessage('Comment text is required'),
], validate, addComment);

router.get('/:workspaceId/:taskId/history', getTaskHistory);

router.post('/:workspaceId/:taskId/attachments', upload.single('file'), uploadAttachment);
router.delete('/:workspaceId/:taskId/attachments/:attachmentId', deleteAttachment);

module.exports = router;
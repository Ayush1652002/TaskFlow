const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const { requireWorkspaceRole } = require('../middleware/workspaceAuth');
const {
  getMyWorkspaces, createWorkspace, addMember, updateMemberRole, removeMember,
  deleteWorkspace, getWorkspaceTrash, restoreWorkspace, purgeWorkspace,
} = require('../controllers/workspaceControllers');

router.use(verifyJWT);

router.get('/', getMyWorkspaces);
router.post('/', createWorkspace);

// Trash routes come before /:workspaceId so "trash" isn't parsed as an id
router.get('/trash', getWorkspaceTrash);

// Member management — requires admin or owner
router.post('/:workspaceId/members', requireWorkspaceRole('admin'), addMember);
router.patch('/:workspaceId/members/:userId', requireWorkspaceRole('admin'), updateMemberRole);
router.delete('/:workspaceId/members/:userId', requireWorkspaceRole('admin'), removeMember);

router.delete('/:workspaceId', requireWorkspaceRole('owner'), deleteWorkspace);
// Restore/purge don't use requireWorkspaceRole — that middleware 404s deleted
// workspaces by design, so these check ownership directly in the controller instead.
router.patch('/:workspaceId/restore', restoreWorkspace);
router.delete('/:workspaceId/purge', purgeWorkspace);

module.exports = router;

const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const { requireWorkspaceRole } = require('../middleware/workspaceAuth');
const { getWorkspaceActivity } = require('../controllers/activityControllers');

router.get('/:workspaceId', verifyJWT, requireWorkspaceRole('member'), getWorkspaceActivity);

module.exports = router;

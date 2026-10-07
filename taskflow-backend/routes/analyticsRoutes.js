const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const { requireWorkspaceRole } = require('../middleware/workspaceAuth');
const { getAnalytics } = require('../controllers/analyticsControllers');
// changed
router.get('/:workspaceId', verifyJWT, requireWorkspaceRole('member'), getAnalytics);

module.exports = router;

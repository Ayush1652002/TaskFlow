const Workspace = require('../models/Workspace');

// Role hierarchy: higher number = more power
const ROLE_LEVEL = { member: 1, manager: 2, admin: 3, owner: 4 };

// Attaches req.workspace and req.membership if the logged-in user
// (req.user.id, set by verifyJWT) belongs to :workspaceId in the URL.
const requireWorkspaceRole = (minRole = 'member') => {
  return async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace || workspace.deletedAt) return res.status(404).json({ message: 'Workspace not found' });

      const membership = workspace.members.find(m => m.user.toString() === req.user.id);
      if (!membership) return res.status(403).json({ message: 'Not a member of this workspace' });

      if (ROLE_LEVEL[membership.role] < ROLE_LEVEL[minRole]) {
        return res.status(403).json({ message: `Requires ${minRole} role or higher` });
      }

      req.workspace = workspace;
      req.membership = membership;
      next();
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = { requireWorkspaceRole, ROLE_LEVEL };

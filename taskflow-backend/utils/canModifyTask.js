// One shared rule for "who may change this task (or its files)".
// Owner/admin/manager can modify any task. A plain "member" can only modify
// a task they created or that is assigned to them.
// Used by taskControllers AND attachmentControllers so the rule lives in one place.
const ELEVATED_ROLES = ['owner', 'admin', 'manager'];

const canModifyTask = (req, task) => {
  if (!req || !task) return false;

  const userRole = req.membership?.role;
  if (userRole && ELEVATED_ROLES.includes(userRole)) return true;

  const currentUserId = req.user?.id || req.user?._id;
  if (!currentUserId) return false;

  const creatorId = task.user?._id || task.user;
  if (creatorId && creatorId.toString() === currentUserId.toString()) return true;

  const assigneeId = task.assignee?._id || task.assignee;
  if (assigneeId && assigneeId.toString() === currentUserId.toString()) return true;

  return false;
};

module.exports = canModifyTask;
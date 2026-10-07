// One shared rule for "who may change this task (or its files)".
// Owner/admin/manager can modify any task. A plain "member" can only modify
// a task they created or that is assigned to them.
// Used by taskControllers AND attachmentControllers so the rule lives in one place.
const ELEVATED_ROLES = ['owner', 'admin', 'manager'];
// changed
const canModifyTask = (req, task) => {
  if (ELEVATED_ROLES.includes(req.membership.role)) return true;
  if (task.user.toString() === req.user.id) return true;
  if (task.assignee && task.assignee.toString() === req.user.id) return true;
  return false;
};

module.exports = canModifyTask;

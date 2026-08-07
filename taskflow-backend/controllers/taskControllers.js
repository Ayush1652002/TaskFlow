const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logActivity = require('../utils/logActivity');
const notify = require('../utils/notify');

// Owner/admin/manager can modify any task in the workspace. A plain
// "member" can only modify a task they created or are assigned to —
// this is what stops one member from editing/deleting someone else's work.
const canModifyTask = (req, task) => {
  const elevatedRoles = ['owner', 'admin', 'manager'];
  if (elevatedRoles.includes(req.membership.role)) return true;
  if (task.user.toString() === req.user.id) return true;
  if (task.assignee && task.assignee.toString() === req.user.id) return true;
  return false;
};

const getAllTasks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const status = req.query.status || '';
  const priority = req.query.priority || '';
  const assignedToMe = req.query.assignedToMe === 'true';

  const SORTABLE_FIELDS = ['createdAt', 'dueDate', 'priority', 'title', 'order'];
  const sortBy = SORTABLE_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'order';
  const sortOrder = req.query.order === 'desc' ? -1 : 1;

  const query = { workspace: req.workspace._id, deletedAt: null };

  if (search) query.title = { $regex: search, $options: 'i' };
  if (status === 'completed') query.completed = true;
  if (status === 'pending') query.completed = false;
  if (priority) query.priority = priority;
  if (assignedToMe) query.assignee = req.user.id;

  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .populate('assignee', 'name email')
    .sort({ [sortBy]: sortOrder, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    tasks,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  });
});

// Validates that an assignee, if provided, is actually a member of this workspace
const resolveAssignee = (assignee, workspace) => {
  if (!assignee) return null;
  const isMember = workspace.members.some(m => m.user.toString() === assignee);
  if (!isMember) throw new AppError('Assignee must be a workspace member', 400);
  return assignee;
};

// Computes the next occurrence's due date, based on the CURRENT due date
// (or today, if there wasn't one) — so a weekly task always lands on the
// same weekday rather than drifting based on when it happened to be completed.
const getNextDueDate = (currentDueDate, recurrence) => {
  const base = currentDueDate ? new Date(currentDueDate) : new Date();
  if (recurrence === 'daily') base.setDate(base.getDate() + 1);
  if (recurrence === 'weekly') base.setDate(base.getDate() + 7);
  if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1);
  return base;
};

const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, category, dueDate, status, assignee, recurrence } = req.body;
  if (!title) throw new AppError('Title required', 400);

  const lastTask = await Task.findOne({ workspace: req.workspace._id }).sort({ order: -1 });
  const nextOrder = lastTask ? lastTask.order + 1 : 0;
  const resolvedAssignee = resolveAssignee(assignee, req.workspace);

  const task = await Task.create({
    workspace: req.workspace._id,
    user: req.user.id,
    title,
    description: description || '',
    priority: priority || 'Medium',
    category: category || 'General',
    dueDate: dueDate || null,
    status: status || 'todo',
    assignee: resolvedAssignee,
    recurrence: recurrence || 'none',
    order: nextOrder,
  });

  await task.populate('assignee', 'name email');
  res.status(201).json(task);

  logActivity({
    workspace: req.workspace._id,
    task: task._id,
    user: req.user.id,
    type: 'task_created',
    message: `created task "${task.title}"`,
  });

  if (resolvedAssignee && resolvedAssignee !== req.user.id) {
    logActivity({
      workspace: req.workspace._id,
      task: task._id,
      user: req.user.id,
      type: 'task_updated',
      message: `assigned "${task.title}"`,
      field: 'assignee',
    });

    notify({
      workspace: req.workspace._id,
      user: resolvedAssignee,
      fromUser: req.user.id,
      task: task._id,
      type: 'assigned',
      message: `assigned you to "${task.title}"`,
    });
  }
});

const reorderTasks = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) throw new AppError('orderedIds must be an array', 400);

  const ops = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, workspace: req.workspace._id },
      update: { order: index },
    },
  }));

  if (ops.length) await Task.bulkWrite(ops);
  res.json({ message: 'Order updated' });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);
  if (task.workspace.toString() !== req.workspace._id.toString()) throw new AppError('Forbidden', 403);
  if (!canModifyTask(req, task)) {
    throw new AppError('Only the assignee, creator, or a manager/admin/owner can edit this task', 403);
  }

  const allowedUpdates = ['title', 'description', 'completed', 'priority', 'category', 'status', 'dueDate', 'completedAt', 'assignee', 'recurrence'];
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (updates.dueDate === '') updates.dueDate = null;
  if (updates.completed === true) updates.completedAt = new Date();
  if (updates.completed === false) updates.completedAt = null;

  // `completed` and `status` are two views of the same thing and must never
  // disagree — otherwise a task can show as checked-off in list view while
  // sitting in the "In Progress" column on the board, which is the bug being fixed here.
  if (updates.status !== undefined) {
    // Changing status directly (e.g. via the edit panel) drives completed:
    // "done" means completed, anything else means not completed.
    updates.completed = updates.status === 'done';
    updates.completedAt = updates.completed ? new Date() : null;
  } else if (updates.completed !== undefined) {
    // Toggling the checkbox directly drives status the other way.
    updates.status = updates.completed ? 'done' : 'todo';
  }
  if (updates.assignee !== undefined) updates.assignee = resolveAssignee(updates.assignee, req.workspace);

  const updated = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate('assignee', 'name email');
  res.json(updated);

  // Recurring task just got completed — spin up its next occurrence automatically
  // instead of requiring the user to recreate "Team meeting" every single week.
  if (updates.completed === true && task.recurrence && task.recurrence !== 'none') {
    const lastTask = await Task.findOne({ workspace: req.workspace._id }).sort({ order: -1 });
    const nextTask = await Task.create({
      workspace: task.workspace,
      user: task.user,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: getNextDueDate(updated.dueDate, task.recurrence),
      status: 'todo',
      assignee: task.assignee,
      recurrence: task.recurrence,
      recurringParent: task.recurringParent || task._id,
      order: lastTask ? lastTask.order + 1 : 0,
    });

    logActivity({
      workspace: req.workspace._id,
      task: nextTask._id,
      user: req.user.id,
      type: 'task_created',
      message: `auto-created next occurrence of "${task.title}"`,
    });
  }

  const trackedFields = ['title', 'priority', 'category', 'status', 'dueDate', 'assignee'];
  trackedFields.forEach((field) => {
    if (updates[field] === undefined) return;
    const oldVal = task[field];
    const newVal = updated[field]?._id || updated[field];
    if (String(oldVal) === String(newVal)) return;

    logActivity({
      workspace: req.workspace._id,
      task: task._id,
      user: req.user.id,
      type: 'task_updated',
      message: `changed ${field} on "${updated.title}"`,
      field,
      from: oldVal,
      to: newVal,
    });

    if (field === 'assignee' && newVal) {
      notify({
        workspace: req.workspace._id,
        user: newVal,
        fromUser: req.user.id,
        task: task._id,
        type: 'assigned',
        message: `assigned you to "${updated.title}"`,
      });
    }
  });

  if (updates.completed === true) {
    logActivity({
      workspace: req.workspace._id,
      task: task._id,
      user: req.user.id,
      type: 'task_completed',
      message: `completed "${updated.title}"`,
    });
  }
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);
  if (task.workspace.toString() !== req.workspace._id.toString()) throw new AppError('Forbidden', 403);
  if (!canModifyTask(req, task)) {
    throw new AppError('Only the assignee, creator, or a manager/admin/owner can delete this task', 403);
  }

  // Soft delete: keep the document, just hide it from normal views. It sits
  // in the Trash for 30 days (see getTrash) before being eligible for purge.
  task.deletedAt = new Date();
  await task.save();
  res.json({ message: 'Task moved to trash' });

  logActivity({
    workspace: req.workspace._id,
    task: null,
    user: req.user.id,
    type: 'task_deleted',
    message: `deleted task "${task.title}"`,
  });
});

// GET /tasks/:workspaceId/trash — deleted tasks from the last 30 days
const getTrash = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Lazily purge anything past the 30-day window instead of running a cron job —
  // it gets cleaned up the next time anyone actually opens the trash view.
  await Task.deleteMany({
    workspace: req.workspace._id,
    deletedAt: { $ne: null, $lt: thirtyDaysAgo },
  });

  const trashedTasks = await Task.find({ workspace: req.workspace._id, deletedAt: { $ne: null } })
    .populate('assignee', 'name email')
    .sort({ deletedAt: -1 });

  res.json(trashedTasks);
});

// PATCH /tasks/:workspaceId/:id/restore
const restoreTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, workspace: req.workspace._id, deletedAt: { $ne: null } });
  if (!task) throw new AppError('Task not found in trash', 404);
  if (!canModifyTask(req, task)) throw new AppError('Not allowed to restore this task', 403);

  task.deletedAt = null;
  await task.save();
  res.json(task);
});

// DELETE /tasks/:workspaceId/:id/purge — permanent, skips the trash entirely
const purgeTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, workspace: req.workspace._id, deletedAt: { $ne: null } });
  if (!task) throw new AppError('Task not found in trash', 404);
  if (!canModifyTask(req, task)) throw new AppError('Not allowed to permanently delete this task', 403);

  await task.deleteOne();
  res.json({ message: 'Task permanently deleted' });
});

module.exports = { getAllTasks, createTask, updateTask, deleteTask, reorderTasks, getTrash, restoreTask, purgeTask };
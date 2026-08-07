const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Who the task is assigned to — separate from `user` (the creator).
  // Optional: an unassigned task just has no one accountable for it yet.
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  category: {
    type: String,
    default: 'General',
  },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo',
  },
  dueDate: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
  attachments: [{
    filename: String,       // stored name on disk (unique, safe)
    originalName: String,   // name to show the user
    size: Number,           // bytes
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  }],
  // When set, completing this task auto-creates the next occurrence instead
  // of just marking it done. `recurringParent` links a generated occurrence
  // back to the original, mainly so the UI can show "part of a recurring series."
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none',
  },
  recurringParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  // Soft delete: set instead of actually removing the document, so it can
  // sit in a "Trash" for 30 days before being permanently purged.
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

taskSchema.index({ workspace: 1, createdAt: -1 });
taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ workspace: 1, completed: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });
taskSchema.index({ workspace: 1, priority: 1 });
taskSchema.index({ workspace: 1, assignee: 1 });
taskSchema.index({ workspace: 1, deletedAt: 1 });

module.exports = mongoose.model('Task', taskSchema);
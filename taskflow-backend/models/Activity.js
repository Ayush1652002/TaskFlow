const mongoose = require('mongoose');

// One collection backs two views:
//  - Workspace-wide Activity Timeline (all entries for a workspace)
//  - Per-task History tab (entries filtered by task)
// "field/from/to" is only populated for update-type entries, so the
// history tab can render a clean "priority: Medium -> High" line.
const activitySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['task_created', 'task_updated', 'task_completed', 'task_deleted', 'comment_added'],
    required: true,
  },
  message: { type: String, required: true }, // human-readable summary, e.g. "created task 'Fix login bug'"
  field: { type: String, default: null },
  from: { type: mongoose.Schema.Types.Mixed, default: null },
  to: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

activitySchema.index({ workspace: 1, createdAt: -1 });
activitySchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

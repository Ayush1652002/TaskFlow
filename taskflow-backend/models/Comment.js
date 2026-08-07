const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

commentSchema.index({ task: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);

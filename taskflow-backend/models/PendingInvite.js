const mongoose = require('mongoose');

const pendingInviteSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  email: { type: String, required: true, lowercase: true },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

pendingInviteSchema.index({ email: 1 });

module.exports = mongoose.model('PendingInvite', pendingInviteSchema);

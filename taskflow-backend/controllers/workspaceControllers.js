const Workspace = require('../models/Workspace');
const User = require('../models/User');
const PendingInvite = require('../models/PendingInvite');
const sendEmail = require('../utils/mailer');

const slugify = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

// GET /workspaces — all workspaces the logged-in user belongs to
const getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user.id, deletedAt: null })
      .select('name slug owner members createdAt')
      .populate('members.user', 'name email');
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /workspaces — create a new workspace, creator becomes owner
const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Workspace name required' });

    const workspace = await Workspace.create({
      name,
      slug: slugify(name),
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'owner' }],
    });

    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /workspaces/:workspaceId/members — invite by email (admin+)
const addMember = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    if (!['admin', 'manager', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // No account yet — store the invite so it auto-applies the moment
      // they register/verify with this email, and email them a heads-up now.
      const existingInvite = await PendingInvite.findOne({ workspace: req.workspace._id, email });
      if (existingInvite) return res.status(409).json({ message: 'Invite already sent to this email' });

      await PendingInvite.create({
        workspace: req.workspace._id,
        email,
        role,
        invitedBy: req.user.id,
      });

      await sendEmail({
        to: email,
        subject: `You've been invited to "${req.workspace.name}" on TaskFlow`,
        html: `<p>You've been invited to join the workspace <strong>${req.workspace.name}</strong> on TaskFlow.</p><p>Create an account with this email address to join automatically: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>`,
      });

      return res.status(202).json({ message: `Invite sent to ${email} — they'll join automatically once they sign up` });
    }

    const alreadyMember = req.workspace.members.some(m => m.user.toString() === user._id.toString());
    if (alreadyMember) return res.status(409).json({ message: 'User already in workspace' });

    req.workspace.members.push({ user: user._id, role });
    await req.workspace.save();
    await req.workspace.populate('members.user', 'name email');

    await sendEmail({
      to: email,
      subject: `You've been added to "${req.workspace.name}" on TaskFlow`,
      html: `<p>You've been added to the workspace <strong>${req.workspace.name}</strong> as a <strong>${role}</strong>.</p>`,
    });

    res.status(201).json(req.workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /workspaces/:workspaceId/members/:userId — change a member's role (admin+)
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    if (!['admin', 'manager', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const member = req.workspace.members.find(m => m.user.toString() === userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (member.role === 'owner') return res.status(403).json({ message: "Can't change owner's role" });

    member.role = role;
    await req.workspace.save();
    res.json(req.workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /workspaces/:workspaceId/members/:userId — remove a member (admin+)
const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const member = req.workspace.members.find(m => m.user.toString() === userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (member.role === 'owner') return res.status(403).json({ message: "Can't remove the owner" });

    req.workspace.members = req.workspace.members.filter(m => m.user.toString() !== userId);
    await req.workspace.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /workspaces/:workspaceId — owner only, soft delete
const deleteWorkspace = async (req, res) => {
  try {
    if (req.membership.role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can delete a workspace' });
    }

    req.workspace.deletedAt = new Date();
    await req.workspace.save();
    res.json({ message: 'Workspace moved to trash' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /workspaces/trash — workspaces owned by this user, deleted in the last 30 days
const getWorkspaceTrash = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Lazy purge — same pattern as task trash, no cron needed
    await Workspace.deleteMany({
      owner: req.user.id,
      deletedAt: { $ne: null, $lt: thirtyDaysAgo },
    });

    const trashed = await Workspace.find({ owner: req.user.id, deletedAt: { $ne: null } })
      .select('name slug deletedAt createdAt');

    res.json(trashed);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /workspaces/:workspaceId/restore — owner only
const restoreWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      owner: req.user.id,
      deletedAt: { $ne: null },
    });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found in trash' });

    workspace.deletedAt = null;
    await workspace.save();
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /workspaces/:workspaceId/purge — owner only, permanent
const purgeWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      owner: req.user.id,
      deletedAt: { $ne: null },
    });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found in trash' });

    await workspace.deleteOne();
    res.json({ message: 'Workspace permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyWorkspaces, createWorkspace, addMember, updateMemberRole, removeMember,
  deleteWorkspace, getWorkspaceTrash, restoreWorkspace, purgeWorkspace,
};
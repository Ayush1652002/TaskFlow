import { useContext, useState } from "react";
import { WorkspaceContext } from "../Context/workspaceContextObject";
import axios from "../api/axios";
import toast from "react-hot-toast";

const ROLES = ["member", "manager", "admin"];

const MembersPanel = () => {
  const { activeWorkspace, myRole, fetchWorkspaces, auth } = useContext(WorkspaceContext);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  const config = { headers: { Authorization: `Bearer ${auth?.accessToken}` } };
  const canManage = myRole === "owner" || myRole === "admin";

  if (!activeWorkspace) return null;

  const handleInvite = async () => {
    if (!email.trim()) return;
    try {
      setInviting(true);
      const res = await axios.post(
        `/workspaces/${activeWorkspace._id}/members`,
        { email: email.trim(), role },
        config
      );
      toast.success(res.data.message || "Member added");
      setEmail("");
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(
        `/workspaces/${activeWorkspace._id}/members/${userId}`,
        { role: newRole },
        config
      );
      toast.success("Role updated");
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this member from the workspace?")) return;
    try {
      await axios.delete(`/workspaces/${activeWorkspace._id}/members/${userId}`, config);
      toast.success("Member removed");
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-medium text-gray-300">
        Members · {activeWorkspace.name}
      </h2>

      {/* Member list */}
      <div className="space-y-2">
        {activeWorkspace.members.map((m) => {
          const userId = m.user._id || m.user;
          const label = m.user.name || m.user.email || userId;
          return (
            <div
              key={userId}
              className="flex items-center justify-between bg-[#1e1e1e] rounded-lg px-3 py-2"
            >
              <span className="text-sm text-gray-200 truncate">{label}</span>

              {m.role === "owner" ? (
                <span className="text-xs text-violet-400 px-2">owner</span>
              ) : canManage ? (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(userId, e.target.value)}
                    className="bg-[#0f0f0f] text-xs text-gray-300 border border-[#2e2e2e] rounded-md px-2 py-1 outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemove(userId)}
                    className="text-xs text-red-400 hover:text-red-300 px-1"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-500 capitalize px-2">{m.role}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite form — only visible to admin/owner */}
      {canManage && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1e1e1e]">
          <input
            type="email"
            placeholder="Invite by email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-[160px] bg-[#1e1e1e] text-sm text-white border border-[#2e2e2e] rounded-lg px-3 py-2 outline-none placeholder-gray-600"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-[#1e1e1e] text-sm text-gray-300 border border-[#2e2e2e] rounded-lg px-3 py-2 outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            {inviting ? "Adding..." : "Add Member"}
          </button>
        </div>
      )}
    </div>
  );
};

export default MembersPanel;

import { useState, useEffect, useContext } from "react";
import { TaskContext } from "../Context/TaskContext";
import { WorkspaceContext } from "../Context/WorkspaceContext";
import MembersPanel from "../Components/MembersPanel";
import axios from "../api/axios";
import toast from "react-hot-toast";

const Settings = () => {
  const [userName, setUserName] = useState("");
  const [defaultPriority, setDefaultPriority] = useState("Medium");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const { tasks, clearAllTasks } = useContext(TaskContext);
  const { auth, activeWorkspace, myRole, deleteWorkspace } = useContext(WorkspaceContext);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingDeleteWorkspace, setConfirmingDeleteWorkspace] = useState(false);

  const config = { headers: { Authorization: `Bearer ${auth?.accessToken}` } };

  // Load the real profile from the backend instead of localStorage
  useEffect(() => {
    axios.get("/users/me", config)
      .then((res) => {
        setUserName(res.data.name || "");
        setDefaultPriority(res.data.defaultPriority || "Medium");
        setIsGuest(res.data.isGuest || false);
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    if (!upgradeEmail.trim() || upgradePassword.length < 6) {
      toast.error("Enter a valid email and a password of at least 6 characters");
      return;
    }
    setUpgrading(true);
    try {
      await axios.post("/users/upgrade", { email: upgradeEmail.trim(), password: upgradePassword }, config);
      setIsGuest(false);
      toast.success("Account upgraded — you can now log in with this email anytime");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upgrade account");
    } finally {
      setUpgrading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch("/users/me", { name: userName, defaultPriority }, config);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClearTasks = () => {
    if (window.confirm("Are you sure?")) clearAllTasks();
  };

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-gray-300">Profile</h2>
        <div className="space-y-2">
          <label htmlFor="userName" className="text-xs text-gray-500">Your Name</label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={loading ? "Loading..." : "Enter your name..."}
            disabled={loading}
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Guest upgrade — only shows for accounts created via "Continue as Guest" */}
      {!loading && isGuest && (
        <div className="bg-[#141414] border border-violet-900/40 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-violet-400">Set Up Your Account</h2>
            <p className="text-xs text-gray-500 mt-1">
              You're using a guest session — it can be lost if you clear cookies. Add an email and
              password to save your account permanently and log back in anytime.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="upgradeEmail" className="text-xs text-gray-500">Email</label>
            <input
              id="upgradeEmail"
              type="email"
              value={upgradeEmail}
              onChange={(e) => setUpgradeEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="upgradePassword" className="text-xs text-gray-500">Password</label>
            <input
              id="upgradePassword"
              type="password"
              value={upgradePassword}
              onChange={(e) => setUpgradePassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600"
            />
          </div>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg transition"
          >
            {upgrading ? "Setting up..." : "Save Account"}
          </button>
        </div>
      )}

      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-gray-300">Preferences</h2>
        <div className="space-y-2">
          <label htmlFor="defaultPriority" className="text-xs text-gray-500">Default Priority</label>
          <select
            id="defaultPriority"
            value={defaultPriority}
            onChange={(e) => setDefaultPriority(e.target.value)}
            disabled={loading}
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-gray-300 outline-none disabled:opacity-50"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg transition"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>

      <MembersPanel />

      {/* Danger Zone */}
      <div className="bg-[#141414] border border-red-900/30 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>

        <div className="space-y-2">
          <p className="text-xs text-gray-500">Moves every task in this workspace to Trash (recoverable for 30 days).</p>
          {!confirmingClear ? (
            <button onClick={() => setConfirmingClear(true)}
              aria-label="Clear all tasks in this workspace"
              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm px-4 py-2 rounded-lg transition">
              Clear All Tasks
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-xs text-red-400">Move all tasks to Trash?</p>
              <button onClick={() => { handleClearTasks(); setConfirmingClear(false); }}
                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg">
                Confirm
              </button>
              <button onClick={() => setConfirmingClear(false)}
                className="text-xs px-3 py-1.5 bg-[#1e1e1e] text-gray-400 rounded-lg">
                Cancel
              </button>
            </div>
          )}
        </div>

        {myRole === "owner" && activeWorkspace && (
          <div className="space-y-2 pt-4 border-t border-red-900/20">
            <p className="text-xs text-gray-500">
              Deletes the entire workspace "{activeWorkspace.name}" (recoverable for 30 days from Trash).
            </p>
            {!confirmingDeleteWorkspace ? (
              <button onClick={() => setConfirmingDeleteWorkspace(true)}
                aria-label="Delete this workspace"
                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm px-4 py-2 rounded-lg transition">
                Delete Workspace
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-red-400">Delete "{activeWorkspace.name}"?</p>
                <button onClick={() => { deleteWorkspace(activeWorkspace._id); setConfirmingDeleteWorkspace(false); }}
                  className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg">
                  Confirm
                </button>
                <button onClick={() => setConfirmingDeleteWorkspace(false)}
                  className="text-xs px-3 py-1.5 bg-[#1e1e1e] text-gray-400 rounded-lg">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Settings;

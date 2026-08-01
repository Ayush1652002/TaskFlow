import { useState, useEffect } from "react";
import { useContext } from "react";
import { TaskContext } from "../Context/TaskContext";

const Settings = () => {
  const [userName, setUserName] = useState("");
  const [defaultPriority, setDefaultPriority] = useState("Medium");
  const [saved, setSaved] = useState(false);
  const { tasks, clearAllTasks } = useContext(TaskContext);
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const priority = localStorage.getItem("defaultPriority");
    if (name) setUserName(name);
    if (priority) setDefaultPriority(priority);
  }, []);

  const handleSave = () => {
    localStorage.setItem("userName", userName);
    localStorage.setItem("defaultPriority", defaultPriority);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <label className="text-xs text-gray-500">Your Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600"
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-gray-300">Preferences</h2>
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Default Priority</label>
          <select
            value={defaultPriority}
            onChange={(e) => setDefaultPriority(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-gray-300 outline-none"
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
        className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-6 py-2 rounded-lg transition"
      >
        {saved ? "Saved ✓" : "Save Settings"}
      </button>

      {/* Danger Zone */}
      <div className="bg-[#141414] border border-red-900/30 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>
        <p className="text-xs text-gray-500">This will permanently delete all your tasks.</p>
        {!confirmingClear ? (
  <button onClick={() => setConfirmingClear(true)}
    className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm px-4 py-2 rounded-lg transition">
    Clear All Tasks
  </button>
) : (
  <div className="flex items-center gap-3">
    <p className="text-xs text-red-400">This cannot be undone.</p>
    <button onClick={() => { handleClearTasks(); setConfirmingClear(false); }}
      className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg">
      Confirm Delete
    </button>
    <button onClick={() => setConfirmingClear(false)}
      className="text-xs px-3 py-1.5 bg-[#1e1e1e] text-gray-400 rounded-lg">
      Cancel
    </button>
  </div>
)}
      </div>

    </div>
  );
};

export default Settings;
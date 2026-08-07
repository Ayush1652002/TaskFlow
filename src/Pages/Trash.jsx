import { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { WorkspaceContext } from "../Context/WorkspaceContext";
import toast from "react-hot-toast";

const Trash = () => {
  const { activeWorkspace, auth, fetchWorkspaces } = useContext(WorkspaceContext);
  const [trashedTasks, setTrashedTasks] = useState([]);
  const [trashedWorkspaces, setTrashedWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const config = { headers: { Authorization: `Bearer ${auth?.accessToken}` } };

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const [taskRes, wsRes] = await Promise.all([
        activeWorkspace ? axios.get(`/tasks/${activeWorkspace._id}/trash`, config) : Promise.resolve({ data: [] }),
        axios.get("/workspaces/trash", config),
      ]);
      setTrashedTasks(taskRes.data);
      setTrashedWorkspaces(wsRes.data);
    } catch {
      toast.error("Failed to load trash");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, [activeWorkspace]);

  const daysLeft = (deletedAt) => {
    const elapsed = Date.now() - new Date(deletedAt).getTime();
    const remaining = 30 - Math.floor(elapsed / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  const handleRestoreTask = async (id) => {
    try {
      await axios.patch(`/tasks/${activeWorkspace._id}/${id}/restore`, {}, config);
      setTrashedTasks(prev => prev.filter(t => t._id !== id));
      toast.success("Task restored");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore task");
    }
  };

  const handlePurgeTask = async (id) => {
    if (!window.confirm("Permanently delete this task? This cannot be undone.")) return;
    try {
      await axios.delete(`/tasks/${activeWorkspace._id}/${id}/purge`, config);
      setTrashedTasks(prev => prev.filter(t => t._id !== id));
      toast.success("Task permanently deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  const handleRestoreWorkspace = async (id) => {
    try {
      await axios.patch(`/workspaces/${id}/restore`, {}, config);
      setTrashedWorkspaces(prev => prev.filter(w => w._id !== id));
      fetchWorkspaces();
      toast.success("Workspace restored");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore workspace");
    }
  };

  const handlePurgeWorkspace = async (id) => {
    if (!window.confirm("Permanently delete this workspace and everything in it? This cannot be undone.")) return;
    try {
      await axios.delete(`/workspaces/${id}/purge`, config);
      setTrashedWorkspaces(prev => prev.filter(w => w._id !== id));
      toast.success("Workspace permanently deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete workspace");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Trash</h1>
        <p className="text-sm text-gray-500 mt-1">Items are kept for 30 days, then permanently removed.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : (
        <>
          {/* Deleted tasks — scoped to the active workspace */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-300">
              Deleted Tasks {activeWorkspace && `· ${activeWorkspace.name}`}
            </h2>
            {trashedTasks.length === 0 ? (
              <p className="text-xs text-gray-600">No deleted tasks here</p>
            ) : (
              trashedTasks.map((t) => (
                <div key={t._id} className="flex items-center justify-between bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">{t.title}</p>
                    <p className="text-xs text-gray-600">{daysLeft(t.deletedAt)} days left</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleRestoreTask(t._id)} className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition">
                      Restore
                    </button>
                    <button onClick={() => handlePurgeTask(t._id)} className="text-xs px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition">
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Deleted workspaces — global, not tied to activeWorkspace */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-300">Deleted Workspaces</h2>
            {trashedWorkspaces.length === 0 ? (
              <p className="text-xs text-gray-600">No deleted workspaces</p>
            ) : (
              trashedWorkspaces.map((w) => (
                <div key={w._id} className="flex items-center justify-between bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">{w.name}</p>
                    <p className="text-xs text-gray-600">{daysLeft(w.deletedAt)} days left</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleRestoreWorkspace(w._id)} className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition">
                      Restore
                    </button>
                    <button onClick={() => handlePurgeWorkspace(w._id)} className="text-xs px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition">
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Trash;

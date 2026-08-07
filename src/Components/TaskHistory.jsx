import { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { WorkspaceContext } from "../Context/workspaceContextObject";

const TaskHistory = ({ taskId }) => {
  const { activeWorkspace, auth } = useContext(WorkspaceContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace?._id) return;
    const config = { headers: { Authorization: `Bearer ${auth?.accessToken}` } };
    axios
      .get(`/tasks/${activeWorkspace._id}/${taskId}/history`, config)
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false));
  }, [taskId, activeWorkspace?._id, auth?.accessToken]);

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-500">History</label>
      {loading ? (
        <p className="text-xs text-gray-600">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-xs text-gray-600">No changes recorded yet</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {history.map((h) => (
            <div key={h._id} className="text-xs text-gray-400 flex justify-between gap-2">
              <span>
                <span className="text-gray-200">{h.user?.name}</span> {h.message}
                {h.field && (
                  <span className="text-gray-500">
                    {" "}({String(h.from) || "empty"} → {String(h.to)})
                  </span>
                )}
              </span>
              <span className="text-gray-600 flex-shrink-0">
                {new Date(h.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskHistory;

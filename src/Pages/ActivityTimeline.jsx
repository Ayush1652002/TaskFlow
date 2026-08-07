import { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { WorkspaceContext } from "../Context/WorkspaceContext";

const TYPE_ICON = {
  task_created: "✨",
  task_updated: "✏️",
  task_completed: "✅",
  task_deleted: "🗑️",
  comment_added: "💬",
};

const ActivityTimeline = () => {
  const { activeWorkspace, auth } = useContext(WorkspaceContext);
  const [activity, setActivity] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    const config = { headers: { Authorization: `Bearer ${auth?.accessToken}` } };
    axios
      .get(`/activity/${activeWorkspace._id}?page=${page}&limit=20`, config)
      .then((res) => {
        setActivity(res.data.activity);
        setTotalPages(res.data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace, page]);

  if (!activeWorkspace) {
    return <p className="text-gray-500 text-sm">Select a workspace to view its activity.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-white mb-1">Activity</h1>
      <p className="text-sm text-gray-500 mb-6">{activeWorkspace.name}</p>

      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : activity.length === 0 ? (
        <p className="text-sm text-gray-600">Nothing has happened here yet.</p>
      ) : (
        <div className="space-y-2">
          {activity.map((a) => (
            <div key={a._id} className="flex items-start gap-3 bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-3">
              <span className="text-base">{TYPE_ICON[a.type] || "•"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">
                  <span className="font-medium">{a.user?.name || "Someone"}</span> {a.message}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 text-sm bg-[#1e1e1e] disabled:opacity-30 text-gray-300 rounded-md"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500 px-2 py-1">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 text-sm bg-[#1e1e1e] disabled:opacity-30 text-gray-300 rounded-md"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;

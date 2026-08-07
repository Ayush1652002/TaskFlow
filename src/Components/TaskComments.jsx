import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "../api/axios";
import { WorkspaceContext } from "../Context/workspaceContextObject";
import toast from "react-hot-toast";

const TaskComments = ({ taskId }) => {
  const { activeWorkspace, auth } = useContext(WorkspaceContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const config = useMemo(
    () => ({ headers: { Authorization: `Bearer ${auth?.accessToken}` } }),
    [auth?.accessToken]
  );
  const base = `/tasks/${activeWorkspace?._id}/${taskId}/comments`;

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(base, config);
      setComments(res.data);
    } catch {
      // silent — comments are secondary content, don't block the task panel over it
    } finally {
      setLoading(false);
    }
  }, [base, config]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handlePost = async () => {
    if (!text.trim()) return;
    try {
      const res = await axios.post(base, { text: text.trim() }, config);
      setComments(prev => [...prev, res.data]);
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs text-gray-500">
        Comments · use @name to mention a workspace member
      </label>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-gray-600">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-600">No comments yet</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="bg-[#1e1e1e] rounded-lg px-3 py-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-violet-400">{c.author?.name}</span>
                <span className="text-[10px] text-gray-600">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-200 mt-1">{c.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePost()}
          placeholder="Write a comment..."
          className="flex-1 bg-[#1e1e1e] text-sm text-white rounded-lg px-3 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition"
        />
        <button
          onClick={handlePost}
          className="px-4 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default TaskComments;

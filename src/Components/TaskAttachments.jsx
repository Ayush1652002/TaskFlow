import { useState, useContext, useRef } from "react";
import axios from "../api/axios";
import { WorkspaceContext } from "../Context/workspaceContextObject";
import toast from "react-hot-toast";

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TaskAttachments = ({ task, onUpdated }) => {
  const { activeWorkspace, auth } = useContext(WorkspaceContext);
  const attachments = task.attachments || [];
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const base = `/tasks/${activeWorkspace?._id}/${task._id}/attachments`;
  const authHeader = { Authorization: `Bearer ${auth?.accessToken}` };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post(base, formData, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
      onUpdated?.([...attachments, res.data]);
      toast.success("File attached");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await axios.delete(`${base}/${attachmentId}`, { headers: authHeader });
      onUpdated?.(attachments.filter(a => a._id !== attachmentId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete attachment");
    }
  };

  // Downloads the file with authentication token and triggers the OS Save prompt
  const handleDownload = async (attachment) => {
    try {
      const res = await axios.get(`${base}/${attachment._id}`, {
        headers: authHeader,
        responseType: "blob",
      });

      // Construct blob with safe content type fallback
      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Always specify link.download to trigger the browser's native Save As prompt
      link.setAttribute("download", attachment.originalName);
      document.body.appendChild(link);
      link.click();

      // Clean up link and revoke temporary object URL
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Download error details:", err);
      toast.error(err.response?.data?.message || "Could not download this file");
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs text-gray-500">Attachments</label>

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((a) => (
            <div key={a._id} className="flex items-center justify-between bg-[#1e1e1e] rounded-lg px-3 py-2">
              <button
                type="button"
                onClick={() => handleDownload(a)}
                className="text-xs text-gray-200 hover:text-violet-400 transition truncate flex-1 text-left"
              >
                📎 {a.originalName} <span className="text-gray-600">({formatSize(a.size)})</span>
              </button>
              <button
                onClick={() => handleDelete(a._id)}
                aria-label={`Remove ${a.originalName}`}
                className="text-xs text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="block">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <span
          onClick={() => fileInputRef.current?.click()}
          className="inline-block cursor-pointer text-xs px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2e2e2e] text-gray-300 rounded-lg transition"
        >
          {uploading ? "Uploading..." : "+ Attach file"}
        </span>
      </label>
    </div>
  );
};

export default TaskAttachments;
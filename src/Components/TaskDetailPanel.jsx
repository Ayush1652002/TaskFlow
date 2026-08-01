import { useState, useContext } from "react";
import { TaskContext } from "../Context/TaskContext";

const TaskDetailPanel = ({ task, onClose }) => {
  const { updateTask, toggleTask, deleteTask } = useContext(TaskContext);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const handleSave = () => {
    updateTask(task._id, title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-[#141414] border-l border-[#1e1e1e] h-full p-6 space-y-6 overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-400">Task Detail</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition text-lg">✕</button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1e1e1e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-[#1e1e1e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition resize-none"
          />
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Priority</label>
            <p className="text-sm text-white">{task.priority}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Category</label>
            <p className="text-sm text-white">{task.category}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Status</label>
            <p className="text-sm text-white capitalize">{task.status}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Due Date</label>
            <p className="text-sm text-white">{task.dueDate || "No due date"}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${task.completed ? "bg-green-400" : "bg-yellow-400"}`} />
          <span className="text-xs text-gray-400">{task.completed ? "Completed" : "Pending"}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg transition"
          >
            Save
          </button>
          <button
            onClick={() => { toggleTask(task._id); onClose(); }}
            className="flex-1 bg-[#1e1e1e] hover:bg-[#2e2e2e] text-gray-300 text-sm py-2 rounded-lg transition"
          >
            {task.completed ? "Mark Pending" : "Mark Done"}
          </button>
          <button
            onClick={() => { deleteTask(task._id); onClose(); }}
            className="px-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm py-2 rounded-lg transition"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
};

export default TaskDetailPanel;
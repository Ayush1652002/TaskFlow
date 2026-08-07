import { useState, useContext } from "react";
import { TaskContext } from "../Context/TaskContext";
import { WorkspaceContext } from "../Context/WorkspaceContext";
import TaskComments from "./TaskComments";
import TaskHistory from "./TaskHistory";
import TaskAttachments from "./TaskAttachments";

const TaskDetailPanel = ({ task, onClose }) => {
  const { editTask, toggleTask, deleteTask } = useContext(TaskContext);
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [category, setCategory] = useState(task.category);
  const [status, setStatus] = useState(task.status);
  const [assignee, setAssignee] = useState(task.assignee?._id || task.assignee || "");
  const [recurrence, setRecurrence] = useState(task.recurrence || "none");
  // dueDate from the API is an ISO string; <input type="date"> needs yyyy-mm-dd
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await editTask(task._id, { title, description, priority, category, status, dueDate, assignee: assignee || null, recurrence });
      onClose();
    } finally {
      setSaving(false);
    }
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

        {/* Meta — now real inputs, not read-only text */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-[#1e1e1e] text-white text-sm rounded-lg px-2 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1e1e1e] text-white text-sm rounded-lg px-2 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition"
            >
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="College">College</option>
              <option value="Health">Health</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#1e1e1e] text-white text-sm rounded-lg px-2 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition capitalize"
            >
              <option value="todo">Todo</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#1e1e1e] text-white text-sm rounded-lg px-2 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-[#1e1e1e] text-white text-sm rounded-lg px-2 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition"
            >
              <option value="">Unassigned</option>
              {activeWorkspace?.members?.map((m) => {
                const memberId = m.user._id || m.user;
                const memberName = m.user.name || "Unknown";
                return (
                  <option key={memberId} value={memberId}>{memberName}</option>
                );
              })}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Repeat</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full bg-[#1e1e1e] text-white text-sm rounded-lg px-2 py-2 outline-none border border-[#2e2e2e] focus:border-violet-500 transition"
            >
              <option value="none">Doesn't repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
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
            disabled={saving}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition"
          >
            {saving ? "Saving..." : "Save"}
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

        <hr className="border-[#1e1e1e]" />
        <TaskAttachments task={task} />

        <hr className="border-[#1e1e1e]" />
        <TaskComments taskId={task._id} />

        <hr className="border-[#1e1e1e]" />
        <TaskHistory taskId={task._id} />

      </div>
    </div>
  );
};

export default TaskDetailPanel;

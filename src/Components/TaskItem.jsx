import { useContext, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskContext } from "../Context/TaskContext";
import { formatDueDate } from '../utils/dateHelpers';
import TaskDetailPanel from "./TaskDetailPanel";

const TaskItem = ({ task }) => {
  const { toggleTask, deleteTask, updateTask } = useContext(TaskContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [showDetail, setShowDetail] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const saveEdit = () => {
    updateTask(task._id, editValue);
    setIsEditing(false);
  };

  const priorityColors = {
    High: "text-red-400 bg-red-400/10",
    Medium: "text-yellow-400 bg-yellow-400/10",
    Low: "text-green-400 bg-green-400/10",
  };

  const isOverdue = task.dueDate &&
    new Date(task.dueDate) < new Date(new Date().toDateString()) &&
    !task.completed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-[#141414] border border-[#1e1e1e] hover:border-[#2e2e2e] rounded-xl px-4 py-3 transition group"
    >
      {/* Drag Handle */}
      <span
        {...attributes}
        {...listeners}
        className="text-gray-600 cursor-grab hover:text-gray-400 transition"
      >
        ⠿
      </span>

      {/* Checkbox */}
      <button
        onClick={() => toggleTask(task._id)}
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition ${task.completed
            ? "bg-violet-600 border-violet-600"
            : "border-gray-600 hover:border-violet-500"
          }`}
      />

      {/* Title */}
      <div className="flex-1 cursor-pointer" onClick={() => setShowDetail(true)}>
        {isEditing ? (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            onBlur={saveEdit}
            autoFocus
            className="bg-transparent text-sm text-white outline-none w-full"
          />
        ) : (
          <div className="flex flex-col">
            <span className={`text-sm ${task.completed ? "line-through text-gray-500" : "text-gray-200"}`}>
              {task.title}
            </span>
            {task.description && (
              <span className="text-xs text-gray-500 mt-0.5">{task.description}</span>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>

        {task.category && task.category !== "General" && (
          <span className="text-xs px-2 py-0.5 rounded-md text-violet-400 bg-violet-400/10">
            {task.category}
          </span>
        )}

        {task.dueDate && (
  <span className={`text-xs px-2 py-0.5 rounded-md ${
    formatDueDate(task.dueDate) === 'Overdue' ? 'text-red-400 bg-red-400/10' :
    formatDueDate(task.dueDate) === 'Today' ? 'text-yellow-400 bg-yellow-400/10' :
    formatDueDate(task.dueDate) === 'Tomorrow' ? 'text-blue-400 bg-blue-400/10' :
    'text-gray-400 bg-white/5'
  }`}>
    📅 {formatDueDate(task.dueDate)}
  </span>
)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs px-2 py-1 rounded-lg bg-[#1e1e1e] text-gray-400 hover:text-white transition"
        >
          Edit
        </button>
        <button
          onClick={() => deleteTask(task._id)}
          className="text-xs px-2 py-1 rounded-lg bg-[#1e1e1e] text-red-400 hover:text-red-300 transition"
        >
          Delete
        </button>
      </div>
    {showDetail && <TaskDetailPanel task={task} onClose={() => setShowDetail(false)} />}
    </div>
  );
};

export default TaskItem;
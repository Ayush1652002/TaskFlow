import { useContext, useState, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskContext } from "../Context/taskContextObject";
import { formatDueDate } from '../utils/dateHelpers';
import TaskDetailPanel from "./TaskDetailPanel";

const TaskItemComponent = ({ task }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 bg-[#141414] border border-[#1e1e1e] hover:border-[#2e2e2e] rounded-xl px-4 py-3 transition group border-l-2 ${
        task.priority === "High" ? "border-l-red-500/60" :
        task.priority === "Medium" ? "border-l-yellow-500/60" :
        "border-l-green-500/60"
      }`}
    >
      {/* Drag Handle */}
      <span
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label={`Reorder task: ${task.title}`}
        className="text-gray-600 cursor-grab hover:text-gray-400 transition"
      >
        ⠿
      </span>

      {/* Checkbox */}
      <button
        onClick={() => toggleTask(task._id)}
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as complete`}
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition ${task.completed
            ? "bg-violet-600 border-violet-600"
            : "border-gray-600 hover:border-violet-500"
          }`}
      />

      {/* Title */}
      <div className="flex-1 cursor-pointer relative group/title" onClick={() => setShowDetail(true)}>
        <span className="pointer-events-none absolute -top-7 left-0 text-[10px] text-gray-300 bg-[#2e2e2e] px-2 py-1 rounded-md opacity-0 group-hover/title:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          Click to edit task
        </span>
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

        {task.assignee?.name && (
          <span className="text-xs px-2 py-0.5 rounded-md text-gray-300 bg-white/5">
            👤 {task.assignee.name}
          </span>
        )}

        {task.recurrence && task.recurrence !== "none" && (
          <span className="text-xs px-2 py-0.5 rounded-md text-blue-300 bg-blue-400/10" title={`Repeats ${task.recurrence}`}>
            🔁 {task.recurrence}
          </span>
        )}

        {task.attachments?.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-md text-gray-300 bg-white/5">
            📎 {task.attachments.length}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${task.title}"`}
          className="text-xs px-2 py-1 rounded-lg bg-[#1e1e1e] text-gray-400 hover:text-white transition"
        >
          Edit
        </button>
        <button
          onClick={() => deleteTask(task._id)}
          aria-label={`Delete "${task.title}"`}
          className="text-xs px-2 py-1 rounded-lg bg-[#1e1e1e] text-red-400 hover:text-red-300 transition"
        >
          Delete
        </button>
      </div>
    {showDetail && <TaskDetailPanel task={task} onClose={() => setShowDetail(false)} />}
    </div>
  );
};

// Wrapped in memo: task functions (toggleTask/deleteTask/updateTask) come
// from Context and are stable references, so without this every task's row
// would re-render whenever ANY task in the list changed — with memo, only
// the row whose own `task` prop actually changed re-renders.
const TaskItem = memo(TaskItemComponent, (prev, next) =>
  prev.task._id === next.task._id &&
  prev.task.title === next.task.title &&
  prev.task.description === next.task.description &&
  prev.task.completed === next.task.completed &&
  prev.task.priority === next.task.priority &&
  prev.task.category === next.task.category &&
  prev.task.dueDate === next.task.dueDate &&
  prev.task.status === next.task.status &&
  prev.task.recurrence === next.task.recurrence &&
  (prev.task.attachments?.length || 0) === (next.task.attachments?.length || 0) &&
  (prev.task.assignee?._id || prev.task.assignee) === (next.task.assignee?._id || next.task.assignee)
);

export default TaskItem;
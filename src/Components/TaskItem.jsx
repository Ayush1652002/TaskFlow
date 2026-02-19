import { useState, useContext } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskContext } from "../Context/TaskContext";

const TaskItem = ({ task }) => {
  const { toggleTask, deleteTask, editTask } = useContext(TaskContext);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const saveEdit = () => {
    if (!editValue.trim()) return;
    editTask(task.id, editValue);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between shadow-md"
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 flex-1">
        {/* Drag Handle */}
        <div
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-white"
        >
          ☰
        </div>

        {/* Status Dot */}
        <div
          className={`w-3 h-3 rounded-full ${
            task.completed ? "bg-green-400" : "bg-gray-400"
          }`}
        />

        {/* Title + Priority */}
        <div className="flex items-center">
          {isEditing ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              className="bg-slate-700 text-white px-3 py-1 rounded-lg outline-none"
              autoFocus
            />
          ) : (
            <>
              <span
                className={`text-white ${
                  task.completed ? "line-through text-gray-500" : ""
                }`}
              >
                {task.title}
              </span>

              {/* Priority Badge */}
              <span
                className={`ml-3 px-2 py-1 text-xs rounded-md ${
                  task.priority === "High"
                    ? "bg-red-500/20 text-red-400"
                    : task.priority === "Medium"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                {task.priority}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Section Buttons */}
      <div className="flex items-center gap-2">
        {/* Complete */}
        <button
          onClick={() => toggleTask(task.id)}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-white"
        >
          ✓
        </button>

        {/* Edit */}
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-white"
        >
          ✎
        </button>

        {/* Delete */}
        <button
          onClick={() => deleteTask(task.id)}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default TaskItem;

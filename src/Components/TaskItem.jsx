import { useContext, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskContext } from "../Context/TaskContext";

const TaskItem = ({ task }) => {
  const { toggleTask, deleteTask, updateTask } = useContext(TaskContext);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const saveEdit = () => {
    if (editedTitle.trim()) {
      updateTask(task.id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-slate-800 border border-slate-700 px-6 py-4 rounded-2xl flex justify-between items-center shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="flex items-center gap-4 flex-1">

        {/* DRAG HANDLE ONLY */}
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 select-none"
        >
          ☰
        </div>

        <div
          className={`w-3 h-3 rounded-full ${
            task.completed ? "bg-green-400" : "bg-gray-400"
          }`}
        />

        {isEditing ? (
          <input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
            }}
            className="bg-slate-700 text-white px-3 py-1 rounded-lg w-full outline-none"
            autoFocus
          />
        ) : (
          <span
            className={`text-white ${
              task.completed ? "line-through text-gray-500" : ""
            }`}
          >
            {task.title}
          </span>
        )}
      </div>

      <div className="flex gap-3">

        <button
          onClick={() => toggleTask(task.id)}
          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 rounded-lg transition"
        >
          ✓
        </button>

        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg transition"
        >
          ✏
        </button>

        <button
          onClick={() => deleteTask(task.id)}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition"
        >
          ✕
        </button>

      </div>
    </li>
  );
};

export default TaskItem;

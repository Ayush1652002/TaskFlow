import { useContext, useState } from "react";
import { TaskContext } from "../Context/taskContextObject";
import { formatDueDate } from "../utils/dateHelpers";
import TaskDetailPanel from "./TaskDetailPanel";

const columns = [
  { id: "todo", label: "Todo" },
  { id: "inprogress", label: "In Progress" },
  { id: "done", label: "Done" },
];

const priorityColors = {
  High: "text-red-400 bg-red-400/10",
  Medium: "text-yellow-400 bg-yellow-400/10",
  Low: "text-green-400 bg-green-400/10",
};

const BoardView = () => {
  const { tasks, updateTaskStatus, deleteTask } = useContext(TaskContext);
  const [selectedTask, setSelectedTask] = useState(null);

  const getColumnTasks = (columnId) => {
    if (columnId === "done") return tasks.filter(t => t.completed);
    if (columnId === "todo") return tasks.filter(t => !t.completed && t.status === "todo");
    if (columnId === "inprogress") return tasks.filter(t => !t.completed && t.status === "inprogress");
    return [];
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 space-y-3">

            {/* Column Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">{col.label}</h3>
              <span className="text-xs text-gray-600 bg-[#1e1e1e] px-2 py-0.5 rounded-full">
                {getColumnTasks(col.id).length}
              </span>
            </div>

            {/* Tasks */}
            {getColumnTasks(col.id).length === 0 && (
              <p className="text-xs text-gray-600 text-center py-6">
                {col.id === "todo" ? "All tasks in progress 🎯" : "No tasks here"}
              </p>
            )}

            {getColumnTasks(col.id).map(task => (
              <div
                key={task._id}
                onClick={() => setSelectedTask(task)}
                className="bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#2e2e2e] rounded-lg p-3 space-y-2 transition cursor-pointer"
              >

                {/* Title */}
                <p className={`text-sm ${task.completed ? "line-through text-gray-500" : "text-gray-200"}`}>
                  {task.title}
                </p>

                {/* Description */}
                {task.description && (
                  <p className="text-xs text-gray-500">{task.description}</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
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
                      new Date(task.dueDate) < new Date(new Date().toDateString()) && !task.completed
                        ? "text-red-400 bg-red-400/10"
                        : "text-gray-400 bg-white/5"
                    }`}>
                      📅 {formatDueDate(task.dueDate)}
                    </span>
                  )}
                  {task.attachments?.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-md text-gray-300 bg-white/5">
                      📎 {task.attachments.length}
                    </span>
                  )}
                </div>

                {/* Status Buttons */}
                <div
                  className="flex gap-1 flex-wrap pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {col.id !== "todo" && (
                    <button
                      onClick={() => updateTaskStatus(task._id, "todo")}
                      className="text-xs px-2 py-1 rounded-md bg-[#1e1e1e] text-gray-400 hover:text-white transition"
                    >
                      Todo
                    </button>
                  )}
                  {col.id !== "inprogress" && !task.completed && (
                    <button
                      onClick={() => updateTaskStatus(task._id, "inprogress")}
                      className="text-xs px-2 py-1 rounded-md bg-[#1e1e1e] text-yellow-400 hover:text-yellow-300 transition"
                    >
                      In Progress
                    </button>
                  )}
                  {col.id !== "done" && (
                    <button
                      onClick={() => updateTaskStatus(task._id, "done")}
                      className="text-xs px-2 py-1 rounded-md bg-[#1e1e1e] text-violet-400 hover:text-violet-300 transition"
                    >
                      Done
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="text-xs px-2 py-1 rounded-md bg-[#1e1e1e] text-red-400 hover:text-red-300 transition ml-auto"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}

          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
};

export default BoardView;
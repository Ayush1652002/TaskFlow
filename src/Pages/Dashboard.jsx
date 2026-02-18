import { useContext, useState } from "react";
import { TaskContext } from "../Context/TaskContext";
import TaskItem from "../Components/TaskItem";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";

const Dashboard = () => {
  const { tasks, addTask, reorderTasks } = useContext(TaskContext);

  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("all");

  const handleAdd = () => {
    if (!newTask.trim()) return;
    addTask(newTask);
    setNewTask("");
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const filteredTasks = tasks.filter(task => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);

    reorderTasks(arrayMove(tasks, oldIndex, newIndex));
  };

  return (
    <div>

      <h2 className="text-4xl font-semibold mb-10">
        Dashboard
      </h2>

      {/* Input */}
      <div className="flex gap-4 mb-12">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter task..."
          className="flex-1 bg-slate-800 border border-slate-700 px-5 py-3 rounded-2xl outline-none"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-2xl font-medium transition"
        >
          Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 mb-14">
        {[
          { label: "Total Tasks", value: tasks.length },
          { label: "Completed", value: completedCount },
          { label: "Pending", value: pendingCount }
        ].map((card, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-slate-800/70 to-slate-900/70
            border border-slate-700/60 p-8 rounded-3xl
            shadow-xl hover:-translate-y-1 hover:shadow-2xl
            transition-all duration-300"
          >
            <p className="text-slate-400 text-sm mb-3">
              {card.label}
            </p>
            <p className="text-4xl font-bold">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-10">
        {["all", "completed", "pending"].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-6 py-2 rounded-xl font-medium transition ${
              filter === type
                ? "bg-blue-600 shadow-lg"
                : "bg-slate-800 hover:bg-slate-700 text-gray-300"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Drag Area */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-5">
            {filteredTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

    </div>
  );
};

export default Dashboard;

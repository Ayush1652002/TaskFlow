import { useContext, useState } from "react";
import { TaskContext } from "../Context/TaskContext";
import TaskItem from "../Components/TaskItem";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import BoardView from "../Components/BoardView";
import TaskSkeleton from '../Components/TaskSkeleton';

const Dashboard = ({ auth }) => {
  const { tasks, loading, totalPages, currentPage, fetchTasks, addTask, reorderTasks } = useContext(TaskContext);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("General");
  const [view, setView] = useState("list");
  const [sortBy, setSortBy] = useState("order");
  const [sortOrder, setSortOrder] = useState("asc");
  const [recurrence, setRecurrence] = useState("none");

  const handleAdd = () => {
    if (!newTask.trim()) return;
    addTask({ title: newTask, priority, dueDate: newDueDate, description, category, recurrence });
    setNewTask("");
    setNewDueDate("");
    setPriority("Medium");
    setDescription("");
    setCategory("General");
    setRecurrence("none");
  };

  const handleSortChange = (field) => {
    // Clicking the same field again flips direction; picking a new field defaults to ascending
    const nextOrder = field === sortBy && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(nextOrder);
    fetchTasks(1, search, filter, "", field, nextOrder);
  };

  const filteredTasks = (tasks || []).filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    if (filter === "completed") return task.completed && matchesSearch;
    if (filter === "pending") return !task.completed && matchesSearch;
    return matchesSearch;
  });

  const completedCount = (tasks || []).filter(t => t.completed).length;
  const pendingCount = (tasks || []).filter(t => !t.completed).length;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex(t => t._id === active.id);
    const newIndex = tasks.findIndex(t => t._id === over.id);
    const reordered = [...tasks];
    reordered.splice(newIndex, 0, reordered.splice(oldIndex, 1)[0]);
    reorderTasks(reordered);
  };

  // PointerSensor handles mouse/touch; KeyboardSensor makes the same reorder
  // possible via Tab -> Space (pick up) -> Arrow keys (move) -> Space (drop).
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
        Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {auth?.name} 👋
       </h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track your tasks</p>
      </div>

      {/* Add Task */}
      <div className="flex flex-col gap-3 bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="bg-transparent text-sm text-white placeholder-gray-500 outline-none"
        />
        <input
          type="text"
          placeholder="Add description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-transparent text-xs text-gray-400 placeholder-gray-600 outline-none"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-[#1e1e1e] text-sm text-gray-300 border border-[#2e2e2e] rounded-lg px-3 py-2 outline-none"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#1e1e1e] text-sm text-gray-300 border border-[#2e2e2e] rounded-lg px-3 py-2 outline-none"
          >
            <option>General</option>
            <option>Work</option>
            <option>Personal</option>
            <option>College</option>
            <option>Health</option>
          </select>
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="bg-[#1e1e1e] text-sm text-gray-300 border border-[#2e2e2e] rounded-lg px-3 py-2 outline-none"
          />
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            aria-label="Repeat"
            className="bg-[#1e1e1e] text-sm text-gray-300 border border-[#2e2e2e] rounded-lg px-3 py-2 outline-none"
          >
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={handleAdd}
            className="ml-auto bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Tasks", value: (tasks || []).length },
          { label: "Completed", value: completedCount },
          { label: "Pending", value: pendingCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl md:text-3xl font-semibold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("list")}
          className={`text-sm px-4 py-1.5 rounded-lg transition ${view === "list" ? "bg-violet-600 text-white" : "bg-[#1e1e1e] text-gray-400 hover:text-white"}`}
        >
          📋 List
        </button>
        <button
          onClick={() => setView("board")}
          className={`text-sm px-4 py-1.5 rounded-lg transition ${view === "board" ? "bg-violet-600 text-white" : "bg-[#1e1e1e] text-gray-400 hover:text-white"}`}
        >
          📌 Board
        </button>
      </div>

      {/* Filters */}
      {view === "list" && (
        <div className="flex flex-wrap gap-2">
          {["all", "completed", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-4 py-1.5 rounded-lg transition capitalize ${filter === f ? "bg-violet-600 text-white" : "bg-[#1e1e1e] text-gray-400 hover:text-white"}`}
            >
              {f}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-auto md:ml-auto bg-[#1e1e1e] text-sm text-gray-300 border border-[#2e2e2e] rounded-lg px-3 py-1.5 outline-none placeholder-gray-600"
          />

          <div className="flex gap-1" role="group" aria-label="Sort tasks">
            {[
              { field: "dueDate", label: "Due Date" },
              { field: "priority", label: "Priority" },
              { field: "title", label: "Title" },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSortChange(field)}
                aria-pressed={sortBy === field}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${
                  sortBy === field ? "bg-violet-600 text-white" : "bg-[#1e1e1e] text-gray-400 hover:text-white"
                }`}
              >
                {label} {sortBy === field && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task List */}
      {view === "list" ? (
        loading ? (
          <TaskSkeleton />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {filteredTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1e1e1e] flex items-center justify-center text-2xl">
                      {filter === 'completed' ? '🎉' : filter === 'pending' ? '📋' : '✨'}
                    </div>
                    <p className="text-sm text-gray-400 font-medium">
                      {filter === 'completed' ? 'No completed tasks yet' :
                       filter === 'pending' ? 'No pending tasks' :
                       'No tasks yet'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {filter === 'all' ? 'Add a task above to get started' : 'Try a different filter'}
                    </p>
                  </div>
                )}
                {filteredTasks.map(task => (
                  <TaskItem key={task._id} task={task} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )
      ) : (
        <BoardView />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => fetchTasks(currentPage - 1, search, filter)}
            disabled={currentPage === 1}
            className="text-xs px-3 py-1.5 bg-[#1e1e1e] text-gray-400 rounded-lg disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => fetchTasks(currentPage + 1, search, filter)}
            disabled={currentPage === totalPages}
            className="text-xs px-3 py-1.5 bg-[#1e1e1e] text-gray-400 rounded-lg disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
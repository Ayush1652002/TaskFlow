import { useContext, useState } from "react";
import { TaskContext } from "../Context/TaskContext";
import TaskItem from "../Components/TaskItem";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import BoardView from "../Components/BoardView";

const Dashboard = () => {
  const { tasks, addTask, reorderTasks } = useContext(TaskContext);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("General");
  const [view, setView] = useState("list");


  const handleAdd = () => {
    if (!newTask.trim()) return;
    addTask({ title: newTask, priority, dueDate: newDueDate, description, category });
    setNewTask("");
    setNewDueDate("");
    setPriority("Medium");
    setDescription("");
    setCategory("General")
  };

  const filteredTasks = tasks
  .filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    if (filter === "completed") return task.completed && matchesSearch;
    if (filter === "pending") return !task.completed && matchesSearch;
    return matchesSearch;
  })
  .sort((a, b) => {
    const isOverdue = (task) =>
      task.dueDate &&
      new Date(task.dueDate) < new Date(new Date().toDateString()) &&
      !task.completed;
    if (isOverdue(a) && !isOverdue(b)) return -1;
    if (!isOverdue(a) && isOverdue(b)) return 1;
    return 0;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);
    const reordered = [...tasks];
    reordered.splice(newIndex, 0, reordered.splice(oldIndex, 1)[0]);
    reorderTasks(reordered);
  };

  return (
    <div className="space-y-8">

  

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {localStorage.getItem("userName")
            ? `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, ${localStorage.getItem("userName")} 👋`
            : "Dashboard"}
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
          { label: "Total Tasks", value: tasks.length },
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
          className={`text-sm px-4 py-1.5 rounded-lg transition ${view === "list"
              ? "bg-violet-600 text-white"
              : "bg-[#1e1e1e] text-gray-400 hover:text-white"
            }`}
        >
          📋 List
        </button>
        <button
          onClick={() => setView("board")}
          className={`text-sm px-4 py-1.5 rounded-lg transition ${view === "board"
              ? "bg-violet-600 text-white"
              : "bg-[#1e1e1e] text-gray-400 hover:text-white"
            }`}
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
              className={`text-sm px-4 py-1.5 rounded-lg transition capitalize ${filter === f
                ? "bg-violet-600 text-white"
                : "bg-[#1e1e1e] text-gray-400 hover:text-white"
                }`}
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
        </div>

      )}



      {/* Task List */}
      {view === "list" ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredTasks.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-10">No tasks found.</p>
              )}
              {filteredTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <BoardView />
      )}
    </div>
  );
};

export default Dashboard;
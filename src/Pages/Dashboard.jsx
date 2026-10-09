import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { TaskContext } from "../Context/taskContextObject";
import { WorkspaceContext } from "../Context/workspaceContextObject";
import TaskItem from "../Components/TaskItem";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import BoardView from "../Components/BoardView";
import TaskSkeleton from '../Components/TaskSkeleton';

const Dashboard = ({ auth }) => {
  const { tasks, loading, stats, query, setQuery, totalPages, currentPage, addTask, reorderTasks } = useContext(TaskContext);
  const { activeWorkspace, loading: workspacesLoading, createWorkspace } = useContext(WorkspaceContext);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [view, setView] = useState("list");
  const [recurrence, setRecurrence] = useState("none");
  const [searchText, setSearchText] = useState("");
  const [firstWorkspaceName, setFirstWorkspaceName] = useState("");

  const { filter, sortBy, order: sortOrder } = query;

  // Wait 300 ms after the user stops typing, then ask the SERVER to search.
  // (Before, search only hid rows among the 10 already loaded.)
  useEffect(() => {
    if (searchText === query.search) return;
    const timer = setTimeout(() => setQuery({ search: searchText }), 300);
    return () => clearTimeout(timer);
  }, [searchText, query.search, setQuery]);

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    const added = await addTask({ title: newTask, priority, dueDate: newDueDate, description, category, recurrence });
    if (!added) return; // keep what the user typed if saving failed
    setNewTask("");
    setNewDueDate("");
    setPriority("Medium");
    setDescription("");
    setCategory("General");
    setRecurrence("none");
  };

  // Sort buttons work in 3 clicks: 1st = ascending, 2nd = descending, 3rd = sort off
  // (back to your own manual order, which is the order drag-and-drop uses).
  // The current page is kept - before, sorting threw you back to page 1.
  const handleSortChange = (field) => {
    if (field !== sortBy) {
      setQuery({ sortBy: field, order: "asc", page: currentPage });
    } else if (sortOrder === "asc") {
      setQuery({ sortBy: field, order: "desc", page: currentPage });
    } else {
      setQuery({ sortBy: "order", order: "asc", page: currentPage });
    }
  };

  // Board view shows EVERY task in its three columns (up to 100), list view shows
  // 10 per page. Switching view changes how many tasks we ask the server for.
  useEffect(() => {
    const wantedLimit = view === "board" ? 100 : 10;
    if (query.limit !== wantedLimit) {
      setQuery({ limit: wantedLimit, ...(view === "board" && { filter: "all" }) });
    }
  }, [view, query.limit, setQuery]);
  const handleCreateFirstWorkspace = async (e) => {
    e.preventDefault();
    if (!firstWorkspaceName.trim()) return;
    await createWorkspace(firstWorkspaceName.trim());
    setFirstWorkspaceName("");
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // The saved order only makes sense in "manual" order. While the list is
    // sorted by Due date / Priority / Title the drag would look like it worked
    // and then jump back, so we tell the user instead.
    if (sortBy !== "order" || sortOrder !== "asc") {
      toast("Dragging works in manual order. Clear the sort first.");
      return;
    }

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

  // New accounts (and guests) have no workspace yet. Instead of an app that
  // silently does nothing, we ask them to create their first one.
  if (!workspacesLoading && !activeWorkspace) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-[#141414] border border-[#1e1e1e] rounded-xl p-8 space-y-4 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[#1e1e1e] flex items-center justify-center text-2xl">🏢</div>
        <h1 className="text-xl font-semibold text-white">Welcome, {auth?.name} 👋</h1>
        <p className="text-sm text-gray-500">
          Tasks live inside a workspace. Create your first one to get started.
        </p>
        <form onSubmit={handleCreateFirstWorkspace} className="space-y-3">
          <input
            type="text"
            placeholder="Workspace name (e.g. My Team)"
            value={firstWorkspaceName}
            onChange={(e) => setFirstWorkspaceName(e.target.value)}
            maxLength={60}
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600"
          />
          <button
            type="submit"
            disabled={!firstWorkspaceName.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition"
          >
            Create workspace
          </button>
        </form>
      </div>
    );
  }

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
          { label: "Total Tasks", value: stats.total },
          { label: "Completed", value: stats.completed },
          { label: "Pending", value: stats.pending },
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
      <div className="flex flex-wrap gap-2">
          {view === "list" && ["all", "completed", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setQuery({ filter: f })}
              className={`text-sm px-4 py-1.5 rounded-lg transition capitalize ${filter === f ? "bg-violet-600 text-white" : "bg-[#1e1e1e] text-gray-400 hover:text-white"}`}
            >
              {f}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
                title={sortBy === field && sortOrder === "desc" ? "Click to turn sorting off" : "Click to sort (click again to reverse, a third time to turn off)"}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${
                  sortBy === field ? "bg-violet-600 text-white" : "bg-[#1e1e1e] text-gray-400 hover:text-white"
                }`}
              >
                {label} {sortBy === field && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            ))}
          </div>
      </div>

      {/* Task List */}
      {view === "list" ? (
        loading ? (
          <TaskSkeleton />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1e1e1e] flex items-center justify-center text-2xl">
                      {filter === 'completed' ? '🎉' : filter === 'pending' ? '📋' : '✨'}
                    </div>
                    <p className="text-sm text-gray-400 font-medium">
                      {query.search ? `No tasks match "${query.search}"` :
                       filter === 'completed' ? 'No completed tasks yet' :
                       filter === 'pending' ? 'No pending tasks' :
                       'No tasks yet'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {query.search ? 'Try a different search' :
                       filter === 'all' ? 'Add a task above to get started' : 'Try a different filter'}
                    </p>
                  </div>
                )}
                {tasks.map(task => (
                  <TaskItem key={task._id} task={task} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )
      ) : (
        <BoardView />
      )}

      {view === "board" && stats.total > tasks.length && (
        <p className="text-xs text-gray-500 text-center">
          Showing the first {tasks.length} tasks. Use search to find the others.
        </p>
      )}

      {view === "list" && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setQuery({ page: currentPage - 1 })}
            disabled={currentPage === 1}
            className="text-xs px-3 py-1.5 bg-[#1e1e1e] text-gray-400 rounded-lg disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setQuery({ page: currentPage + 1 })}
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
import { useContext, useState } from "react"
import { TaskContext } from "../Context/TaskContext"
import TaskItem from "../Components/TaskItem"

const Dashboard = () => {
  const { tasks, addTask } = useContext(TaskContext) // read global tasks

  const [newTask, setNewTask] = useState("");

  const [filter, setFilter] = useState("all")


  const handleAdd = () => {
    if (newTask.trim() === "") return;
    addTask(newTask)
    setNewTask("")
  }

  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  
  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed
    if (filter === "pending") return !task.completed
    return true
  })

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 tracking-tight">Dashboard</h2>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter task..."
          className="flex-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2 rounded-lg"
        />

        <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-lg"
>
          Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-xl font-bold">{tasks.length}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Completed</p>
          <p className="text-xl font-bold">
              {completedCount}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-xl font-bold">
            {pendingCount}
          </p>
        </div>
      </div>


      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded ${filter === "all"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300 transition"

            }`}
        >
          All
        </button>

        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1 rounded ${filter === "completed"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            }`}
        >
          Completed
        </button>

        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1 rounded ${filter === "pending"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            }`}
        >
          Pending
        </button>
      </div>



      <ul className="space-y-2">
        {filteredTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}

        {filteredTasks.length === 0 && (
  <div className="text-center text-gray-400 mt-10">
    <p className="text-lg font-medium">No tasks found</p>
    <p className="text-sm">Try adding a new task</p>
  </div>
)}

      </ul>
    </div>
  )
}

export default Dashboard

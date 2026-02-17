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

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed
    if (filter === "pending") return !task.completed
    return true
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter task..."
          className="border px-3 py-2 rounded w-64"
        />

        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add
        </button>
      </div>

      <div className="flex gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-xl font-bold">{tasks.length}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Completed</p>
          <p className="text-xl font-bold">
            {tasks.filter(task => task.completed).length}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-xl font-bold">
            {tasks.filter(task => !task.completed).length}
          </p>
        </div>
      </div>


      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded ${filter === "all"
            ? "bg-blue-600 text-white"
            : "bg-gray-300"
            }`}
        >
          All
        </button>

        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1 rounded ${filter === "completed"
            ? "bg-blue-600 text-white"
            : "bg-gray-300"
            }`}
        >
          Completed
        </button>

        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1 rounded ${filter === "pending"
            ? "bg-blue-600 text-white"
            : "bg-gray-300"
            }`}
        >
          Pending
        </button>
      </div>



      <ul className="space-y-2">
        {filteredTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </div>
  )
}

export default Dashboard

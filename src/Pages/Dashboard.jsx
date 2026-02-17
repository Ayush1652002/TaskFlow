import { useContext, useState } from "react"
import { TaskContext } from "../Context/TaskContext"
import TaskItem from "../Components/TaskItem"

const Dashboard = () => {
  const { tasks, addTask } = useContext(TaskContext) // read global tasks

  const [newTask, setNewTask] = useState("");

  const handleAdd = () => {
    if(newTask.trim() === "") return;
    addTask(newTask)
    setNewTask("")
  }

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
      <ul className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </div>
  )
}

export default Dashboard

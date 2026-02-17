import { useContext } from "react"
import { TaskContext } from "../Context/TaskContext"

const TaskItem = ({task}) => {
    const {toggleTask, deleteTask} = useContext(TaskContext)
return (
   <li className="bg-white p-3 rounded shadow flex justify-between items-center">
      <span className={`${task.completed ? "line-through text-gray-400" : ""}`}>
        {task.title}
      </span>

      <div className="flex gap-2">
         <button onClick={() => toggleTask(task.id)} className="bg-green-500 text-white px-2 py-1 rounded" >✔</button>
         <button onClick={() => deleteTask(task.id)} className="bg-red-500 text-white px-2 py-1 rounded">❌</button>
      </div>
   </li>
  )
}

export default TaskItem

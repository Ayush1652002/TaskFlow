import { createContext, useState } from "react";

//Create Context
export const TaskContext = createContext();

//Create Provider Component
const TaskProvider = ({ children }) => {

  //This is where our tasks will live
  const [tasks, setTasks] = useState([
    { id: 1, title: "Learn React", completed: false },
    { id: 2, title: "Build TaskFlow", completed: false }
  ]);

   const addTask = (title) => {
        const newTask = {
            id: Date.now(),
            title,
            completed: false
        }
        setTasks((prev) => [...prev, newTask])
    }

   const toggleTask = (id) => {
        setTasks((prev) => prev.map((task) => task.id === id
        ? {...task, completed: !task.completed}
        : task
      )
    )
   }

   const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
   }

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;

import { createContext, useState, useEffect } from "react";

export const TaskContext = createContext();

const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "1", title: "Learn React", completed: false },
          { id: "2", title: "Build TaskFlow", completed: false }
        ];
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = ({ title, priority }) => {
  const newTask = {
    id: Date.now().toString(),
    title,
    completed: false,
    priority: priority || "Medium",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  setTasks(prev => [...prev, newTask]);
};

  const toggleTask = (id) => {
  setTasks(prev =>
    prev.map(task => {
      if (task.id !== id) return task;

      const isCompleting = !task.completed;

      return {
        ...task,
        completed: isCompleting,
        completedAt: isCompleting
          ? new Date().toISOString()
          : null,
      };
    })
  );
};

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const updateTask = (id, newTitle) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, title: newTitle } : task
      )
    );
  };

  const reorderTasks = (newTasks) => {
    setTasks(newTasks);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        updateTask,
        reorderTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;

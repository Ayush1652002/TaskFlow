import { createContext, useState, useEffect } from "react";
import axios from "../api/axios";
import toast from 'react-hot-toast';
export const TaskContext = createContext();

const TaskProvider = ({ children, auth }) => {
const [tasks, setTasks] = useState([]);
const [totalPages, setTotalPages] = useState(1);
const [currentPage, setCurrentPage] = useState(1);
const [loading, setLoading] = useState(false);

  const config = {
    headers: { Authorization: `Bearer ${auth?.accessToken}` }
  };

  // Load tasks
const fetchTasks = async (page = 1, search = '', filter = 'all', priority = '') => {
  try {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...(search && { search }),
      ...(filter !== 'all' && { status: filter }),
      ...(priority && { priority }),
    });

    const res = await axios.get(`/tasks?${params}`, config);
    setTasks(res.data.tasks || res.data || []);
    setTotalPages(res.data.totalPages || 1);
    setCurrentPage(res.data.page || 1);
  } catch (err) {
    toast.error('Failed to load tasks');
  } finally {
    setLoading(false);
  }
};

// Now the useEffect just calls it
useEffect(() => {
  if (auth?.accessToken) fetchTasks();
}, [auth]);

  const addTask = async ({ title, priority, dueDate, description, category }) => {
    try {
      const res = await axios.post("/tasks", {
        title, priority, dueDate, description, category
      }, config);
      setTasks(prev => [...prev, res.data]);
      toast.success('Task added');
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

const toggleTask = async (id) => {
  // optimistically update UI first
  const previousTasks = tasks;
  setTasks(prev => prev.map(t => t._id === id ? { ...t, completed: !t.completed } : t));

  try {
    const task = tasks.find(t => t._id === id);
    await axios.put(`/tasks/${id}`, { completed: !task.completed }, config);
  } catch (err) {
    setTasks(previousTasks); // rollback on failure
    toast.error('Failed to update task');
  }
};

const deleteTask = async (id) => {
  const previousTasks = tasks;
  setTasks(prev => prev.filter(t => t._id !== id));

  try {
    await axios.delete(`/tasks/${id}`, config);
    toast.success('Task deleted');
  } catch (err) {
    setTasks(previousTasks); // rollback on failure
    toast.error('Failed to delete task');
  }
};

  const updateTask = async (id, newTitle) => {
    try {
      const res = await axios.put(`/tasks/${id}`, { title: newTitle }, config);
      setTasks(prev => prev.map(t => t._id === id ? res.data : t));
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const reorderTasks = (newTasks) => {
    setTasks(newTasks);
  };
const updateTaskStatus = async (id, status) => {
  try {
    const res = await axios.put(`/tasks/${id}`, { status }, config);
    setTasks(prev => prev.map(t => t._id === id ? res.data : t));
    toast.success('Task updated'); 
  } catch (err) {
    toast.error('Failed to update task'); 
  }
};

  const clearAllTasks = async () => {
  try {
    await axios.delete('/tasks', config);
    setTasks([]);
    toast.success('All tasks cleared');
  } catch (err) {
    console.error(err); 
    toast.error('Failed to clear tasks');
  }
};

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      addTask,
      toggleTask,
      deleteTask,
      updateTask,
      reorderTasks,
      updateTaskStatus,
      clearAllTasks,
      totalPages,
      currentPage,
      fetchTasks
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;
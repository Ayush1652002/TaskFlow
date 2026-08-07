import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "../api/axios";
import toast from 'react-hot-toast';
import { TaskContext } from "./taskContextObject";

const TaskProvider = ({ children, auth, activeWorkspace }) => {
const [tasks, setTasks] = useState([]);
const [totalPages, setTotalPages] = useState(1);
const [currentPage, setCurrentPage] = useState(1);
const [loading, setLoading] = useState(false);

  const config = useMemo(
    () => ({ headers: { Authorization: `Bearer ${auth?.accessToken}` } }),
    [auth?.accessToken]
  );
  const wsId = activeWorkspace?._id;
  const base = `/tasks/${wsId}`;

  // Load tasks
const fetchTasks = useCallback(async (page = 1, search = '', filter = 'all', priority = '', sortBy = 'order', order = 'asc') => {
  if (!wsId) return;
  try {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit: 10,
      sortBy,
      order,
      ...(search && { search }),
      ...(filter !== 'all' && { status: filter }),
      ...(priority && { priority }),
    });

    const res = await axios.get(`${base}?${params}`, config);
    setTasks(res.data.tasks || res.data || []);
    setTotalPages(res.data.totalPages || 1);
    setCurrentPage(res.data.page || 1);
  } catch {
    toast.error('Failed to load tasks');
  } finally {
    setLoading(false);
  }
}, [wsId, base, config]);

// Now the useEffect just calls it
useEffect(() => {
  if (auth?.accessToken && wsId) fetchTasks();
}, [auth?.accessToken, wsId, fetchTasks]);

  const addTask = async ({ title, priority, dueDate, description, category, recurrence, assignee }) => {
    if (!wsId) {
      toast.error('Create or select a workspace first');
      return;
    }
    try {
      const res = await axios.post(base, {
        title, priority, dueDate, description, category, recurrence, assignee
      }, config);
      setTasks(prev => [...prev, res.data]);
      toast.success('Task added');
    } catch {
      toast.error('Failed to add task');
    }
  };

const toggleTask = async (id) => {
  // optimistically update UI first
  const previousTasks = tasks;
  const task = tasks.find(t => t._id === id);
  const willBeCompleted = !task.completed;
  setTasks(prev => prev.map(t => t._id === id ? { ...t, completed: willBeCompleted } : t));

  try {
    await axios.put(`${base}/${id}`, { completed: willBeCompleted }, config);

    // Completing a recurring task silently creates its next occurrence on
    // the backend — refetch so that new task actually shows up here too.
    if (willBeCompleted && task.recurrence && task.recurrence !== 'none') {
      fetchTasks(currentPage);
    }
  } catch {
    setTasks(previousTasks); // rollback on failure
    toast.error('Failed to update task');
  }
};

const deleteTask = async (id) => {
  const previousTasks = tasks;
  setTasks(prev => prev.filter(t => t._id !== id));

  try {
    await axios.delete(`${base}/${id}`, config);
    toast.success('Task moved to trash');
  } catch {
    setTasks(previousTasks); // rollback on failure
    toast.error('Failed to delete task');
  }
};

  const updateTask = async (id, newTitle) => {
    try {
      const res = await axios.put(`${base}/${id}`, { title: newTitle }, config);
      setTasks(prev => prev.map(t => t._id === id ? res.data : t));
    } catch {
      toast.error('Failed to update task');
    }
  };

  // Generic version — used by TaskDetailPanel to save title, description,
  // priority, category, status, and dueDate together in one request.
  const editTask = async (id, fields) => {
    try {
      const res = await axios.put(`${base}/${id}`, fields, config);
      setTasks(prev => prev.map(t => t._id === id ? res.data : t));
      return res.data;
    } catch (err) {
      toast.error('Failed to update task');
      throw err;
    }
  };

  const reorderTasks = async (newTasks) => {
    const previousTasks = tasks;
    setTasks(newTasks); // optimistic update, drag feels instant

    try {
      await axios.patch(`${base}/reorder`, { orderedIds: newTasks.map(t => t._id) }, config);
    } catch {
      setTasks(previousTasks); // rollback if the server rejects it
      toast.error('Failed to save new order');
    }
  };
const updateTaskStatus = async (id, status) => {
  try {
    const res = await axios.put(`${base}/${id}`, { status }, config);
    setTasks(prev => prev.map(t => t._id === id ? res.data : t));
    toast.success('Task updated'); 
  } catch {
    toast.error('Failed to update task'); 
  }
};

  const clearAllTasks = async () => {
  try {
    await axios.delete(base, config);
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
      editTask,
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

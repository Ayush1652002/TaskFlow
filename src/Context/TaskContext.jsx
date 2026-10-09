import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "../api/axios";
import toast from 'react-hot-toast';
import { TaskContext } from "./taskContextObject";

// What the dashboard is currently showing. Search, filter, sort and page all
// live HERE (one place), and every change is sent to the server.
// Before, search/filter only worked on the 10 rows already loaded in the browser.
// limit = tasks per page: 10 in list view, 100 in board view (so the board shows every task)
const DEFAULT_QUERY = { page: 1, limit: 10, search: '', filter: 'all', priority: '', sortBy: 'order', order: 'asc' };

const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

const TaskProvider = ({ children, auth, activeWorkspace }) => {
  const [tasks, setTasks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // Numbers for the dashboard cards - counted by the server for the WHOLE workspace
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [query, setQueryState] = useState(DEFAULT_QUERY);

  const config = useMemo(
    () => ({ headers: { Authorization: `Bearer ${auth?.accessToken}` } }),
    [auth?.accessToken]
  );
  const wsId = activeWorkspace?._id;
  const base = `/tasks/${wsId}`;

  // Changing search/filter/sort jumps back to page 1.
  // setQuery({ page: 3 }) keeps the other values and only changes the page.
  const setQuery = useCallback(
    (changes) => setQueryState((prev) => ({ ...prev, page: 1, ...changes })),
    []
  );

  // A different workspace starts with a fresh query
  useEffect(() => {
    setQueryState(DEFAULT_QUERY);
  }, [wsId]);

  // Slow old responses must never overwrite newer ones (typing in the search box)
  const latestRequest = useRef(0);

  const fetchTasks = useCallback(async ({ showSpinner = true } = {}) => {
    if (!wsId) return;
    const requestId = ++latestRequest.current;
    try {
      if (showSpinner) setLoading(true);
      const params = new URLSearchParams({
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        order: query.order,
        ...(query.search && { search: query.search }),
        ...(query.filter !== 'all' && { status: query.filter }),
        ...(query.priority && { priority: query.priority }),
      });

      const res = await axios.get(`${base}?${params}`, config);
      if (requestId !== latestRequest.current) return; // a newer request already won

      setTasks(res.data.tasks || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.page || 1);
      if (res.data.stats) setStats(res.data.stats);
    } catch (err) {
      if (requestId === latestRequest.current) toast.error(errorMessage(err, 'Failed to load tasks'));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [wsId, base, config, query]);

  useEffect(() => {
    if (auth?.accessToken && wsId) fetchTasks();
  }, [auth?.accessToken, wsId, fetchTasks]);

  // After any change we reload the current page quietly (no spinner) so that
  // sorting, page size and the stats cards always match what the server has.
  const refresh = () => fetchTasks({ showSpinner: false });

  // Called by TaskAttachments after an upload/delete. We put the new list into the
  // task right away, and then reload the page quietly. Reloading also cancels any
  // older reload that is still in flight - before this, such a late answer (which
  // did not know about the new file yet) could overwrite the list and make the
  // attachment disappear until the task was opened again.
  const updateTaskAttachments = (id, attachments) => {
    setTasks(prev => prev.map(t => t._id === id ? { ...t, attachments } : t));
    refresh();
  };

  const addTask = async ({ title, priority, dueDate, description, category, recurrence, assignee }) => {
    if (!wsId) {
      toast.error('Create or select a workspace first');
      return false;
    }
    try {
      await axios.post(base, {
        title, priority, dueDate, description, category, recurrence, assignee
      }, config);
      toast.success('Task added');
      await refresh();
      return true;
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to add task'));
      return false;
    }
  };

  // The ONE function that changes a task. toggleTask, updateTask, editTask and
  // updateTaskStatus below are small wrappers around it (they used to be four
  // separate copies of the same PUT + update-the-list code).
  const patchTask = async (id, fields) => {
    const res = await axios.put(`${base}/${id}`, fields, config);
    setTasks(prev => prev.map(t => t._id === id ? res.data : t));
    refresh(); // stats cards, filters and the "next recurring task" stay correct
    return res.data;
  };

  const toggleTask = async (id) => {
    const previousTasks = tasks;
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    const willBeCompleted = !task.completed;

    // optimistic: change BOTH fields so list view and board view agree instantly
    setTasks(prev => prev.map(t => t._id === id
      ? { ...t, completed: willBeCompleted, status: willBeCompleted ? 'done' : 'todo' }
      : t));

    try {
      await patchTask(id, { completed: willBeCompleted });
    } catch (err) {
      setTasks(previousTasks); // rollback on failure
      toast.error(errorMessage(err, 'Failed to update task'));
    }
  };

  const deleteTask = async (id) => {
    const previousTasks = tasks;
    setTasks(prev => prev.filter(t => t._id !== id));

    try {
      await axios.delete(`${base}/${id}`, config);
      toast.success('Task moved to trash');
      refresh();
    } catch (err) {
      setTasks(previousTasks); // rollback on failure
      toast.error(errorMessage(err, 'Failed to delete task'));
    }
  };

  // Generic version - used by TaskDetailPanel to save several fields at once.
  const editTask = async (id, fields) => {
    try {
      return await patchTask(id, fields);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update task'));
      throw err;
    }
  };

  const updateTask = async (id, newTitle) => {
    try {
      await editTask(id, { title: newTitle });
    } catch {
      // editTask already showed the error toast
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      await patchTask(id, { status });
      toast.success('Task updated');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update task'));
    }
  };

  const reorderTasks = async (newTasks) => {
    const previousTasks = tasks;
    setTasks(newTasks); // optimistic update, drag feels instant

    try {
      await axios.patch(`${base}/reorder`, { orderedIds: newTasks.map(t => t._id) }, config);
    } catch (err) {
      setTasks(previousTasks); // rollback if the server rejects it
      toast.error(errorMessage(err, 'Failed to save new order'));
    }
  };

  const clearAllTasks = async () => {
    try {
      await axios.delete(base, config);
      toast.success('All tasks cleared');
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to clear tasks'));
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      stats,
      query,
      setQuery,
      addTask,
      toggleTask,
      deleteTask,
      updateTask,
      editTask,
      reorderTasks,
      updateTaskStatus,
      clearAllTasks,
      updateTaskAttachments,
      totalPages,
      currentPage,
      fetchTasks,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;

const Task = require('../models/Task');

const getAllTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const priority = req.query.priority || '';

    const query = { user: req.user.id };

    if (search) query.title = { $regex: search, $options: 'i' };
    if (status === 'completed') query.completed = true;
    if (status === 'pending') query.completed = false;
    if (priority) query.priority = priority;

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, status } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    const task = await Task.create({
      user: req.user.id,
      title,
      description: description || '',
      priority: priority || 'Medium',
      category: category || 'General',
      dueDate: dueDate || null,
      status: status || 'todo',
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const allowedUpdates = ['title', 'description', 'completed', 'priority', 'category', 'status', 'dueDate', 'completedAt'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };
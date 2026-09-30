const express = require('express');
const jwt = require('jsonwebtoken');
const PostgresTaskRepository = require('../output/PostgresTaskRepository');
const CreateTask = require('../../domain/usecases/CreateTask');
const GetMyTasks = require('../../domain/usecases/GetMyTasks');
const GetAllTasks = require('../../domain/usecases/GetAllTasks');
const UpdateTask = require('../../domain/usecases/UpdateTask');
const UpdateTaskStatus = require('../../domain/usecases/UpdateTaskStatus');
const DeleteTask = require('../../domain/usecases/DeleteTask');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();
const taskRepository = new PostgresTaskRepository();

// Middleware to decode JWT and extract user info
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.substring(7);
  const decoded = jwt.decode(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  req.user = decoded;
  next();
};

// GET /tasks/my - Get current user's tasks (any authenticated user)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.sub;
    const getMyTasks = new GetMyTasks(taskRepository);
    const tasks = await getMyTasks.execute(employeeId);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching my tasks:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
  }
});

// PATCH /tasks/:id/status - Update task status (employee can only update their own tasks)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const employeeId = req.user.sub;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updateTaskStatus = new UpdateTaskStatus(taskRepository);
    const updatedTask = await updateTaskStatus.execute(id, status, employeeId);
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task status:', err);
    if (err.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

// GET /tasks - Get all tasks (admin only)
router.get('/', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (employeeId) filters.employeeId = employeeId;

    const getAllTasks = new GetAllTasks(taskRepository);
    const tasks = await getAllTasks.execute(filters);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching all tasks:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
  }
});

// POST /tasks - Create a task (admin only)
router.post('/', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { title, description, employeeId, employeeUsername, priority, dueDate } = req.body;
    const createdBy = req.user.sub || req.user.preferred_username;

    if (!title || !employeeId || !employeeUsername) {
      return res.status(400).json({ error: 'Title, employeeId, and employeeUsername are required' });
    }

    const createTask = new CreateTask(taskRepository);
    const task = await createTask.execute({
      title,
      description,
      employeeId,
      employeeUsername,
      createdBy,
      priority,
      dueDate
    });
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /tasks/:id - Update a task (admin only)
router.put('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, employeeId, employeeUsername, status, priority, dueDate } = req.body;

    const updateTask = new UpdateTask(taskRepository);
    const updatedTask = await updateTask.execute(id, {
      title,
      description,
      employeeId,
      employeeUsername,
      status,
      priority,
      dueDate
    });
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    if (err.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE /tasks/:id - Delete a task (admin only)
router.delete('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTask = new DeleteTask(taskRepository);
    const result = await deleteTask.execute(id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting task:', err);
    if (err.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Erreur lors de la suppression de la tâche' });
  }
});

module.exports = router;

const express = require('express');
const PostgresTaskRepository = require('../output/PostgresTaskRepository');
const requireInternalApiKey = require('../../middleware/requireInternalApiKey');

const router = express.Router();
const taskRepository = new PostgresTaskRepository();

// GET /internal/tasks - Returns all tasks for internal consumers
router.get('/tasks', requireInternalApiKey, async (req, res) => {
  try {
    const tasks = await taskRepository.findAll({});
    const result = tasks.map(t => ({
      employeeId: t.employeeId,
      employeeUsername: t.employeeUsername,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      createdAt: t.createdAt
    }));
    res.json(result);
  } catch (err) {
    console.error('Erreur /internal/tasks:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

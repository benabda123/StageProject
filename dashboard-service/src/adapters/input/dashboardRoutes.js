const express = require('express');
const router = express.Router();
const requireRole = require('../../middleware/requireRole');
const {
  getAllStats,
  getEmployeeStats,
  getLeaveStats,
  getMeetingStats,
  getTaskStats,
} = require('./DashboardController');

/**
 * Routes du Dashboard — toutes protégées par requireRole('admin')
 * Pattern identique à employeeRoutes.js
 */

// Healthcheck (pas de protection, utilisé par Docker/Kong)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'dashboard-service' });
});

// GET /stats — Vue complète agrégée (employees + leaves + meetings)
router.get('/stats', requireRole('admin'), getAllStats);

// GET /stats/employees — Statistiques employés uniquement
router.get('/stats/employees', requireRole('admin'), getEmployeeStats);

// GET /stats/leaves — Statistiques congés uniquement
router.get('/stats/leaves', requireRole('admin'), getLeaveStats);

// GET /stats/meetings — Statistiques réunions uniquement
router.get('/stats/meetings', requireRole('admin'), getMeetingStats);

// GET /stats/tasks — Statistiques tâches uniquement
router.get('/stats/tasks', requireRole('admin'), getTaskStats);

module.exports = router;

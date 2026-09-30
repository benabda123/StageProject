const AxiosEmployeeAdapter = require('../output/AxiosEmployeeAdapter');
const AxiosLeaveAdapter = require('../output/AxiosLeaveAdapter');
const AxiosMeetingAdapter = require('../output/AxiosMeetingAdapter');
const AxiosTaskAdapter = require('../output/AxiosTaskAdapter');
const GetDashboardStats = require('../../domain/usecases/GetDashboardStats');
const GetEmployeeStats = require('../../domain/usecases/GetEmployeeStats');
const GetLeaveStats = require('../../domain/usecases/GetLeaveStats');
const GetMeetingStats = require('../../domain/usecases/GetMeetingStats');
const GetTaskStats = require('../../domain/usecases/GetTaskStats');

/**
 * Inbound Adapter — DashboardController
 * Instancie les adapters outbound et les use cases, gère la couche HTTP.
 * Reçoit les requêtes Express et délègue au domaine — aucune logique métier ici.
 */

// Instanciation des adapters outbound (une seule fois, partagés par tous les handlers)
const employeeAdapter = new AxiosEmployeeAdapter();
const leaveAdapter = new AxiosLeaveAdapter();
const meetingAdapter = new AxiosMeetingAdapter();
const taskAdapter = new AxiosTaskAdapter();

// Instanciation des use cases avec injection des ports
const getDashboardStatsUC = new GetDashboardStats(employeeAdapter, leaveAdapter, meetingAdapter);
const getEmployeeStatsUC = new GetEmployeeStats(employeeAdapter);
const getLeaveStatsUC = new GetLeaveStats(leaveAdapter);
const getMeetingStatsUC = new GetMeetingStats(meetingAdapter);
const getTaskStatsUC = new GetTaskStats(taskAdapter, employeeAdapter);

/**
 * GET /stats
 * Vue complète agrégée — toutes les statistiques en une seule réponse
 */
const getAllStats = async (req, res) => {
  try {
    const authToken = req.headers.authorization;
    const stats = await getDashboardStatsUC.execute(authToken);
    res.status(200).json(stats);
  } catch (err) {
    console.error('[DashboardController] Erreur getAllStats:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /stats/employees
 * Statistiques des employés uniquement (total, par département, par poste)
 */
const getEmployeeStats = async (req, res) => {
  try {
    const authToken = req.headers.authorization;
    const stats = await getEmployeeStatsUC.execute(authToken);
    res.status(200).json(stats);
  } catch (err) {
    console.error('[DashboardController] Erreur getEmployeeStats:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /stats/leaves
 * Statistiques des congés uniquement (total, par statut, par type, par mois)
 */
const getLeaveStats = async (req, res) => {
  try {
    const authToken = req.headers.authorization;
    const stats = await getLeaveStatsUC.execute(authToken);
    res.status(200).json(stats);
  } catch (err) {
    console.error('[DashboardController] Erreur getLeaveStats:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /stats/meetings
 * Statistiques des réunions uniquement (total, par statut, par type, par mois)
 */
const getMeetingStats = async (req, res) => {
  try {
    const authToken = req.headers.authorization;
    const stats = await getMeetingStatsUC.execute(authToken);
    res.status(200).json(stats);
  } catch (err) {
    console.error('[DashboardController] Erreur getMeetingStats:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /stats/tasks
 * Statistiques des tâches (total, par statut, par priorité, taux de complétion, productivité)
 */
const getTaskStats = async (req, res) => {
  try {
    const authToken = req.headers.authorization;
    const stats = await getTaskStatsUC.execute(authToken);
    res.status(200).json(stats);
  } catch (err) {
    console.error('[DashboardController] Erreur getTaskStats:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllStats,
  getEmployeeStats,
  getLeaveStats,
  getMeetingStats,
  getTaskStats,
};

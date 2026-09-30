/**
 * Adapter Input — anomalyRoutes.js
 *
 * Routes :
 *   POST /anomalies/report         → Lance une nouvelle analyse (admin/manager/hr)
 *   GET  /anomalies/report/latest  → Dernier rapport généré
 *   GET  /anomalies/history        → Historique des rapports
 *   GET  /anomalies/report/:id     → Rapport par ID
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const requireRole = require('../../middleware/requireRole');
const AttendanceServiceClient = require('../output/AttendanceServiceClient');
const GeminiReportGenerator = require('../output/GeminiReportGenerator');
const PostgresAnomalyRepository = require('../output/PostgresAnomalyRepository');
const GenerateAnomalyReport = require('../../domain/usecases/GenerateAnomalyReport');

const router = express.Router();

// Instanciation
const attendanceClient = new AttendanceServiceClient();
const geminiGenerator = new GeminiReportGenerator();
const repo = new PostgresAnomalyRepository();
const generateReportUC = new GenerateAnomalyReport(attendanceClient, geminiGenerator, repo);

// Middleware : extrait l'utilisateur du token
function extractUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });
  const decoded = jwt.decode(authHeader.replace('Bearer ', ''));
  if (!decoded) return res.status(401).json({ error: 'Token invalide' });
  req.user = decoded;
  next();
}

// ── POST /anomalies/report ────────────────────────────────────────────────────
// Lance une analyse complète — peut prendre quelques secondes
// Query: ?days=30
router.post('/anomalies/report',
  requireRole('admin', 'manager', 'hr'),
  async (req, res) => {
    try {
      const days = parseInt(req.query.days || process.env.ANALYSIS_PERIOD_DAYS || '30', 10);
      const username = req.user?.preferred_username || req.user?.sub || 'unknown';

      console.log(`[POST /anomalies/report] Analyse lancée par ${username} sur ${days} jours`);
      const report = await generateReportUC.execute(username, days);

      res.status(201).json(report);
    } catch (err) {
      console.error('[POST /anomalies/report]', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── GET /anomalies/report/latest ──────────────────────────────────────────────
// Retourne le dernier rapport généré (évite de relancer Gemini)
router.get('/anomalies/report/latest',
  requireRole('admin', 'manager', 'hr'),
  async (req, res) => {
    try {
      const reports = await repo.findRecent(1);
      if (reports.length === 0) {
        return res.status(404).json({
          message: 'Aucun rapport disponible. Lancez une analyse avec POST /anomalies/report',
        });
      }
      res.json(reports[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── GET /anomalies/history ────────────────────────────────────────────────────
// Historique des rapports (derniers 10)
router.get('/anomalies/history',
  requireRole('admin', 'manager', 'hr'),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit || '10', 10);
      const reports = await repo.findRecent(limit);
      res.json({
        count: reports.length,
        reports: reports.map(r => ({
          id: r.id,
          generatedAt: r.generatedAt,
          periodDays: r.periodDays,
          totalEmployees: r.totalEmployees,
          anomalyCount: r.anomalyCount,
          createdBy: r.createdBy,
          status: r.status,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── GET /anomalies/report/:id ─────────────────────────────────────────────────
// Rapport complet par ID
router.get('/anomalies/report/:id',
  requireRole('admin', 'manager', 'hr'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });
      const report = await repo.findById(id);
      if (!report) return res.status(404).json({ error: 'Rapport non trouvé' });
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;

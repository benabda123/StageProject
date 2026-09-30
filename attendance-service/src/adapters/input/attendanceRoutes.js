/**
 * Adapter Input — attendanceRoutes.js
 *
 * Routes :
 *   POST /attendance/checkin    → CheckIn (tout utilisateur authentifié)
 *   POST /attendance/checkout   → CheckOut (tout utilisateur authentifié)
 *   GET  /attendance/my         → GetMyAttendance (historique personnel)
 *   GET  /attendance/today      → GetTeamAttendance aujourd'hui (admin/manager/hr)
 *   GET  /attendance/team       → GetTeamAttendance avec date ?date=YYYY-MM-DD (admin/manager/hr)
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const requireRole = require('../../middleware/requireRole');
const PostgresAttendanceRepository = require('../output/PostgresAttendanceRepository');
const LeaveServiceClient = require('../output/LeaveServiceClient');
const CheckIn = require('../../domain/usecases/CheckIn');
const CheckOut = require('../../domain/usecases/CheckOut');
const GetMyAttendance = require('../../domain/usecases/GetMyAttendance');
const GetTeamAttendance = require('../../domain/usecases/GetTeamAttendance');

const router = express.Router();

// Instanciation des adapters et use cases
const repo = new PostgresAttendanceRepository();
const leaveClient = new LeaveServiceClient();
const checkInUC = new CheckIn(repo, leaveClient);
const checkOutUC = new CheckOut(repo);
const getMyAttendanceUC = new GetMyAttendance(repo);
const getTeamAttendanceUC = new GetTeamAttendance(repo);

// ── Middleware : extrait employeeId + username du JWT ─────────────────────────
function extractEmployee(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const decoded = jwt.decode(authHeader.substring(7));
  if (!decoded || !decoded.sub) {
    return res.status(401).json({ error: 'Token invalide' });
  }
  req.employeeId = decoded.sub;
  req.employeeUsername = decoded.preferred_username || decoded.username || decoded.sub;
  req.user = decoded;
  next();
}

// ── GET /attendance/health ────────────────────────────────────────────────────
router.get('/attendance/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'attendance-service',
    officeLat: process.env.OFFICE_LATITUDE,
    officeLng: process.env.OFFICE_LONGITUDE,
    maxRadius: process.env.MAX_CHECKIN_RADIUS_METERS,
  });
});

// ── POST /attendance/checkin ──────────────────────────────────────────────────
// Body : { lat: number, lng: number }
router.post('/attendance/checkin', extractEmployee, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const record = await checkInUC.execute({
      employeeId: req.employeeId,
      employeeUsername: req.employeeUsername,
      lat,
      lng,
    });
    res.status(201).json({
      message: `✅ Pointage enregistré à ${new Date(record.checkInTime).toLocaleTimeString('fr-FR')}`,
      record,
    });
  } catch (err) {
    console.error('[POST /attendance/checkin]', err.message);
    // 409 = déjà pointé, 403 = en congé ou hors zone
    const status =
      err.message.includes('déjà pointé') ? 409 :
      err.message.includes('congé') ? 403 :
      err.message.includes('loin') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ── POST /attendance/checkout ─────────────────────────────────────────────────
// Body : { lat?: number, lng?: number }
router.post('/attendance/checkout', extractEmployee, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const record = await checkOutUC.execute({
      employeeId: req.employeeId,
      lat,
      lng,
    });
    res.json({
      message: `👋 Départ enregistré — durée : ${record.formattedDuration()}`,
      record,
    });
  } catch (err) {
    console.error('[POST /attendance/checkout]', err.message);
    const status =
      err.message.includes("n'avez pas") ? 404 :
      err.message.includes('déjà pointé') ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ── GET /attendance/my ────────────────────────────────────────────────────────
// Query : ?days=30
router.get('/attendance/my', extractEmployee, async (req, res) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const result = await getMyAttendanceUC.execute(req.employeeId, days);
    res.json(result);
  } catch (err) {
    console.error('[GET /attendance/my]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /attendance/today ─────────────────────────────────────────────────────
// Vue admin : présents aujourd'hui
router.get('/attendance/today', requireRole('admin', 'manager', 'hr'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await getTeamAttendanceUC.execute(today);
    res.json(result);
  } catch (err) {
    console.error('[GET /attendance/today]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /attendance/team ──────────────────────────────────────────────────────
// Vue admin : pointages par date ?date=YYYY-MM-DD
router.get('/attendance/team', requireRole('admin', 'manager', 'hr'), async (req, res) => {
  try {
    const { date } = req.query;
    const result = await getTeamAttendanceUC.execute(date || null);
    res.json(result);
  } catch (err) {
    console.error('[GET /attendance/team]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ── GET /attendance/internal/team ─────────────────────────────────────────────
// Route interne (sans JWT) — appelée par anomaly-detection-service
// Protégée par x-internal-api-key
router.get('/attendance/internal/team', (req, res, next) => {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Clé API interne invalide' });
  }
  next();
}, async (req, res) => {
  try {
    const { date } = req.query;
    const result = await getTeamAttendanceUC.execute(date || null);
    res.json(result);
  } catch (err) {
    console.error('[GET /attendance/internal/team]', err.message);
    res.status(500).json({ error: err.message });
  }
});

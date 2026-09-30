const express = require('express');
const jwt = require('jsonwebtoken');
const requireRole = require('../../middleware/requireRole');

const PostgresLeaveRepository = require('../output/PostgresLeaveRepository');
const CreateLeaveRequest = require('../../domain/usecases/CreateLeaveRequest');
const GetMyLeaves = require('../../domain/usecases/GetMyLeaves');
const GetAllLeaves = require('../../domain/usecases/GetAllLeaves');
const ApproveLeave = require('../../domain/usecases/ApproveLeave');
const RejectLeave = require('../../domain/usecases/RejectLeave');

const router = express.Router();

// Initialisation de la couche d'accès aux données et des cas d'utilisation
const repo = new PostgresLeaveRepository();
const createLeaveUC = new CreateLeaveRequest(repo);
const getMyLeavesUC = new GetMyLeaves(repo);
const getAllLeavesUC = new GetAllLeaves(repo);
const approveLeaveUC = new ApproveLeave(repo);
const rejectLeaveUC = new RejectLeave(repo);

// Middleware pour extraire l'employee_id (sub) du token JWT
function extractEmployeeId(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.substring(7);
  const decoded = jwt.decode(token); // Kong a déjà validé la signature
  
  if (!decoded || !decoded.sub) {
    return res.status(401).json({ error: 'Token invalide: sub manquant' });
  }

  req.employeeId = decoded.sub;
  req.employeeUsername = decoded.preferred_username || decoded.username;
  next();
}

// Healthcheck
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Leave Service' });
});

// POST créer une demande de congé - Accessible à tout utilisateur authentifié
router.post('/', extractEmployeeId, async (req, res) => {
  try {
    const leaveData = {
      ...req.body,
      employeeId: req.employeeId,
      employeeUsername: req.employeeUsername
    };
    const created = await createLeaveUC.execute(leaveData);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET mes demandes de congé - Accessible à tout utilisateur authentifié
router.get('/mine', extractEmployeeId, async (req, res) => {
  try {
    const leaves = await getMyLeavesUC.execute(req.employeeId);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET toutes les demandes de congé - Accessible uniquement aux admin
router.get('/', requireRole('admin', 'hr'), async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    const leaves = await getAllLeavesUC.execute(filters);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT approuver une demande - Accessible uniquement aux admin
router.put('/:id/approve', requireRole('admin', 'hr'), async (req, res) => {
  try {
    const updated = await approveLeaveUC.execute(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Demande de congé non trouvée' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT rejeter une demande - Accessible uniquement aux admin
router.put('/:id/reject', requireRole('admin', 'hr'), async (req, res) => {
  try {
    const updated = await rejectLeaveUC.execute(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Demande de congé non trouvée' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

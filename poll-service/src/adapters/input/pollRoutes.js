/**
 * Adapter Input — pollRoutes.js
 *
 * Routes :
 *   POST   /polls                 → CreatePoll (admin)
 *   GET    /polls                 → GetAllPolls (admin/manager)
 *   GET    /polls/active          → GetActivePolls (tout utilisateur authentifié)
 *   GET    /polls/:id/results     → GetPollResults (tout utilisateur authentifié)
 *   POST   /polls/:id/vote        → SubmitVote (tout utilisateur authentifié)
 *   PUT    /polls/:id/close       → ClosePoll (admin)
 *   DELETE /polls/:id             → DeletePoll (admin)
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const requireRole = require('../../middleware/requireRole');
const PostgresPollRepository = require('../output/PostgresPollRepository');
const NotificationServiceClient = require('../output/NotificationServiceClient');
const CreatePoll = require('../../domain/usecases/CreatePoll');
const SubmitVote = require('../../domain/usecases/SubmitVote');
const GetPollResults = require('../../domain/usecases/GetPollResults');
const GetActivePolls = require('../../domain/usecases/GetActivePolls');
const ClosePoll = require('../../domain/usecases/ClosePoll');

const router = express.Router();

const repo = new PostgresPollRepository();
const notifClient = new NotificationServiceClient();
const createPollUC = new CreatePoll(repo, notifClient);
const submitVoteUC = new SubmitVote(repo);
const getPollResultsUC = new GetPollResults(repo);
const getActivePollsUC = new GetActivePolls(repo);
const closePollUC = new ClosePoll(repo);

// Middleware : extrait user du JWT
function extractUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });
  const decoded = jwt.decode(authHeader.replace('Bearer ', ''));
  if (!decoded) return res.status(401).json({ error: 'Token invalide' });
  req.user = decoded;
  req.employeeId = decoded.sub;
  req.employeeUsername = decoded.preferred_username || decoded.sub;
  req.userRoles = decoded.realm_access?.roles || [];
  next();
}

// ── POST /polls ────────────────────────────────────────────────────────────────
router.post('/polls', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { title, description, options, deadline, isAnonymous } = req.body;
    const poll = await createPollUC.execute(
      { title, description, options, deadline, isAnonymous },
      req.user.preferred_username,
      req.user.sub
    );
    res.status(201).json(poll);
  } catch (err) {
    console.error('[POST /polls]', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ── GET /polls (admin — tous les sondages) ─────────────────────────────────────
router.get('/polls', requireRole('admin', 'manager', 'hr'), async (req, res) => {
  try {
    const polls = await repo.findAll();
    // Enrichir avec compteur de votes
    const enriched = await Promise.all(polls.map(async (p) => ({
      ...p,
      totalVotes: await repo.countVotesByPollId(p.id),
      isExpired: p.isExpired(),
    })));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /polls/active (tout utilisateur) ──────────────────────────────────────
router.get('/polls/active', extractUser, async (req, res) => {
  try {
    const polls = await getActivePollsUC.execute(req.employeeId);
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /polls/:id/results ─────────────────────────────────────────────────────
router.get('/polls/:id/results', extractUser, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });
    const results = await getPollResultsUC.execute(id, req.employeeId, req.userRoles);
    res.json(results);
  } catch (err) {
    const status = err.message.includes('non trouvé') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ── POST /polls/:id/vote ───────────────────────────────────────────────────────
router.post('/polls/:id/vote', extractUser, async (req, res) => {
  try {
    const pollId = parseInt(req.params.id, 10);
    if (isNaN(pollId)) return res.status(400).json({ error: 'ID invalide' });
    const { optionId } = req.body;
    const vote = await submitVoteUC.execute(
      { pollId, optionId },
      req.employeeId,
      req.employeeUsername
    );
    res.status(201).json({ message: '✅ Vote enregistré avec succès', vote });
  } catch (err) {
    console.error('[POST /polls/:id/vote]', err.message);
    const status =
      err.message.includes('déjà voté') ? 409 :
      err.message.includes('fermé') ? 403 :
      err.message.includes('dépassée') ? 403 :
      err.message.includes('non trouvé') ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ── PUT /polls/:id/close ───────────────────────────────────────────────────────
router.put('/polls/:id/close', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const closed = await closePollUC.execute(id, req.user.sub);
    res.json({ message: 'Sondage fermé avec succès', poll: closed });
  } catch (err) {
    const status = err.message.includes('non trouvé') ? 404 :
      err.message.includes('déjà fermé') ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ── DELETE /polls/:id ──────────────────────────────────────────────────────────
router.delete('/polls/:id', requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const poll = await repo.findById(id);
    if (!poll) return res.status(404).json({ error: 'Sondage non trouvé' });
    await repo.delete(id);
    res.json({ message: 'Sondage supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

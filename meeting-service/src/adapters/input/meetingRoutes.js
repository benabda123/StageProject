const express = require('express');
const jwt = require('jsonwebtoken');
const CreateMeetingRequest = require('../../domain/usecases/CreateMeetingRequest');
const GetMyMeetings = require('../../domain/usecases/GetMyMeetings');
const GetAllMeetings = require('../../domain/usecases/GetAllMeetings');
const ApproveMeeting = require('../../domain/usecases/ApproveMeeting');
const RejectMeeting = require('../../domain/usecases/RejectMeeting');
const RequestMeetingChange = require('../../domain/usecases/RequestMeetingChange');
const ResolveMeetingChange = require('../../domain/usecases/ResolveMeetingChange');
const CancelMeeting = require('../../domain/usecases/CancelMeeting');
const PostgresMeetingRepository = require('../../adapters/output/PostgresMeetingRepository');
const PostgresRoomRepository = require('../../adapters/output/PostgresRoomRepository');
const GoogleOAuthRepository = require('../../adapters/output/GoogleOAuthRepository');
const GoogleCalendarClient = require('../../adapters/output/GoogleCalendarClient');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();
const meetingRepository = new PostgresMeetingRepository();
const roomRepository = new PostgresRoomRepository();
const oauthRepository = new GoogleOAuthRepository();

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant" });
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalide" });
  }
}

// ──────────────────────────────────────────────
// Google Calendar OAuth routes
// ──────────────────────────────────────────────

// GET /meetings/google/connect -> tout utilisateur authentifié peut connecter son Google Calendar
router.get('/google/connect', requireRole('admin', 'manager', 'employee'), async (req, res) => {
  try {
    const userId = req.user.sub;
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    const url = GoogleCalendarClient.getAuthUrl(state);
    res.redirect(url);
  } catch (error) {
    console.error('Erreur GET /meetings/google/connect:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /meetings/google/callback -> PUBLIC, Google redirects here after consent
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send('Code manquant');
    }

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    const tokens = await GoogleCalendarClient.exchangeCodeForTokens(code);
    await oauthRepository.upsertTokens(userId, tokens);

    res.redirect('http://localhost:3001/meetings?google_connected=true');
  } catch (error) {
    console.error('Erreur GET /meetings/google/callback:', error);
    res.redirect('http://localhost:3001/meetings?google_error=true');
  }
});

// GET /meetings/google/status -> { connected: boolean }
router.get('/google/status', authenticateToken, async (req, res) => {
  try {
    const connected = await oauthRepository.isConnected(req.user.sub);
    res.json({ connected });
  } catch (error) {
    console.error('Erreur GET /meetings/google/status:', error);
    res.json({ connected: false });
  }
});

// ──────────────────────────────────────────────
// Meeting CRUD routes
// ──────────────────────────────────────────────

router.post('/', authenticateToken, async (req, res) => {
  try {
    const createMeetingRequest = new CreateMeetingRequest(meetingRepository, roomRepository);
    const userRoles = (req.user.realm_access && req.user.realm_access.roles) || [];
    const requestingUserRole = userRoles.includes('admin') ? 'admin' : 'employee';
    const meeting = await createMeetingRequest.execute(req.body, req.user.sub, req.user.preferred_username, requestingUserRole);
    res.status(201).json(meeting);
  } catch (error) {
    console.error('Erreur POST /meetings:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const getMyMeetings = new GetMyMeetings(meetingRepository);
    const meetings = await getMyMeetings.execute(req.user.sub);
    res.json(meetings);
  } catch (error) {
    console.error('Erreur GET /meetings/mine:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const getAllMeetings = new GetAllMeetings(meetingRepository);
    const filters = { status: req.query.status, date: req.query.date };
    const meetings = await getAllMeetings.execute(filters);
    res.json(meetings);
  } catch (error) {
    console.error('Erreur GET /meetings:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const approveMeeting = new ApproveMeeting(meetingRepository);
    const meeting = await approveMeeting.execute(parseInt(req.params.id));
    res.json(meeting);
  } catch (error) {
    console.error('Erreur PUT /meetings/:id/approve:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/reject', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const rejectMeeting = new RejectMeeting(meetingRepository);
    const meeting = await rejectMeeting.execute(parseInt(req.params.id));
    res.json(meeting);
  } catch (error) {
    console.error('Erreur PUT /meetings/:id/reject:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/request-change', authenticateToken, async (req, res) => {
  try {
    const requestMeetingChange = new RequestMeetingChange(meetingRepository);
    const meeting = await requestMeetingChange.execute(parseInt(req.params.id), req.body, req.user.sub);
    res.json(meeting);
  } catch (error) {
    console.error('Erreur PUT /meetings/:id/request-change:', error);
    res.status(403).json({ error: error.message });
  }
});

router.put('/:id/resolve-change', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const resolveMeetingChange = new ResolveMeetingChange(meetingRepository, roomRepository);
    const meeting = await resolveMeetingChange.execute(parseInt(req.params.id), req.body.accept);
    res.json(meeting);
  } catch (error) {
    console.error('Erreur PUT /meetings/:id/resolve-change:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const cancelMeeting = new CancelMeeting(meetingRepository);
    const meeting = await cancelMeeting.execute(parseInt(req.params.id), req.body.reason, req.user.sub);
    res.json(meeting);
  } catch (error) {
    console.error('Erreur PUT /meetings/:id/cancel:', error);
    res.status(403).json({ error: error.message });
  }
});

module.exports = router;

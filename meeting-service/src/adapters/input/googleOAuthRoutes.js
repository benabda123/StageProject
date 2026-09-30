const express = require('express');
const jwt = require('jsonwebtoken');
const GoogleCalendarClient = require('../output/GoogleCalendarClient');
const GoogleOAuthRepository = require('../output/GoogleOAuthRepository');
const authenticateFromHeaderOrQuery = require('../../middleware/authenticateFromHeaderOrQuery');

const router = express.Router();
const oauthRepository = new GoogleOAuthRepository();

const SUCCESS_REDIRECT =
  process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT ||
  'http://localhost:3001/meetings?google_connected=true';

function requireManagerRole(req, res, next) {
  const roles = (req.user.realm_access && req.user.realm_access.roles) || [];
  const allowed = roles.includes('admin') || roles.includes('manager');
  if (!allowed) {
    return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
  }
  next();
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// GET /meetings/google/connect — tout utilisateur authentifié peut connecter son Google Calendar
// (admin, manager ET employee — chacun connecte son propre compte)
router.get('/connect', authenticateFromHeaderOrQuery, (req, res) => {
  const authUrl = GoogleCalendarClient.getAuthUrl(req.user.sub);
  res.redirect(authUrl);
});

// GET /meetings/google/callback — public (no JWT), Google redirects here after consent
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`${SUCCESS_REDIRECT}&google_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Code ou state manquant' });
  }

  try {
    const tokens = await GoogleCalendarClient.exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      console.warn('No refresh_token returned — user may need to revoke and reconnect');
    }
    await oauthRepository.upsertTokens(state, tokens);
    res.redirect(SUCCESS_REDIRECT);
  } catch (err) {
    console.error('Erreur Google OAuth callback:', err);
    res.redirect(`${SUCCESS_REDIRECT}&google_error=token_exchange_failed`);
  }
});

// GET /meetings/google/status — any authenticated user (mobile reads status only)
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const connected = await oauthRepository.isConnected(req.user.sub);
    res.json({ connected });
  } catch (err) {
    console.error('Erreur GET /meetings/google/status:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

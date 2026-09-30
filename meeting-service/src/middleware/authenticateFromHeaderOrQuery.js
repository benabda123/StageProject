/**
 * Middleware — authenticateFromHeaderOrQuery
 *
 * Le flow OAuth Google pose un problème spécifique :
 * quand le navigateur fait window.location.href = '.../connect',
 * il ne peut PAS ajouter un header Authorization (c'est une navigation, pas fetch).
 *
 * Solution : le frontend passe le JWT en query param ?access_token=...
 * Ce middleware lit le token depuis Authorization header OU depuis ?access_token.
 *
 * Kong a déjà validé la signature sur les routes protégées.
 * Pour /connect (route publique dans Kong), on vérifie ici.
 */
const jwt = require('jsonwebtoken');

function authenticateFromHeaderOrQuery(req, res, next) {
  // 1. Essayer le header Authorization standard
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Fallback : query param ?access_token= (utilisé lors d'une navigation browser)
  if (!token && req.query.access_token) {
    token = req.query.access_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const decoded = jwt.decode(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  req.user = decoded;
  next();
}

module.exports = authenticateFromHeaderOrQuery;

/**
 * Middleware — requireInternalApiKey
 *
 * Protège les routes /internal/* qui sont appelées service-à-service.
 * Ces routes NE passent PAS par Kong (appels directs réseau Docker),
 * donc pas de validation JWT — on utilise une clé partagée à la place.
 */
function requireInternalApiKey(req, res, next) {
  const key = req.headers['x-internal-api-key'];
  const expected = process.env.INTERNAL_API_KEY;

  if (!expected) {
    console.error('[requireInternalApiKey] INTERNAL_API_KEY non configurée');
    return res.status(500).json({ error: 'Internal API key not configured' });
  }

  if (!key || key !== expected) {
    return res.status(403).json({ error: 'Clé API interne invalide ou manquante' });
  }

  next();
}

module.exports = requireInternalApiKey;

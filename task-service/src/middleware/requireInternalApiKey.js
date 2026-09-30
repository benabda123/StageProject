function requireInternalApiKey(req, res, next) {
  const apiKey = req.headers['x-internal-api-key'];
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Invalid internal API key' });
  }
  next();
}

module.exports = requireInternalApiKey;

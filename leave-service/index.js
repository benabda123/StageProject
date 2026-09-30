require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const leaveRoutes = require('./src/adapters/input/leaveRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Internal routes (for inter-service communication via x-internal-api-key)
const PostgresLeaveRepository = require('./src/adapters/output/PostgresLeaveRepository');
const repo = new PostgresLeaveRepository();
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

function requireInternalApiKey(req, res, next) {
  const apiKey = req.headers['x-internal-api-key'];
  if (!apiKey || apiKey !== INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Clé API interne invalide' });
  }
  next();
}

app.get('/internal/leaves/:id', requireInternalApiKey, async (req, res) => {
  try {
    const leave = await repo.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ error: 'Demande de congé non trouvée' });
    }
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/internal/leaves', requireInternalApiKey, async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    const leaves = await repo.findAll(filters);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/', leaveRoutes);

const PORT = process.env.PORT || 8086;
app.listen(PORT, () => {
  console.log(`Leave Service running on port ${PORT}`);
});

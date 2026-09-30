const express = require('express');
const keycloakAdmin = require('../keycloakAdminClient');
const requireInternalApiKey = require('../middleware/requireInternalApiKey');

const router = express.Router();

// GET /internal/employees - Get all employees (internal API, protected by API key)
router.get('/employees', requireInternalApiKey, async (req, res) => {
  try {
    const users = await keycloakAdmin.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Erreur récupération employés (internal):', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /internal/employees/:userId/attributes - Update user attributes (internal API, protected by API key)
router.put('/employees/:userId/attributes', requireInternalApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { attributes } = req.body;
    await keycloakAdmin.updateUserAttributes(userId, attributes);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur mise à jour attributs (internal):', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

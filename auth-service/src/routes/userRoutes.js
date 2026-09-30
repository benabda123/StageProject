const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const keycloakAdmin = require('../keycloakAdminClient');

const router = express.Router();

// Middleware pour décoder le token JWT (Kong a déjà validé la signature)
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.substring(7);
  const decoded = jwt.decode(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  req.user = decoded;
  next();
}

// Middleware pour vérifier les rôles (utilise req.user déjà décodé)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const userRoles = req.user.realm_access?.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
    }

    next();
  };
}

// Validation rules pour la création d'utilisateur
const createUserValidation = [
  body('username').isLength({ min: 3 }).trim().withMessage('Username doit avoir au moins 3 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Password doit avoir au moins 6 caractères'),
  body('firstName').notEmpty().trim().withMessage('FirstName est requis'),
  body('lastName').notEmpty().trim().withMessage('LastName est requis'),
];

router.get('/employees', authenticateToken, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const users = await keycloakAdmin.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Erreur récupération employés:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/employees/:id', authenticateToken, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const user = await keycloakAdmin.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    console.error('Erreur récupération employé:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees', authenticateToken, requireRole('admin', 'hr'), createUserValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await keycloakAdmin.createUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Erreur création employé:', err);
    res.status(400).json({ error: err.message });
  }
});

router.put('/employees/:id', authenticateToken, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const result = await keycloakAdmin.updateUser(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('Erreur mise à jour employé:', err);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/employees/:id', authenticateToken, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const result = await keycloakAdmin.deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Erreur suppression employé:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

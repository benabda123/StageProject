const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const keycloakAdmin = require('../keycloakAdminClient');

const router = express.Router();

// Dossier de stockage des avatars (volume Docker monté sur /app/uploads)
const AVATARS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

// URL publique de l'avatar vue depuis le navigateur (via Kong)
const PUBLIC_BASE_URL = 'http://localhost:8000';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MIME_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo

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

// Configure multer : 2 Mo max, uniquement jpeg/png/webp, nom de fichier unique
const storage = multer.diskStorage({
  destination: AVATARS_DIR,
  filename: (req, file, cb) => {
    const ext = MIME_EXT[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${req.user.sub}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou WEBP.'));
    }
  },
});

const isValidUrl = (value) => typeof value === 'string' && /^https?:\/\/.+/.test(value);

const formatProfile = (user) => {
  const attrs = user.attributes || {};
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: Array.isArray(attrs.avatarUrl) ? attrs.avatarUrl[0] || '' : '',
    githubUrl: Array.isArray(attrs.githubUrl) ? attrs.githubUrl[0] || '' : '',
    linkedinUrl: Array.isArray(attrs.linkedinUrl) ? attrs.linkedinUrl[0] || '' : '',
  };
};

// GET /profile/me — profil de l'utilisateur connecté (sub vient du token, jamais du body)
router.get('/profile/me', authenticateToken, async (req, res) => {
  try {
    const user = await keycloakAdmin.getUserById(req.user.sub);
    res.json(formatProfile(user));
  } catch (err) {
    console.error('Erreur GET /profile/me:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /profile/me — met à jour githubUrl / linkedinUrl
router.put('/profile/me', authenticateToken, async (req, res) => {
  const { githubUrl, linkedinUrl } = req.body || {};
  const attributes = {};

  if (githubUrl !== undefined) {
    if (!isValidUrl(githubUrl)) {
      return res.status(400).json({ error: 'URL GitHub invalide (doit commencer par http:// ou https://)' });
    }
    attributes.githubUrl = githubUrl;
  }

  if (linkedinUrl !== undefined) {
    if (!isValidUrl(linkedinUrl)) {
      return res.status(400).json({ error: 'URL LinkedIn invalide (doit commencer par http:// ou https://)' });
    }
    attributes.linkedinUrl = linkedinUrl;
  }

  try {
    if (Object.keys(attributes).length > 0) {
      // Réutilise la fonction déjà corrigée (récupère l'utilisateur complet puis fusionne)
      await keycloakAdmin.updateUserAttributes(req.user.sub, attributes);
    }
    const user = await keycloakAdmin.getUserById(req.user.sub);
    res.json(formatProfile(user));
  } catch (err) {
    console.error('Erreur PUT /profile/me:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /profile/me/avatar — upload de photo de profil (multipart/form-data, champ "avatar")
router.post('/profile/me/avatar', authenticateToken, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Fichier trop volumineux (maximum 2 Mo)' });
      }
      return res.status(400).json({ error: err.message || 'Erreur lors de l\'upload' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu (champ "avatar" requis)' });
    }

    try {
      const avatarUrl = `${PUBLIC_BASE_URL}/auth/profile/uploads/${req.file.filename}`;
      await keycloakAdmin.updateUserAttributes(req.user.sub, { avatarUrl });
      res.json({ avatarUrl });
    } catch (updateErr) {
      console.error('Erreur mise à jour avatarUrl:', updateErr);
      res.status(500).json({ error: updateErr.message });
    }
  });
});

module.exports = router;

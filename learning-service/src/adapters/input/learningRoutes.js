// ============================================================
// Input Adapter — learningRoutes.js
// Routes HTTP pour le Learning Service
//
// Routes exposées (via Kong sur /learning) :
//   GET  /learning/search?query=xxx  → SearchTrainings
//   GET  /learning/favorites         → GetMyFavorites
//   POST /learning/favorites         → AddFavorite
//   DELETE /learning/favorites/:id   → RemoveFavorite
//
// ⚠️ SÉCURITÉ : employee_id est TOUJOURS extrait du token JWT.
// Il n'est jamais lu depuis le body de la requête.
// La clé API YouTube est utilisée exclusivement dans YoutubeSearchClient (côté serveur).
// ============================================================

const express = require('express');
const jwt = require('jsonwebtoken');

// Output adapters
const PostgresFavoriteRepository = require('../output/PostgresFavoriteRepository');

// Use cases
const SearchTrainings    = require('../../domain/usecases/SearchTrainings');
const AddFavorite        = require('../../domain/usecases/AddFavorite');
const GetMyFavorites     = require('../../domain/usecases/GetMyFavorites');
const RemoveFavorite     = require('../../domain/usecases/RemoveFavorite');

const router = express.Router();

// Instanciation du repository (partagé entre les routes)
const favoriteRepository = new PostgresFavoriteRepository();

// ─────────────────────────────────────────────────────────────
// Middleware d'authentification
// Décode le JWT via jwt.decode (Kong a déjà validé la signature)
// Pattern identique à task-service et leave-service
// ─────────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
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
};

// ─────────────────────────────────────────────────────────────
// GET /learning/search?query=xxx
// Recherche de formations vidéo via YouTube (tout utilisateur authentifié)
// ⚠️ L'API YouTube est appelée côté serveur — la clé API n'est jamais transmise au frontend
// ─────────────────────────────────────────────────────────────
router.get('/learning/search', authenticateToken, async (req, res) => {
  try {
    const { query, maxResults } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Le paramètre "query" est obligatoire' });
    }

    const searchTrainings = new SearchTrainings();
    const results = await searchTrainings.execute(query, maxResults ? parseInt(maxResults) : 12);

    res.json({ query, results });
  } catch (err) {
    console.error('Erreur SearchTrainings:', err.message);

    // Erreur de clé API manquante → 503 (service indisponible, pas une erreur client)
    if (err.message && err.message.includes('YouTube API key not configured')) {
      return res.status(503).json({
        error: err.message,
        hint: 'Ajoutez YOUTUBE_API_KEY dans votre fichier .env et redémarrez le service.'
      });
    }

    // Quota dépassé ou clé invalide
    if (err.message && err.message.includes('quota')) {
      return res.status(429).json({ error: err.message });
    }

    res.status(500).json({ error: err.message || 'Erreur lors de la recherche YouTube' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /learning/favorites
// Retourne les favoris de l'utilisateur connecté
// ─────────────────────────────────────────────────────────────
router.get('/learning/favorites', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.sub; // sub Keycloak — jamais depuis le body

    const getMyFavorites = new GetMyFavorites(favoriteRepository);
    const favorites = await getMyFavorites.execute(employeeId);

    res.json({ favorites });
  } catch (err) {
    console.error('Erreur GetMyFavorites:', err.message);
    res.status(500).json({ error: err.message || 'Erreur lors de la récupération des favoris' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /learning/favorites
// Ajoute une vidéo aux favoris de l'utilisateur connecté
// Body attendu : { videoId, title, thumbnail?, url }
// employee_id est extrait du token — jamais du body
// ─────────────────────────────────────────────────────────────
router.post('/learning/favorites', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.sub; // sub Keycloak — jamais depuis le body
    const { videoId, title, thumbnail, url } = req.body;

    if (!videoId || !title || !url) {
      return res.status(400).json({ error: 'videoId, title et url sont obligatoires' });
    }

    const addFavorite = new AddFavorite(favoriteRepository);
    const favorite = await addFavorite.execute(employeeId, { videoId, title, thumbnail, url });

    res.status(201).json({ message: 'Vidéo ajoutée aux favoris', favorite });
  } catch (err) {
    console.error('Erreur AddFavorite:', err.message);

    // Doublon : contrainte unique (employee_id, video_id)
    if (err.message && err.message.includes('déjà dans vos favoris')) {
      return res.status(409).json({ error: err.message });
    }

    res.status(500).json({ error: err.message || 'Erreur lors de l\'ajout en favoris' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /learning/favorites/:id
// Supprime un favori — vérifie l'ownership avant suppression
// Un utilisateur ne peut supprimer que SES propres favoris → 403 sinon
// ─────────────────────────────────────────────────────────────
router.delete('/learning/favorites/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.sub; // sub Keycloak — ownership check

    const removeFavorite = new RemoveFavorite(favoriteRepository);
    const result = await removeFavorite.execute(id, employeeId);

    res.json(result);
  } catch (err) {
    console.error('Erreur RemoveFavorite:', err.message);

    if (err.message === 'FAVORITE_NOT_FOUND') {
      return res.status(404).json({ error: 'Favori introuvable' });
    }

    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Accès refusé : vous ne pouvez supprimer que vos propres favoris' });
    }

    res.status(500).json({ error: err.message || 'Erreur lors de la suppression du favori' });
  }
});

module.exports = router;

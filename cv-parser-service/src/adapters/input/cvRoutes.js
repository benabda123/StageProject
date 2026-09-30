/**
 * Adapter Input — cvRoutes.js
 *
 * Route :
 *   POST /cv/parse   → Upload CV (PDF/DOCX), extraction texte, analyse Gemini
 *                      Accessible uniquement aux admin et hr
 *
 * Sécurité :
 *   1. JWT vérifié par Kong avant d'arriver ici (authenticateToken décode seulement)
 *   2. requireRole('admin', 'hr') — employees bloqués
 *   3. multer limite à 5 Mo et filtre le type MIME déclaré
 *   4. Vérification magic bytes — ne se fie pas au MIME déclaré par le navigateur
 *   5. Texte minimal (20 chars) pour rejeter les fichiers vides ou corrompus
 */
const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const requireRole = require('../../middleware/requireRole');
const PdfExtractor = require('../output/PdfExtractor');
const DocxExtractor = require('../output/DocxExtractor');
const GeminiCvParser = require('../output/GeminiCvParser');

const router = express.Router();

// ── Middleware authenticateToken (pattern identique task-service / meeting-service) ──
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const decoded = jwt.decode(authHeader.substring(7));
  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide' });
  }
  req.user = decoded;
  next();
}

// ── Multer — stockage en mémoire (rien n'est écrit sur disque) ────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new Error('Seuls les fichiers PDF et DOCX sont acceptés (.doc non supporté)')
      );
    }
    cb(null, true);
  },
});

// ── POST /cv/parse ─────────────────────────────────────────────────────────────
router.post(
  '/parse',
  authenticateToken,
  requireRole('admin', 'hr'),
  // Wrapper multer pour capturer les erreurs et les passer à Express (évite crash process)
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier reçu' });
      }

      const buffer = req.file.buffer;
      const declaredMime = req.file.mimetype;

      // ── Vérification magic bytes (signature binaire réelle) ────────────────
      // Ne pas se fier uniquement au MIME déclaré par le navigateur (falsifiable)
      const headerHex = buffer.slice(0, 8).toString('hex');
      const headerStr = buffer.slice(0, 8).toString('ascii');

      const isPdf  = headerStr.startsWith('%PDF-');
      // DOCX = ZIP (Open Packaging) — magic bytes : 50 4B 03 04 ou 50 4B 05 06
      const isDocx = headerHex.startsWith('504b0304') || headerHex.startsWith('504b0506');
      // Ancien .doc Word binaire — magic bytes : D0 CF 11 E0
      const isOldDoc = headerHex.startsWith('d0cf11e0');

      // Rejeter les anciens .doc (mammoth ne les supporte pas)
      if (isOldDoc) {
        return res.status(400).json({
          error: 'Format .doc (ancien Word) non supporté. Convertissez votre fichier en .docx et réessayez.',
        });
      }

      // Vérifier cohérence MIME déclaré ↔ contenu réel
      if (declaredMime === 'application/pdf' && !isPdf) {
        return res.status(400).json({
          error: 'Fichier corrompu : le contenu ne correspond pas à un PDF valide.',
        });
      }
      if (declaredMime.includes('wordprocessingml') && !isDocx) {
        return res.status(400).json({
          error: 'Fichier corrompu : le contenu ne correspond pas à un DOCX valide.',
        });
      }

      // ── Extraction du texte brut ──────────────────────────────────────────
      let rawText;
      try {
        if (isPdf) {
          rawText = await PdfExtractor.extractText(buffer);
        } else if (isDocx) {
          rawText = await DocxExtractor.extractText(buffer);
        } else {
          return res.status(400).json({
            error: 'Type de fichier non reconnu. Seuls les fichiers .pdf et .docx sont supportés.',
          });
        }
      } catch (extractErr) {
        console.error('[cvRoutes] Extraction error:', extractErr.message);
        return res.status(400).json({
          error: `Impossible d'extraire le texte du fichier : ${extractErr.message}`,
        });
      }

      // ── Vérification du contenu extrait ──────────────────────────────────
      if (!rawText || rawText.trim().length < 20) {
        return res.status(400).json({
          error: 'Impossible d\'extraire du texte lisible de ce fichier. Le CV est peut-être scanné (image) ou protégé.',
        });
      }

      // ── Analyse Gemini AI ─────────────────────────────────────────────────
      const extracted = await GeminiCvParser.parseCv(rawText);

      // Normaliser la réponse — garantir que tous les champs attendus sont présents
      const result = {
        firstName: extracted.firstName || null,
        lastName:  extracted.lastName  || null,
        position:  extracted.position  || null,
        phone:     extracted.phone     || null,
        email:     extracted.email     || null,
        skills:    Array.isArray(extracted.skills) ? extracted.skills.slice(0, 5) : [],
      };

      console.log(`[cvRoutes] CV analysé - firstName:${result.firstName} lastName:${result.lastName} position:${result.position}`);
      res.json(result);

    } catch (err) {
      console.error('[cvRoutes] Error:', err.message);

      // Erreurs spécifiques avec codes HTTP appropriés
      if (err.message.includes('GEMINI_API_KEY')) {
        return res.status(503).json({ error: err.message });
      }
      if (err.message.includes('Quota')) {
        return res.status(429).json({ error: err.message });
      }

      res.status(500).json({ error: err.message || 'Erreur lors de l\'analyse du CV' });
    }
  }
);

module.exports = router;

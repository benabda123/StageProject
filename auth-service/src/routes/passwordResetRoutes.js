const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const mailer = require('../mailer');
const keycloakAdmin = require('../keycloakAdminClient');

const router = express.Router();

function generateCode() {
  // Code aléatoire à 6 chiffres (100000 -> 999999)
  return crypto.randomInt(100000, 1000000).toString();
}

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
];

const resetPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('code').matches(/^\d{6}$/).withMessage('Le code doit contenir exactement 6 chiffres'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

// POST /auth/forgot-password — route PUBLIQUE (aucun JWT requis, l'utilisateur n'est pas connecté)
// Deux étapes selon le flag `confirm` :
//   confirm=false (vérification)  -> { found: true/false } (l'email est-il un compte existant ?)
//   confirm=true  (confirmation)  -> génère + envoie le code par email
router.post('/auth/forgot-password', forgotPasswordValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.body.email.trim().toLowerCase();
  const confirm = req.body.confirm === true;

  try {
    const users = await keycloakAdmin.getUsersByEmail(email);

    if (users.length === 0) {
      if (confirm) {
        return res.status(404).json({ error: 'Aucun utilisateur avec cet email' });
      }
      return res.json({ found: false });
    }

    if (!confirm) {
      // Étape 1 : l'email correspond à un compte existant -> demande de confirmation
      return res.json({ found: true, firstName: users[0].firstName || '' });
    }

    // Étape 2 : l'utilisateur a confirmé -> générer et envoyer le code
    const user = users[0];
    const code = generateCode();

    // Invalide tout code précédent non utilisé pour cet utilisateur
    await pool.query(
      `UPDATE password_reset_codes SET used = true WHERE user_id = $1 AND used = false`,
      [user.id]
    );

    // Insère le nouveau code avec expiration à +10 minutes
    await pool.query(
      `INSERT INTO password_reset_codes (user_id, email, code, expires_at)
       VALUES ($1, $2, $3, now() + interval '10 minutes')`,
      [user.id, email, code]
    );

    try {
      await mailer.sendPasswordResetCode(email, code);
    } catch (mailErr) {
      console.error('Erreur envoi email de réinitialisation:', mailErr.message);
      return res.status(500).json({ error: "Impossible d'envoyer l'email. Réessayez plus tard." });
    }

    res.json({ found: true, message: 'Un code de réinitialisation vous a été envoyé par email.' });
  } catch (err) {
    console.error('Erreur POST /auth/forgot-password:', err);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// POST /auth/reset-password — route PUBLIQUE (aucun JWT requis)
router.post('/auth/reset-password', resetPasswordValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code, newPassword } = req.body;
  const email = req.body.email.trim().toLowerCase();

  try {
    // Cherche un code valide : correspondant à email + code, non utilisé ET non expiré
    const result = await pool.query(
      `SELECT * FROM password_reset_codes
       WHERE email = $1 AND code = $2 AND used = false AND expires_at > now()
       ORDER BY id DESC LIMIT 1`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }

    const record = result.rows[0];

    // Réinitialise le mot de passe côté Keycloak
    await keycloakAdmin.resetUserPassword(record.user_id, newPassword);

    // Marque le code comme utilisé (uniquement après succès)
    await pool.query('UPDATE password_reset_codes SET used = true WHERE id = $1', [record.id]);

    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    console.error('Erreur POST /auth/reset-password:', err);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

module.exports = router;

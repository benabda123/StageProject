require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./src/routes/userRoutes');
const internalRoutes = require('./src/routes/internalRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const passwordResetRoutes = require('./src/routes/passwordResetRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Dossier des avatars (volume Docker monté sur /app/uploads)
const AVATARS_DIR = path.join(process.cwd(), 'uploads', 'avatars');

// Fichiers statiques des avatars — PUBLIC (pas de JWT requis pour afficher les images)
// Servi aux deux chemins : /profile/uploads (direct) et /auth/profile/uploads (via Kong strip_path:false)
app.use('/profile/uploads', express.static(AVATARS_DIR));
app.use('/auth/profile/uploads', express.static(AVATARS_DIR));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/auth', limiter);

// Routes
app.use('/', userRoutes);
app.use('/', profileRoutes);
app.use('/', passwordResetRoutes);
app.use('/internal', internalRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 8084;
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
  console.log(`Keycloak URL: ${process.env.KEYCLOAK_URL}`);
  console.log(`Realm: ${process.env.REALM}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cvRoutes = require('./src/adapters/input/cvRoutes');

const app = express();
const PORT = process.env.PORT || 8097;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'cv-parser-service',
    gemini: process.env.GEMINI_API_KEY ? 'configured' : 'NOT configured',
  });
});

// Routes
app.use('/cv', cvRoutes);

// Global error handler — gère notamment les erreurs multer (taille dépassée, stream corrompu)
app.use((err, req, res, next) => {
  // Erreurs multer — taille dépassée
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop volumineux. La taille maximale est 5 Mo.' });
  }
  // Erreurs multer — type MIME refusé
  if (err.message && err.message.includes('Seuls les fichiers')) {
    return res.status(400).json({ error: err.message });
  }
  // Erreurs multer — stream / multipart malformé
  if (err.message && (err.message.includes('Multipart') || err.message.includes('multipart') || err.message.includes('boundary'))) {
    return res.status(400).json({ error: 'Requête multipart malformée. Vérifiez que le fichier est bien attaché.' });
  }
  console.error('UNHANDLED ERROR:', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`CV Parser Service running on port ${PORT}`);
  console.log(`Gemini AI: ${process.env.GEMINI_API_KEY ? 'configured ✓' : 'NOT configured ✗'}`);
});

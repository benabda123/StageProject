require('dotenv').config();
const express = require('express');
const cors = require('cors');
const learningRoutes = require('./src/adapters/input/learningRoutes');

const app = express();
const PORT = process.env.PORT || 8092;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check — non protégé, utilisé par Docker/Kong
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'learning-service' });
});

// Routes métier
app.use('/', learningRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('ERREUR NON GÉRÉE:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Learning Service running on port ${PORT}`);
});

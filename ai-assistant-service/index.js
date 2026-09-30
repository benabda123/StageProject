require('dotenv').config();
const express = require('express');
const cors = require('cors');
const aiRoutes = require('./src/adapters/input/aiRoutes');

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

// Routes
app.use('/', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'ai-assistant-service' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('ERREUR NON GÉRÉE:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Assistant Service running on port ${PORT}`);
});

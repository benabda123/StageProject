require('dotenv').config();
const express = require('express');
const cors = require('cors');
const meetingRoutes = require('./src/adapters/input/meetingRoutes');
const googleOAuthRoutes = require('./src/adapters/input/googleOAuthRoutes');
const roomRoutes = require('./src/adapters/input/roomRoutes');
const internalRoutes = require('./src/adapters/input/internalRoutes');

const app = express();
const PORT = process.env.PORT || 8088;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/internal', internalRoutes);
app.use('/meetings/google', googleOAuthRoutes);
app.use('/meetings', meetingRoutes);
app.use('/rooms', roomRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('ERREUR NON GÉRÉE:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'meeting-service' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Meeting Service running on port ${PORT}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dashboardRoutes = require('./src/adapters/input/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 8091;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'dashboard-service' });
});

// Routes
app.use('/', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('ERREUR NON GÉRÉE:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dashboard Service running on port ${PORT}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const notificationRoutes = require('./src/adapters/input/notificationRoutes');
const internalRoutes = require('./src/adapters/input/internalRoutes');

const app = express();
const PORT = process.env.PORT || 8089;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/notifications', notificationRoutes);
app.use('/internal', internalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification-service' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

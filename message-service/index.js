require('dotenv').config();
const express = require('express');
const cors = require('cors');
const messageRoutes = require('./src/adapters/input/messageRoutes');

const app = express();
const PORT = process.env.PORT || 8090;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/messages', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'message-service' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Message Service running on port ${PORT}`);
});

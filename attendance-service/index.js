require('dotenv').config();
const express = require('express');
const cors = require('cors');
const attendanceRoutes = require('./src/adapters/input/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 8094;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'attendance-service' });
});

// Routes
app.use('/', attendanceRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Attendance Service running on port ${PORT}`);
  console.log(`Office coordinates: ${process.env.OFFICE_LATITUDE}, ${process.env.OFFICE_LONGITUDE}`);
  console.log(`Max radius: ${process.env.MAX_CHECKIN_RADIUS_METERS}m`);
});

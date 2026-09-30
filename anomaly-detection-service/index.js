require('dotenv').config();
const express = require('express');
const cors = require('cors');
const anomalyRoutes = require('./src/adapters/input/anomalyRoutes');

const app = express();
const PORT = process.env.PORT || 8095;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'anomaly-detection-service' });
});

app.use('/', anomalyRoutes);

app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Anomaly Detection Service running on port ${PORT}`);
  console.log(`Analysis period: ${process.env.ANALYSIS_PERIOD_DAYS} days`);
  console.log(`Gemini AI: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT configured'}`);
});

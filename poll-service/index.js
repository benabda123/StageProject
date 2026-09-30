require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pollRoutes = require('./src/adapters/input/pollRoutes');

const app = express();
const PORT = process.env.PORT || 8096;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'poll-service' });
});

app.use('/', pollRoutes);

app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Poll Service running on port ${PORT}`);
});

// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const employeeRoutes = require('./src/adapters/input/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 8082;

app.use(cors());
app.use(express.json());

// Association de la route
app.use('/employees', employeeRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Employee Service' });
});

app.listen(PORT, () => {
  console.log(`🚀 Employee Service tourne sur le port ${PORT}`);
});
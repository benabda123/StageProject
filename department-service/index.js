const express = require('express');
const cors = require('cors');
require('dotenv').config();

const departmentRoutes = require('./src/adapters/input/departmentRoutes');

const app = express();
const PORT = process.env.PORT || 8083;

app.use(cors());
app.use(express.json());

// Routes
app.use('/departments', departmentRoutes);

app.listen(PORT, () => {
  console.log(`Department Service running on port ${PORT}`);
});
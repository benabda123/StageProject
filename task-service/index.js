require('dotenv').config();
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./src/adapters/input/taskRoutes');
const internalRoutes = require('./src/adapters/input/internalRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/internal', internalRoutes);
app.use('/', taskRoutes);

const PORT = process.env.PORT || 8087;
app.listen(PORT, () => {
  console.log(`Task Service running on port ${PORT}`);
});

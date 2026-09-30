require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ticketRoutes = require('./src/adapters/input/ticketRoutes');
const aiRoutes = require('./src/adapters/input/aiRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/', ticketRoutes);
app.use('/', aiRoutes);

const PORT = process.env.PORT || 8093;
app.listen(PORT, () => {
  console.log(`Ticket Service running on port ${PORT}`);
});

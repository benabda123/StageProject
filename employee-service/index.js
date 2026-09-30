const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./src/adapters/input/employeeRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Écoute sur la racine '/' car Kong transmet directement le chemin après /employees
app.use('/', employeeRoutes);
app.use('/employees', employeeRoutes); // On garde aussi /employees au cas où !

const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`Employee Service running on port ${PORT}`);
});
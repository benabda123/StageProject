// src/adapters/input/employeeRoutes.js
const express = require('express');
const router = express.Router();
const EmployeeController = require('./EmployeeController');

router.post('/', EmployeeController.createEmployee);
router.get('/', EmployeeController.getAllEmployees);

module.exports = router;
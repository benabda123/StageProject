// src/adapters/input/EmployeeController.js
const PostgresEmployeeRepository = require('../output/PostgresEmployeeRepository');
const CreateEmployee = require('../../domain/usecases/CreateEmployee');
const GetEmployees = require('../../domain/usecases/GetEmployees');

const employeeRepository = new PostgresEmployeeRepository();

exports.createEmployee = async (req, res) => {
  try {
    const useCase = new CreateEmployee(employeeRepository);
    const newEmployee = await useCase.execute(req.body);
    return res.status(201).json(newEmployee);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const useCase = new GetEmployees(employeeRepository);
    const employees = await useCase.execute();
    return res.status(200).json(employees);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
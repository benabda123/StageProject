// src/domain/usecases/CreateEmployee.js
const Employee = require('../models/Employee');

class CreateEmployee {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository; // Port sortant (injection)
  }

  async execute(employeeData) {
    // 1. Instanciation du modèle
    const employee = new Employee(employeeData);

    // 2. Application de la logique/règle métier
    employee.validate();

    // 3. Sauvegarde via le repository (Adaptateur DB)
    const savedEmployee = await this.employeeRepository.save(employee);
    
    return savedEmployee;
  }
}

module.exports = CreateEmployee;
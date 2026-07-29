// src/domain/usecases/GetEmployees.js

class GetEmployees {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute() {
    return await this.employeeRepository.findAll();
  }
}

module.exports = GetEmployees;
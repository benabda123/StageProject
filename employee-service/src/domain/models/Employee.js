// src/domain/models/Employee.js

class Employee {
  constructor({ id, userId, departmentId, firstName, lastName, position, phone }) {
    this.id = id;
    this.userId = userId;
    this.departmentId = departmentId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.position = position;
    this.phone = phone;
  }

  // Règle métier : validation des données
  validate() {
    if (!this.firstName || !this.lastName) {
      throw new Error("Le prénom et le nom sont obligatoires.");
    }
    if (!this.position) {
      throw new Error("Le poste de l'employé est obligatoire.");
    }
    return true;
  }
}

module.exports = Employee;
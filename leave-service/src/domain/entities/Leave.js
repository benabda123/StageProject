class Leave {
  constructor({ id, employeeId, employeeUsername, type, startDate, endDate, reason, status, createdAt, updatedAt }) {
    this.id = id;
    this.employeeId = employeeId;
    this.employeeUsername = employeeUsername;
    this.type = type;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason;
    this.status = status || 'en_attente';
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  validate() {
    const errors = [];

    const validTypes = ['annuel', 'maladie', 'personnel', 'sans_solde'];
    if (!this.type || !validTypes.includes(this.type)) {
      errors.push('Type de congé invalide. Valeurs autorisées: annuel, maladie, personnel, sans_solde');
    }

    if (!this.startDate) {
      errors.push('Date de début requise');
    }

    if (!this.endDate) {
      errors.push('Date de fin requise');
    }

    if (this.startDate && this.endDate && new Date(this.endDate) < new Date(this.startDate)) {
      errors.push('La date de fin doit être supérieure ou égale à la date de début');
    }

    return errors;
  }

  isValid() {
    return this.validate().length === 0;
  }
}

module.exports = Leave;

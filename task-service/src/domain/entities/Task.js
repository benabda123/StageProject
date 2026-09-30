class Task {
  constructor({ id, title, description, employeeId, employeeUsername, createdBy, status, priority, dueDate, createdAt, updatedAt }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.employeeId = employeeId;
    this.employeeUsername = employeeUsername;
    this.createdBy = createdBy;
    this.status = status || 'TODO';
    this.priority = priority || 'MEDIUM';
    this.dueDate = dueDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isValid() {
    const errors = [];

    if (!this.title || this.title.trim() === '') {
      errors.push('Title is required');
    }

    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (!validStatuses.includes(this.status)) {
      errors.push(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    if (!validPriorities.includes(this.priority)) {
      errors.push(`Invalid priority: ${this.priority}. Must be one of: ${validPriorities.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = Task;

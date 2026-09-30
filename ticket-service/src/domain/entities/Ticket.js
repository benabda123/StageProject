class Ticket {
  constructor({ id, title, description, category, priority, status, employeeId, employeeUsername, assignedToId, assignedToUsername, attachmentUrl, createdAt, updatedAt }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.category = category;
    this.priority = priority || 'MEDIUM';
    this.status = status || 'OPEN';
    this.employeeId = employeeId;
    this.employeeUsername = employeeUsername;
    this.assignedToId = assignedToId || null;
    this.assignedToUsername = assignedToUsername || null;
    this.attachmentUrl = attachmentUrl || null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isValid() {
    const errors = [];

    if (!this.title || this.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!this.description || this.description.trim() === '') {
      errors.push('Description is required');
    }

    const validCategories = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS_REQUEST', 'SECURITY'];
    if (this.category && !validCategories.includes(this.category)) {
      errors.push(`Invalid category: ${this.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    if (!validPriorities.includes(this.priority)) {
      errors.push(`Invalid priority: ${this.priority}. Must be one of: ${validPriorities.join(', ')}`);
    }

    const validStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(this.status)) {
      errors.push(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = Ticket;

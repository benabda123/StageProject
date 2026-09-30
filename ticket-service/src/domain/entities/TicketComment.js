class TicketComment {
  constructor({ id, ticketId, authorId, authorUsername, message, createdAt }) {
    this.id = id;
    this.ticketId = ticketId;
    this.authorId = authorId;
    this.authorUsername = authorUsername;
    this.message = message;
    this.createdAt = createdAt;
  }

  isValid() {
    const errors = [];

    if (!this.message || this.message.trim() === '') {
      errors.push('Message is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = TicketComment;

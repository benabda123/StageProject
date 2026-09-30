const TicketComment = require('../entities/TicketComment');

class AddComment {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(ticketId, authorId, authorUsername, message, userRoles) {
    // Check ticket exists
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Authorization: creator OR admin/itsupport
    const isCreator = ticket.employeeId === authorId;
    const isITSupport = userRoles.includes('admin') || userRoles.includes('itsupport');

    if (!isCreator && !isITSupport) {
      throw new Error('Forbidden: only ticket creator or IT Support can add comments');
    }

    const comment = new TicketComment({
      ticketId,
      authorId,
      authorUsername,
      message
    });

    const validation = comment.isValid();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    return await this.ticketRepository.addComment(comment);
  }
}

module.exports = AddComment;

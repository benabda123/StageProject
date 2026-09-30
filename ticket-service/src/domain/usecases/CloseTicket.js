class CloseTicket {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(ticketId, callerId) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Only the employee who created the ticket can close it
    if (ticket.employeeId !== callerId) {
      throw new Error('Forbidden: only the ticket creator can close the ticket');
    }

    // Ticket must be in RESOLVED status to be closed
    if (ticket.status !== 'RESOLVED') {
      throw new Error(`Ticket cannot be closed: current status is ${ticket.status}, must be RESOLVED`);
    }

    return await this.ticketRepository.updateStatus(ticketId, 'CLOSED');
  }
}

module.exports = CloseTicket;

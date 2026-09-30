class UpdateTicketStatus {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(ticketId, newStatus) {
    const validStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status === 'CLOSED') {
      throw new Error('Cannot update a closed ticket');
    }

    return await this.ticketRepository.updateStatus(ticketId, newStatus);
  }
}

module.exports = UpdateTicketStatus;

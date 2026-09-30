class AssignTicket {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(ticketId, assignedToId, assignedToUsername) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status === 'CLOSED') {
      throw new Error('Cannot assign a closed ticket');
    }

    return await this.ticketRepository.assign(ticketId, assignedToId, assignedToUsername);
  }
}

module.exports = AssignTicket;

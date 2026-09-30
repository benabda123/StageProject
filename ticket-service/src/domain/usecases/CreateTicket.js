const Ticket = require('../entities/Ticket');

class CreateTicket {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(data) {
    const ticket = new Ticket({
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || 'MEDIUM',
      status: 'OPEN',
      employeeId: data.employeeId,
      employeeUsername: data.employeeUsername,
      attachmentUrl: data.attachmentUrl || null
    });

    const validation = ticket.isValid();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    return await this.ticketRepository.create(ticket);
  }
}

module.exports = CreateTicket;

class GetAllTickets {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(filters) {
    return await this.ticketRepository.findAll(filters);
  }
}

module.exports = GetAllTickets;

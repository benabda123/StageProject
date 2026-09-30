class GetMyTickets {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(employeeId) {
    return await this.ticketRepository.findByEmployeeId(employeeId);
  }
}

module.exports = GetMyTickets;

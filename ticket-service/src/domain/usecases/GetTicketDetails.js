class GetTicketDetails {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(ticketId, callerId, userRoles) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Authorization: creator OR admin/itsupport
    const isCreator = ticket.employeeId === callerId;
    const isITSupport = userRoles.includes('admin') || userRoles.includes('itsupport');

    if (!isCreator && !isITSupport) {
      throw new Error('Forbidden: only ticket creator or IT Support can view ticket details');
    }

    const comments = await this.ticketRepository.findCommentsByTicketId(ticketId);

    return {
      ...ticket,
      comments
    };
  }
}

module.exports = GetTicketDetails;

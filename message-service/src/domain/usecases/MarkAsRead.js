class MarkAsRead {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute(employeeId, senderRole) {
    return await this.messageRepository.markAsRead(employeeId, senderRole);
  }
}

module.exports = MarkAsRead;

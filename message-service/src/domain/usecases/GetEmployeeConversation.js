class GetEmployeeConversation {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute(employeeId) {
    if (!employeeId) {
      throw new Error("L'identifiant employé est requis");
    }

    const messages = await this.messageRepository.getMessagesByEmployeeId(employeeId);
    await this.messageRepository.markAsRead(employeeId, 'admin');
    return messages;
  }
}

module.exports = GetEmployeeConversation;

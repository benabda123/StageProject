class ChatMessageRepositoryPort {
  async createMessage(chatMessageData) {
    throw new Error('Method not implemented');
  }

  async getMessagesByEmployeeId(employeeId) {
    throw new Error('Method not implemented');
  }

  async getAllConversations() {
    throw new Error('Method not implemented');
  }

  async markAsRead(employeeId, senderRole) {
    throw new Error('Method not implemented');
  }
}

module.exports = ChatMessageRepositoryPort;

class GetAllConversations {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute() {
    return await this.messageRepository.getAllConversations();
  }
}

module.exports = GetAllConversations;

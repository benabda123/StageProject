class SendMessage {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute({ sender_id, sender_name, sender_role, recipient_id, employee_id, message }) {
    if (!message || !message.trim()) {
      throw new Error('Le message ne peut pas être vide');
    }

    return await this.messageRepository.createMessage({
      sender_id,
      sender_name,
      sender_role,
      recipient_id,
      employee_id,
      message: message.trim()
    });
  }
}

module.exports = SendMessage;

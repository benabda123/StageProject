class MarkAllAsRead {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(userId) {
    return await this.notificationRepository.markAllAsRead(userId);
  }
}

module.exports = MarkAllAsRead;

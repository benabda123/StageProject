class MarkAsRead {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(id, userId) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    if (notification.user_id !== userId) {
      throw new Error('You do not have permission to mark this notification as read');
    }
    return await this.notificationRepository.markAsRead(id);
  }
}

module.exports = MarkAsRead;

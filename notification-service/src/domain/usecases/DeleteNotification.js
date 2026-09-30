class DeleteNotification {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(id, userId) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    if (notification.user_id !== userId) {
      throw new Error('You do not have permission to delete this notification');
    }
    await this.notificationRepository.delete(id);
  }
}

module.exports = DeleteNotification;

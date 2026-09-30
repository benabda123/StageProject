const Notification = require('../entities/Notification');

class CreateNotification {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(notificationData) {
    const notification = new Notification({
      ...notificationData,
      status: notificationData.status || 'UNREAD'
    });
    return await this.notificationRepository.create(notification);
  }
}

module.exports = CreateNotification;

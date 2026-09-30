class GetAllNotifications {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(filters = {}) {
    return await this.notificationRepository.findAll(filters);
  }
}

module.exports = GetAllNotifications;

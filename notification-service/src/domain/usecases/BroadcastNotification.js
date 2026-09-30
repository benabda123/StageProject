const axios = require('axios');
const Notification = require('../entities/Notification');

class BroadcastNotification {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:8084';
    this.internalApiKey = process.env.INTERNAL_API_KEY;
  }

  async execute(broadcastData) {
    const { target, title, message, type, departmentId, userId } = broadcastData;

    let recipients = [];

    if (target === 'USER') {
      if (!userId) {
        throw new Error('userId is required for USER target');
      }
      recipients = [userId];
    } else if (target === 'ALL' || target === 'DEPARTMENT') {
      // Fetch employees from auth-service internal route
      const response = await axios.get(`${this.authServiceUrl}/internal/employees`, {
        headers: {
          'x-internal-api-key': this.internalApiKey
        }
      });

      let employees = response.data;

      if (target === 'DEPARTMENT') {
        if (!departmentId) {
          throw new Error('departmentId is required for DEPARTMENT target');
        }
        // Filter by departmentId from Keycloak attributes
        employees = employees.filter(emp => {
          const deptId = emp.attributes?.departmentId?.[0];
          return deptId && deptId === departmentId.toString();
        });
      }

      recipients = employees.map(emp => emp.id);
    } else {
      throw new Error('Invalid target. Must be ALL, DEPARTMENT, or USER');
    }

    if (recipients.length === 0) {
      throw new Error('No recipients found for the specified target');
    }

    // Create individual notification for each recipient
    const notifications = [];
    for (const recipientId of recipients) {
      const notification = new Notification({
        user_id: recipientId,
        title,
        message,
        type,
        status: 'UNREAD'
      });
      const created = await this.notificationRepository.create(notification);
      notifications.push(created);
    }

    return notifications;
  }
}

module.exports = BroadcastNotification;

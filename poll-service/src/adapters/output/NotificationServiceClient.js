/**
 * Adapter Output — NotificationServiceClient
 * Envoie des notifications à tous les employees via notification-service.
 * Appel inter-service protégé par x-internal-api-key.
 * Resilient : les erreurs ne bloquent pas la création du sondage.
 */
const fetch = require('node-fetch');

class NotificationServiceClient {
  constructor() {
    this.baseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8089';
    this.internalApiKey = process.env.INTERNAL_API_KEY || '';
  }

  async notifyAll({ type, title, message, pollId }) {
    try {
      const response = await fetch(`${this.baseUrl}/internal/notify-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': this.internalApiKey,
        },
        body: JSON.stringify({ type, title, message, metadata: { pollId } }),
        timeout: 5000,
      });

      if (!response.ok) {
        console.warn(`[NotificationServiceClient] HTTP ${response.status}`);
      }
    } catch (err) {
      console.warn(`[NotificationServiceClient] Failed: ${err.message}`);
    }
  }
}

module.exports = NotificationServiceClient;

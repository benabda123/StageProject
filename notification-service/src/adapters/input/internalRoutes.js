const express = require('express');
const CreateNotification = require('../../domain/usecases/CreateNotification');
const BroadcastNotification = require('../../domain/usecases/BroadcastNotification');
const PostgresNotificationRepository = require('../../adapters/output/PostgresNotificationRepository');
const requireInternalApiKey = require('../../middleware/requireInternalApiKey');

const router = express.Router();
const notificationRepository = new PostgresNotificationRepository();

// POST /internal/notifications - Create notification (internal API, protected by API key)
router.post('/notifications', requireInternalApiKey, async (req, res) => {
  try {
    const createNotification = new CreateNotification(notificationRepository);
    const notification = await createNotification.execute(req.body);
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /internal/notifications/broadcast - Broadcast notification (internal API, protected by API key)
router.post('/notifications/broadcast', requireInternalApiKey, async (req, res) => {
  try {
    const broadcastNotification = new BroadcastNotification(notificationRepository);
    const notifications = await broadcastNotification.execute(req.body);
    res.status(201).json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

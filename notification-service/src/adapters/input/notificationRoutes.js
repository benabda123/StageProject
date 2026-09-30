const express = require('express');
const jwt = require('jsonwebtoken');
const CreateNotification = require('../../domain/usecases/CreateNotification');
const GetMyNotifications = require('../../domain/usecases/GetMyNotifications');
const MarkAsRead = require('../../domain/usecases/MarkAsRead');
const MarkAllAsRead = require('../../domain/usecases/MarkAllAsRead');
const DeleteNotification = require('../../domain/usecases/DeleteNotification');
const GetAllNotifications = require('../../domain/usecases/GetAllNotifications');
const BroadcastNotification = require('../../domain/usecases/BroadcastNotification');
const PostgresNotificationRepository = require('../../adapters/output/PostgresNotificationRepository');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();
const notificationRepository = new PostgresNotificationRepository();

// Helper function to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalide" });
  }
}

// GET /notifications/my - Get my notifications (any authenticated user)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const getMyNotifications = new GetMyNotifications(notificationRepository);
    const notifications = await getMyNotifications.execute(req.user.sub);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /notifications/:id/read - Mark notification as read (owner only)
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const markAsRead = new MarkAsRead(notificationRepository);
    const notification = await markAsRead.execute(parseInt(req.params.id), req.user.sub);
    res.json(notification);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

// PUT /notifications/read-all - Mark all notifications as read (authenticated user)
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const markAllAsRead = new MarkAllAsRead(notificationRepository);
    const notifications = await markAllAsRead.execute(req.user.sub);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /notifications/:id - Delete notification (owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleteNotification = new DeleteNotification(notificationRepository);
    await deleteNotification.execute(parseInt(req.params.id), req.user.sub);
    res.status(204).send();
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

// GET /notifications - Get all notifications (admin only)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const getAllNotifications = new GetAllNotifications(notificationRepository);
    const filters = {
      user_id: req.query.user_id,
      type: req.query.type,
      status: req.query.status
    };
    const notifications = await getAllNotifications.execute(filters);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /notifications/broadcast - Broadcast notification (admin only)
router.post('/broadcast', requireRole('admin'), async (req, res) => {
  try {
    const broadcastNotification = new BroadcastNotification(notificationRepository);
    const notifications = await broadcastNotification.execute(req.body);
    res.status(201).json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

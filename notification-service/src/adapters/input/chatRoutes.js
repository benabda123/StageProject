const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PostgresChatRepository = require('../output/PostgresChatRepository');

const chatRepo = new PostgresChatRepository();

// Helper to decode Keycloak JWT
function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return jwt.decode(token);
}

// 1. Send a chat message
router.post('/messages', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return res.status(401).json({ error: "Non autorisé, token manquant" });
    }

    const { message, recipient_id, employee_id: bodyEmployeeId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Le message ne peut pas être vide" });
    }

    const roles = decoded.realm_access?.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('manager');
    const sender_role = isAdmin ? 'admin' : 'employee';

    const sender_id = decoded.sub || decoded.preferred_username || 'user';
    const firstName = decoded.given_name || '';
    const lastName = decoded.family_name || '';
    const sender_name = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (decoded.preferred_username || 'User');

    // For employees, employee_id is their own ID. For admins, employee_id is the recipient employee's ID.
    const employee_id = isAdmin ? (bodyEmployeeId || recipient_id) : sender_id;
    const recipient = isAdmin ? (bodyEmployeeId || recipient_id) : 'admin';

    const createdMsg = await chatRepo.createMessage({
      sender_id,
      sender_name,
      sender_role,
      recipient_id: recipient,
      employee_id,
      message: message.trim()
    });

    res.status(201).json(createdMsg);
  } catch (err) {
    console.error('Erreur envoi message chat:', err);
    res.status(500).json({ error: "Erreur serveur lors de l'envoi du message" });
  }
});

// 2. Get messages for logged-in employee
router.get('/messages/my-conversation', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const employee_id = decoded.sub || decoded.preferred_username;
    const messages = await chatRepo.getMessagesByEmployeeId(employee_id);
    
    // Mark admin messages as read for this employee
    await chatRepo.markAsRead(employee_id, 'admin');

    res.json(messages);
  } catch (err) {
    console.error('Erreur chargement conversation:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 3. Admin: Get all conversations
router.get('/conversations', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const conversations = await chatRepo.getAllConversations();
    res.json(conversations);
  } catch (err) {
    console.error('Erreur chargement conversations admin:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 4. Admin: Get conversation messages for a specific employee
router.get('/messages/conversation/:employeeId', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const { employeeId } = req.params;
    const messages = await chatRepo.getMessagesByEmployeeId(employeeId);

    // Mark employee messages as read by admin
    await chatRepo.markAsRead(employeeId, 'employee');

    res.json(messages);
  } catch (err) {
    console.error('Erreur chargement messages conversation admin:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

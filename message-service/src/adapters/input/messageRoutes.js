const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const PostgresChatMessageRepository = require('../output/PostgresChatMessageRepository');
const SendMessage = require('../../domain/usecases/SendMessage');
const GetEmployeeConversation = require('../../domain/usecases/GetEmployeeConversation');
const GetAllConversations = require('../../domain/usecases/GetAllConversations');
const MarkAsRead = require('../../domain/usecases/MarkAsRead');

const repo = new PostgresChatMessageRepository();
const sendMessageUC = new SendMessage(repo);
const getEmployeeConvUC = new GetEmployeeConversation(repo);
const getAllConvUC = new GetAllConversations(repo);
const markAsReadUC = new MarkAsRead(repo);

function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return jwt.decode(token);
}

// 1. POST /messages - Send a message
router.post('/', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return res.status(401).json({ error: "Non autorisé, token manquant" });
    }

    const { message, recipient_id, employee_id: bodyEmployeeId } = req.body;

    const roles = decoded.realm_access?.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('manager');
    const sender_role = isAdmin ? 'admin' : 'employee';

    const sender_id = decoded.sub || decoded.preferred_username || 'user';
    const firstName = decoded.given_name || '';
    const lastName = decoded.family_name || '';
    const sender_name = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (decoded.preferred_username || 'User');

    const employee_id = isAdmin ? (bodyEmployeeId || recipient_id) : sender_id;
    const recipient = isAdmin ? (bodyEmployeeId || recipient_id) : 'admin';

    const createdMsg = await sendMessageUC.execute({
      sender_id,
      sender_name,
      sender_role,
      recipient_id: recipient,
      employee_id,
      message
    });

    res.status(201).json(createdMsg);
  } catch (err) {
    console.error('Erreur envoi message:', err);
    res.status(400).json({ error: err.message || "Erreur lors de l'envoi" });
  }
});

// 2. GET /messages/my-conversation - Get logged-in employee conversation
router.get('/my-conversation', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const employee_id = decoded.sub || decoded.preferred_username;
    const messages = await getEmployeeConvUC.execute(employee_id);
    res.json(messages);
  } catch (err) {
    console.error('Erreur chargement conversation employé:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 3. GET /messages/conversations - Admin: List all conversations
router.get('/conversations', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const conversations = await getAllConvUC.execute();
    res.json(conversations);
  } catch (err) {
    console.error('Erreur chargement conversations admin:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 4. GET /messages/conversation/:employeeId - Admin: Get specific employee messages
router.get('/conversation/:employeeId', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const { employeeId } = req.params;
    const messages = await repo.getMessagesByEmployeeId(employeeId);
    await markAsReadUC.execute(employeeId, 'employee');
    res.json(messages);
  } catch (err) {
    console.error('Erreur chargement conversation specifique admin:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

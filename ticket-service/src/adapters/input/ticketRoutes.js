const express = require('express');
const jwt = require('jsonwebtoken');
const PostgresTicketRepository = require('../output/PostgresTicketRepository');
const CreateTicket = require('../../domain/usecases/CreateTicket');
const GetMyTickets = require('../../domain/usecases/GetMyTickets');
const GetAllTickets = require('../../domain/usecases/GetAllTickets');
const GetTicketDetails = require('../../domain/usecases/GetTicketDetails');
const AssignTicket = require('../../domain/usecases/AssignTicket');
const UpdateTicketStatus = require('../../domain/usecases/UpdateTicketStatus');
const CloseTicket = require('../../domain/usecases/CloseTicket');
const AddComment = require('../../domain/usecases/AddComment');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();
const ticketRepository = new PostgresTicketRepository();

// Middleware to decode JWT and extract user info
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.substring(7);
  const decoded = jwt.decode(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  req.user = decoded;
  next();
};

// POST /tickets - Create a ticket (any authenticated user)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, priority, attachmentUrl } = req.body;
    const employeeId = req.user.sub;
    const employeeUsername = req.user.preferred_username || req.user.sub;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const createTicket = new CreateTicket(ticketRepository);
    const ticket = await createTicket.execute({
      title,
      description,
      category,
      priority,
      employeeId,
      employeeUsername,
      attachmentUrl
    });
    res.status(201).json(ticket);
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /tickets/mine - Get current user's tickets (any authenticated user)
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.sub;
    const getMyTickets = new GetMyTickets(ticketRepository);
    const tickets = await getMyTickets.execute(employeeId);
    res.json(tickets);
  } catch (err) {
    console.error('Error fetching my tickets:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des tickets' });
  }
});

// GET /tickets - Get all tickets (admin, itsupport)
router.get('/', authenticateToken, requireRole('admin', 'itsupport'), async (req, res) => {
  try {
    const { status, category, priority, assignedToId } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    if (assignedToId) filters.assignedToId = assignedToId;

    const getAllTickets = new GetAllTickets(ticketRepository);
    const tickets = await getAllTickets.execute(filters);
    res.json(tickets);
  } catch (err) {
    console.error('Error fetching all tickets:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des tickets' });
  }
});

// GET /tickets/:id - Get ticket details with comments (creator OR admin/itsupport)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const callerId = req.user.sub;
    const userRoles = req.user.realm_access?.roles || [];

    const getTicketDetails = new GetTicketDetails(ticketRepository);
    const result = await getTicketDetails.execute(id, callerId, userRoles);
    res.json(result);
  } catch (err) {
    console.error('Error fetching ticket details:', err);
    if (err.message === 'Ticket not found') {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (err.message.startsWith('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur lors de la récupération du ticket' });
  }
});

// PUT /tickets/:id/assign - Assign ticket (admin, itsupport)
router.put('/:id/assign', authenticateToken, requireRole('admin', 'itsupport'), async (req, res) => {
  try {
    const { id } = req.params;
    // Allow admin to assign to another IT Support member via body
    const assignedToId = req.body.assignedToId || req.user.sub;
    const assignedToUsername = req.body.assignedToUsername || req.user.preferred_username || req.user.sub;

    const assignTicket = new AssignTicket(ticketRepository);
    const ticket = await assignTicket.execute(id, assignedToId, assignedToUsername);
    res.json(ticket);
  } catch (err) {
    console.error('Error assigning ticket:', err);
    if (err.message === 'Ticket not found') {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT /tickets/:id/status - Update ticket status (admin, itsupport)
router.put('/:id/status', authenticateToken, requireRole('admin', 'itsupport'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updateTicketStatus = new UpdateTicketStatus(ticketRepository);
    const ticket = await updateTicketStatus.execute(id, status);
    res.json(ticket);
  } catch (err) {
    console.error('Error updating ticket status:', err);
    if (err.message === 'Ticket not found') {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT /tickets/:id/close - Close ticket (creator only, verified in use case)
router.put('/:id/close', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const callerId = req.user.sub;

    const closeTicket = new CloseTicket(ticketRepository);
    const ticket = await closeTicket.execute(id, callerId);
    res.json(ticket);
  } catch (err) {
    console.error('Error closing ticket:', err);
    if (err.message === 'Ticket not found') {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (err.message.startsWith('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
});

// POST /tickets/:id/comments - Add comment (creator OR admin/itsupport)
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authorId = req.user.sub;
    const authorUsername = req.user.preferred_username || req.user.sub;
    const { message } = req.body;
    const userRoles = req.user.realm_access?.roles || [];

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const addComment = new AddComment(ticketRepository);
    const comment = await addComment.execute(id, authorId, authorUsername, message, userRoles);
    res.status(201).json(comment);
  } catch (err) {
    console.error('Error adding comment:', err);
    if (err.message === 'Ticket not found') {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (err.message.startsWith('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

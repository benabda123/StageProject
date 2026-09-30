const express = require('express');
const CreateRoom = require('../../domain/usecases/CreateRoom');
const UpdateRoom = require('../../domain/usecases/UpdateRoom');
const DeleteRoom = require('../../domain/usecases/DeleteRoom');
const GetAllRooms = require('../../domain/usecases/GetAllRooms');
const PostgresRoomRepository = require('../../adapters/output/PostgresRoomRepository');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();
const roomRepository = new PostgresRoomRepository();

// GET /rooms - Get all rooms (any authenticated user)
router.get('/', requireRole('admin', 'employee', 'manager'), async (req, res) => {
  try {
    const getAllRooms = new GetAllRooms(roomRepository);
    const rooms = await getAllRooms.execute();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /rooms - Create room (admin only)
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const createRoom = new CreateRoom(roomRepository);
    const room = await createRoom.execute(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /rooms/:id - Update room (admin only)
router.put('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const updateRoom = new UpdateRoom(roomRepository);
    const room = await updateRoom.execute(parseInt(req.params.id), req.body);
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /rooms/:id - Delete room (admin only)
router.delete('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const deleteRoom = new DeleteRoom(roomRepository);
    const result = await deleteRoom.execute(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

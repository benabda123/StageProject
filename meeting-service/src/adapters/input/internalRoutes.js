const express = require('express');
const PostgresMeetingRepository = require('../output/PostgresMeetingRepository');
const requireInternalApiKey = require('../../middleware/requireInternalApiKey');

const router = express.Router();
const meetingRepository = new PostgresMeetingRepository();

// GET /internal/meetings?employeeIds=id1,id2,id3 - Returns CONFIRMED meetings for specific employees
router.get('/meetings', requireInternalApiKey, async (req, res) => {
  try {
    const { employeeIds } = req.query;
    let targetIds = [];
    if (employeeIds) {
      targetIds = employeeIds.split(',').map(id => id.trim()).filter(Boolean);
    }

    const allConfirmedMeetings = await meetingRepository.findAll({ status: 'CONFIRMED' });

    let filtered = allConfirmedMeetings;
    if (targetIds.length > 0) {
      filtered = allConfirmedMeetings.filter(m => {
        const isCreator = targetIds.includes(m.created_by_id);
        const isParticipant = Array.isArray(m.participants) && m.participants.some(p => targetIds.includes(p));
        return isCreator || isParticipant;
      });
    }

    const result = filtered.map(m => ({
      date: m.date,
      startTime: m.start_time,
      endTime: m.end_time,
      createdById: m.created_by_id,
      participants: m.participants
    }));

    res.json(result);
  } catch (err) {
    console.error('Erreur /internal/meetings:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

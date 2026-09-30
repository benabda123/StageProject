const express = require('express');
const requireRole = require('../../middleware/requireRole');
const GenerateMeetingPlan = require('../../domain/usecases/GenerateMeetingPlan');
const AnalyzeLeaveRequest = require('../../domain/usecases/AnalyzeLeaveRequest');

const router = express.Router();

const handleMeetingPlan = async (req, res) => {
  try {
    const { objective, departmentId } = req.body;
    if (!objective) {
      return res.status(400).json({ error: "L'objectif est requis" });
    }

    const useCase = new GenerateMeetingPlan();
    const meetingPlan = await useCase.execute(objective, departmentId);

    return res.json(meetingPlan);
  } catch (err) {
    console.error('Erreur route POST /ai/meeting-plan:', err.message);
    const errorMessage = err.message || 'Erreur lors de la génération du plan de réunion';
    return res.status(500).json({ error: errorMessage });
  }
};

const handleLeaveAnalysis = async (req, res) => {
  try {
    const { leaveRequestId } = req.body;
    if (!leaveRequestId) {
      return res.status(400).json({ error: "leaveRequestId est requis" });
    }

    const useCase = new AnalyzeLeaveRequest();
    const analysis = await useCase.execute(leaveRequestId);

    return res.json(analysis);
  } catch (err) {
    console.error('Erreur route POST /ai/leave-analysis:', err.message);
    const errorMessage = err.message || "Erreur lors de l'analyse du congé";
    return res.status(500).json({ error: errorMessage });
  }
};

// POST /ai/meeting-plan or POST /meeting-plan (admin, manager)
router.post('/ai/meeting-plan', requireRole('admin', 'manager'), handleMeetingPlan);
router.post('/meeting-plan', requireRole('admin', 'manager'), handleMeetingPlan);

// POST /ai/leave-analysis or POST /leave-analysis (admin, manager, hr)
router.post('/ai/leave-analysis', requireRole('admin', 'manager', 'hr'), handleLeaveAnalysis);
router.post('/leave-analysis', requireRole('admin', 'manager', 'hr'), handleLeaveAnalysis);

module.exports = router;

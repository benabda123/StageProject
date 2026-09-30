const InternalDataAggregator = require('../../adapters/output/InternalDataAggregator');
const GeminiClient = require('../../adapters/output/GeminiClient');

class GenerateMeetingPlan {
  async execute(objective, departmentId = null) {
    if (!objective || typeof objective !== 'string' || objective.trim() === '') {
      throw new Error('L\'objectif est requis pour générer le plan de réunion');
    }

    // 1. Rassembler le contexte de données internes
    const dataContext = await InternalDataAggregator.aggregateData(departmentId);

    // 2. Appeler Gemini Client avec l'objectif et les données de contexte
    try {
      const plan = await GeminiClient.generateMeetingPlan(objective, dataContext);
      return plan;
    } catch (err) {
      console.error('Erreur UseCase GenerateMeetingPlan:', err.message);
      throw err;
    }
  }
}

module.exports = GenerateMeetingPlan;

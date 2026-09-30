const fetch = require('node-fetch');

async function generateMeetingPlan(objective, dataContext) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('Clé API Gemini non configurée (GEMINI_API_KEY manquante)');
  }

  // Model endpoints to try in order of preference
  const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  const systemPrompt = `Tu es un assistant qui aide un manager à préparer une réunion d'équipe, en te basant UNIQUEMENT sur les données réelles fournies ci-dessous (tâches, employés, départements). Ne réponds jamais à des questions générales hors de ce contexte métier. Réponds STRICTEMENT en JSON valide, selon ce schéma exact, sans texte avant/après :
  {
    "title": "string",
    "objective": "string",
    "durationMinutes": number,
    "durationReason": "string",
    "participants": [{"username": "string", "reason": "string"}],
    "agenda": [{"topic": "string", "minutes": number}],
    "suggestedQuestions": {"username": ["question1", "question2"]}
  }`;

  const userPrompt = `Objectif du manager : "${objective}"\n\nDonnées disponibles :\n${JSON.stringify(dataContext, null, 2)}`;

  let lastError = null;

  for (const model of models) {
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error("Réponse vide de la part de l'API Gemini");
        }
        return JSON.parse(text); // le plan structuré
      }

      const errorBody = await response.text();
      lastError = new Error(`Gemini API error (${model}): ${response.status} - ${errorBody}`);
      
      // If error is 404 model not found, loop to next model
      if (response.status !== 404) {
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (err.message && err.message.includes('404')) {
        continue; // try next model
      }
      throw err;
    }
  }

  throw lastError || new Error('Impossible de contacter l\'API Gemini');
}

module.exports = { generateMeetingPlan };

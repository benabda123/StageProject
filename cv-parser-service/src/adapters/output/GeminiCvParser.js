/**
 * Adapter Output — GeminiCvParser
 * Envoie le texte extrait du CV à Gemini AI et retourne un JSON structuré.
 *
 * Utilise responseMimeType: 'application/json' pour forcer une réponse JSON
 * stricte sans texte autour (plus fiable qu'un parsing regex).
 *
 * La clé GEMINI_API_KEY est lue depuis les variables d'environnement —
 * elle n'est JAMAIS exposée au frontend.
 */
const fetch = require('node-fetch');

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

async function parseCv(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY non configurée — impossible d\'analyser le CV');
  }

  const prompt = `Tu es un extracteur de données RH. Analyse ce CV et retourne UNIQUEMENT un JSON valide avec ces champs exacts :

{
  "firstName": string ou null,
  "lastName": string ou null,
  "position": string ou null (titre du poste le plus récent ou actuel),
  "phone": string ou null (numéro tel quel, sans reformatage inventé),
  "email": string ou null,
  "skills": string[] (max 5 compétences principales, tableau vide [] si aucune trouvée)
}

Règles strictes :
- Si un champ est introuvable dans le CV, retourne null (jamais une chaîne vide, jamais une valeur inventée)
- Pour "phone" : retourne le numéro exactement comme écrit dans le CV, ou null si absent
- Pour "skills" : seulement des compétences techniques ou professionnelles explicitement mentionnées
- Ne retourne RIEN d'autre que ce JSON — pas d'explication, pas de markdown

CV à analyser :
${rawText}`;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        timeout: 20000,
      });

      if (response.ok) {
        const data = await response.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) {
          throw new Error('Gemini n\'a retourné aucune réponse valide');
        }
        return JSON.parse(rawJson);
      }

      const errorBody = await response.text();
      lastError = new Error(`Gemini API error (${model}): ${response.status} - ${errorBody}`);

      if (response.status === 429) {
        throw new Error('Quota Gemini dépassé — réessayez dans quelques secondes');
      }
      if (response.status !== 404) {
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (err.message && err.message.includes('404')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Impossible de contacter l\'API Gemini');
}

module.exports = { parseCv };

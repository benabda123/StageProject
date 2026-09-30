const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

const SYSTEM_PROMPT = `Tu es un assistant IT Support expert. Analyse l'image fournie qui montre un problème informatique.
Retourne UNIQUEMENT un objet JSON valide (pas de markdown, pas de texte avant/après) avec exactement ces champs :
{
  "title": "titre court du problème en français (max 80 caractères)",
  "description": "description détaillée du problème observé en français",
  "category": "une valeur parmi : HARDWARE, SOFTWARE, NETWORK, ACCESS_REQUEST, SECURITY",
  "priority": "une valeur parmi : LOW, MEDIUM, HIGH",
  "confidence": "high, medium ou low (estimation de ta confiance dans l'analyse)"
}

Règles :
- Si tu vois un écran bleu/erreur système → SOFTWARE, HIGH
- Si tu vois du matériel cassé/endommagé → HARDWARE, HIGH
- Si tu vois un message d'erreur réseau/WiFi → NETWORK, MEDIUM
- Si tu vois un écran de login bloqué/mot de passe → ACCESS_REQUEST, MEDIUM
- Si tu vois un avertissement de sécurité/virus/phishing → SECURITY, HIGH
- Si l'image n'est pas liée à un problème IT → retourne des valeurs par défaut avec confidence: low`;

// POST /analyze-image — AI analyzes an image and returns ticket fields (Google Gemini)
router.post('/analyze-image', authenticateToken, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || !image.startsWith('data:image')) {
      return res.status(400).json({ error: 'Image invalide (doit être en base64 data URL)' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ error: "Service IA non configuré (clé GEMINI_API_KEY manquante)" });
    }

    // Extract mime type and raw base64 from data URL
    const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Format d\'image invalide' });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const generate = async (model, retries = 3) => {
      let resp;
      try {
        resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }],
              },
              contents: [
                {
                  parts: [
                    { text: 'Analyse cette image de problème informatique et retourne le JSON.' },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024,
                responseMimeType: 'application/json',
              },
            }),
          }
        );
      } catch (err) {
        // Network-level failure (DNS, TLS, timeout) → retry
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 3000));
          return generate(model, retries - 1);
        }
        throw err;
      }

      // 429 rate limit → wait for the retry delay suggested by the API
      if (resp.status === 429 && retries > 0) {
        let wait = 5000;
        try {
          const errData = await resp.json();
          const retryInfo = errData.error?.details?.find((d) => d['@type']?.includes('RetryInfo'));
          if (retryInfo?.retryDelay && retryInfo.retryDelay.endsWith('s')) {
            wait = parseFloat(retryInfo.retryDelay) * 1000;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, wait));
        return generate(model, retries - 1);
      }

      return resp;
    };

    const MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

    let response;
    for (const model of MODELS) {
      response = await generate(model);
      if (response.ok) break;
      const errData = await response.json().catch(() => ({}));
      // Only try the next model if this one doesn't exist (404)
      if (response.status !== 404) break;
      console.error(`Gemini model ${model} unavailable:`, errData.error?.message);
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errData);
      return res.status(502).json({ error: "Erreur lors de l'analyse IA", details: errData.error?.message });
    }

    const data = await response.json();
    const raw = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('\n');

    // Parse the JSON from AI response (handle potential markdown wrapping)
    const extractJson = (text) => {
      const start = text.indexOf('{');
      if (start === -1) return null;
      let depth = 0;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
          depth--;
          if (depth === 0) return text.slice(start, i + 1);
        }
      }
      return null;
    };

    let result;
    const candidates = [raw, raw.replace(/```(?:json)?\s*/g, '').replace(/\s*```/g, '')];
    for (const candidate of candidates) {
      try {
        result = JSON.parse(candidate);
        break;
      } catch {
        const extracted = extractJson(candidate);
        if (extracted) {
          try {
            result = JSON.parse(extracted);
            break;
          } catch {}
        }
      }
    }

    if (!result) {
      console.error('Réponse IA invalide (raw):', raw);
      return res.status(500).json({ error: 'Réponse IA invalide', raw });
    }

    // Validate required fields
    if (!result.title || !result.description || !result.category || !result.priority) {
      return res.status(500).json({ error: 'Réponse IA incomplète', raw });
    }

    // Sanitize category
    const validCategories = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS_REQUEST', 'SECURITY'];
    if (!validCategories.includes(result.category)) {
      result.category = 'SOFTWARE';
    }

    // Sanitize priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    if (!validPriorities.includes(result.priority)) {
      result.priority = 'MEDIUM';
    }

    res.json({
      title: result.title,
      description: result.description,
      category: result.category,
      priority: result.priority,
      confidence: result.confidence || 'medium',
    });

  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: err.message || 'Erreur interne du service IA' });
  }
});

module.exports = router;

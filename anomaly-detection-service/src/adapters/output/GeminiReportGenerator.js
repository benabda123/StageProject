/**
 * Adapter Output — GeminiReportGenerator
 * Utilise l'API Gemini pour transformer les anomalies brutes
 * en rapport narratif lisible en français.
 *
 * Gemini intervient UNIQUEMENT ici — pas dans les calculs.
 * Les calculs statistiques sont faits dans le domaine (pure JS).
 */
const fetch = require('node-fetch');

class GeminiReportGenerator {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  /**
   * Génère un rapport narratif à partir des anomalies détectées
   * @param {Object} analysisData - Données d'analyse
   * @returns {Promise<string>} Rapport en français
   */
  async generateReport(analysisData) {
    if (!this.apiKey || this.apiKey === 'your_key_here') {
      throw new Error('GEMINI_API_KEY non configurée');
    }

    const { periodDays, totalEmployees, anomalyCount, employeeResults } = analysisData;

    const anomalousEmployees = employeeResults.filter(e => e.anomalyCount > 0);
    const normalEmployees = employeeResults.filter(e => e.anomalyCount === 0);

    const prompt = this._buildPrompt({
      periodDays,
      totalEmployees,
      anomalyCount,
      anomalousEmployees,
      normalEmployees,
    });

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
      timeout: 15000,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('Gemini returned empty response');
    return text.trim();
  }

  /**
   * Construit le prompt structuré pour Gemini
   * @private
   */
  _buildPrompt({ periodDays, totalEmployees, anomalyCount, anomalousEmployees, normalEmployees }) {
    const anomaliesDetail = anomalousEmployees.map(emp => {
      const anomalyList = emp.anomalies.map(a =>
        `    - [${a.severity}] ${a.type}: ${a.description}`
      ).join('\n');
      return `  Employé "${emp.employeeUsername}" (${emp.globalSeverity}) :\n${anomalyList}`;
    }).join('\n\n');

    return `Tu es un expert RH qui analyse les données de pointage d'une entreprise.

DONNÉES D'ANALYSE :
- Période analysée : ${periodDays} jours ouvrés
- Nombre total d'employés : ${totalEmployees}
- Anomalies détectées : ${anomalyCount}
- Employés sans anomalie : ${normalEmployees.length}

ANOMALIES DÉTECTÉES PAR EMPLOYÉ :
${anomaliesDetail || 'Aucune anomalie détectée.'}

TYPES D'ANOMALIES :
- ROBOTIC_CHECKIN : Les pointages arrivent toujours à la même seconde (écart-type très faible), suggérant une automatisation
- REPEATED_WEEKDAY_ABSENCE : Absent régulièrement le même jour de la semaine sans justification
- DURATION_TOO_SHORT : Durée de travail moyenne bien en dessous de la norme de l'équipe
- DURATION_TOO_LONG : Durée de travail moyenne bien au dessus (possible oubli de checkout)

NIVEAUX DE SÉVÉRITÉ :
- CRITICAL : Comportement très suspect, action immédiate recommandée
- WARNING : Comportement à surveiller, investigation recommandée
- NORMAL : Aucune anomalie

Ta mission : Rédige un rapport RH professionnel, concis et actionnable en français.
Le rapport doit :
1. Commencer par un résumé exécutif en 2-3 phrases
2. Détailler chaque employé suspect avec une explication claire
3. Proposer des actions concrètes pour l'admin
4. Se terminer par une conclusion
5. Utiliser des emojis pour rendre le rapport plus lisible (🔴 critique, 🟡 attention, ✅ normal)
6. Être rédigé de façon factuelle et objective, sans jugement de valeur

Longueur : 200-400 mots maximum.`;
  }
}

module.exports = GeminiReportGenerator;

const authServiceClient = require('../../adapters/output/httpClients/authServiceClient');
const taskServiceClient = require('../../adapters/output/httpClients/taskServiceClient');
const leaveServiceClient = require('../../adapters/output/httpClients/leaveServiceClient');


class AnalyzeLeaveRequest {
  async execute(leaveRequestId) {
    if (!leaveRequestId) {
      throw new Error('leaveRequestId est requis');
    }

    // 1. Fetch the leave request
    const leave = await leaveServiceClient.getLeaveById(leaveRequestId);

    // 2. Fetch employees
    const employees = await authServiceClient.getEmployees();

    // 3. Fetch pending leaves to compute availability
    let pendingLeaves = [];
    try {
      pendingLeaves = await leaveServiceClient.getPendingLeaves();
    } catch (err) {
      console.warn('Impossible de récupérer les congés en attente:', err.message);
    }

    // 4. Fetch tasks for the requesting employee
    let allTasks = [];
    try {
      allTasks = await taskServiceClient.getTasks();
    } catch (err) {
      console.warn('Impossible de récupérer les tâches:', err.message);
    }

    // 5. Build context for Gemini
    const totalEmployees = employees.length;

    // Count employees currently on approved leave or with pending requests
    const now = new Date();
    const employeesOnLeave = new Set();
    for (const l of pendingLeaves) {
      if (l.status === 'approved' || l.status === 'pending') {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        if (start <= now && end >= now) {
          employeesOnLeave.add(l.employeeId);
        }
      }
    }

    const teamAvailabilityPercent = totalEmployees > 0
      ? Math.round(((totalEmployees - employeesOnLeave.size) / totalEmployees) * 100)
      : 100;

    // Active tasks for the requesting employee
    const employeeTasks = allTasks.filter(t =>
      t.employeeId === leave.employeeId || t.employeeUsername === leave.employeeUsername
    );
    const activeTasks = employeeTasks.filter(t =>
      t.status === 'IN_PROGRESS' || t.status === 'TODO' || t.status === 'IN_REVIEW'
    );

    // Overdue tasks for this employee
    const overdueTasks = [];
    const criticalDeadlines = [];
    for (const task of activeTasks) {
      if (task.dueDate) {
        const due = new Date(task.dueDate);
        const diffMs = due.getTime() - now.getTime();
        const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysUntilDue < 0) {
          overdueTasks.push({ title: task.title, daysOverdue: Math.abs(daysUntilDue), priority: task.priority });
        } else if (daysUntilDue <= 7) {
          criticalDeadlines.push({ title: task.title, daysUntilDue, priority: task.priority });
        }
      }
    }

    const dataContext = {
      leaveRequest: {
        id: leave.id,
        employeeUsername: leave.employeeUsername,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        status: leave.status
      },
      teamAvailabilityPercent,
      totalEmployees,
      employeesCurrentlyOnLeave: employeesOnLeave.size,
      activeTaskCount: activeTasks.length,
      overdueTasks,
      criticalDeadlines,
      allTeamMembers: employees.map(e => ({
        username: e.username,
        fullName: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.username,
        departmentId: e.attributes?.departmentId
          ? (Array.isArray(e.attributes.departmentId) ? e.attributes.departmentId[0] : e.attributes.departmentId)
          : null
      }))
    };

    // 6. Call Gemini
    const systemPrompt = `Tu es un assistant RH expert qui analyse les demandes de congé en te basant UNIQUEMENT sur les données réelles fournies. Tu dois évaluer l'impact sur l'équipe et formuler une recommandation.

Réponds STRICTEMENT en JSON valide, selon ce schéma exact, sans texte avant/après :
{
  "teamAvailabilityPercent": number (0-100, pourcentage de disponibilité de l'équipe),
  "activeTasks": number (nombre de tâches actives de l'employé demandeur),
  "criticalDeadlineWarning": string | null (avertissement si des échéances critiques sont proches, sinon null),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "riskReason": "string (explication brève du niveau de risque)",
  "recommendation": "string (ta recommandation argumentée pour/approuver/refuser le congé)"
}`;

    const userPrompt = `Analyse cette demande de congé :\n\n${JSON.stringify(dataContext, null, 2)}`;

    return await this._callGemini(systemPrompt, userPrompt);
  }

  async _callGemini(systemPrompt, userPrompt) {
    const fetch = require('node-fetch');
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('Clé API Gemini non configurée (GEMINI_API_KEY manquante)');
    }

    const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    let lastError = null;

    for (const model of models) {
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      try {
        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            throw new Error("Réponse vide de la part de l'API Gemini");
          }
          return JSON.parse(text);
        }

        const errorBody = await response.text();
        lastError = new Error(`Gemini API error (${model}): ${response.status} - ${errorBody}`);

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
}

module.exports = AnalyzeLeaveRequest;

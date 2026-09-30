/**
 * Use Case — CreatePoll
 * L'admin crée un sondage et une notification est envoyée à tous les employees.
 */
const Poll = require('../entities/Poll');
const { v4: uuidv4 } = (() => {
  try { return require('uuid'); } catch { return { v4: () => Math.random().toString(36).substring(2) }; }
})();

class CreatePoll {
  constructor(pollRepository, notificationClient) {
    this.repo = pollRepository;
    this.notificationClient = notificationClient;
  }

  async execute({ title, description, options, deadline, isAnonymous }, createdBy, createdById) {
    // Construire les options avec IDs uniques
    const builtOptions = options.map((text, i) => ({
      id: `opt_${i + 1}`,
      text: String(text).trim(),
    }));

    const poll = new Poll({
      title: title?.trim(),
      description: description?.trim() || null,
      options: builtOptions,
      deadline,
      isAnonymous: Boolean(isAnonymous),
      createdBy,
      createdById,
      status: 'active',
    });

    const errors = poll.validate();
    if (errors.length > 0) {
      throw new Error(`Données invalides : ${errors.join(', ')}`);
    }

    const created = await this.repo.create(poll);

    // Notification asynchrone — ne bloque pas la réponse si le service est indisponible
    this.notificationClient
      .notifyAll({
        type: 'POLL',
        title: '📊 Nouveau sondage disponible',
        message: `"${created.title}" — Votre avis est attendu avant le ${new Date(created.deadline).toLocaleDateString('fr-FR')}`,
        pollId: created.id,
      })
      .catch(err => console.warn('[CreatePoll] Notification failed:', err.message));

    return created;
  }
}

module.exports = CreatePoll;

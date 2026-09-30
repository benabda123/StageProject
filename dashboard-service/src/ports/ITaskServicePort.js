/**
 * Output Port — ITaskServicePort
 * Contrat que l'adaptateur outbound AxiosTaskAdapter doit implémenter.
 * Le domaine dépend de cette interface, jamais de l'implémentation concrète.
 */
class ITaskServicePort {
  /**
   * Récupère toutes les tâches (vue admin, toutes tâches)
   * @param {string} authToken - Token JWT admin
   * @returns {Promise<Array>} Liste de toutes les tâches
   */
  async getAll(authToken) {
    throw new Error('Method not implemented: getAll');
  }
}

module.exports = ITaskServicePort;

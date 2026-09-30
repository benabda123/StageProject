/**
 * Output Port — ILeaveServicePort
 * Contrat que l'adaptateur outbound AxiosLeaveAdapter doit implémenter.
 * Le domaine dépend de cette interface, jamais de l'implémentation concrète.
 */
class ILeaveServicePort {
  /**
   * Récupère toutes les demandes de congé (toutes les demandes, vue admin)
   * @returns {Promise<Array>} Liste de toutes les demandes de congé
   */
  async getAll() {
    throw new Error('Method not implemented: getAll');
  }
}

module.exports = ILeaveServicePort;

/**
 * Output Port — IEmployeeServicePort
 * Contrat que l'adaptateur outbound AxiosEmployeeAdapter doit implémenter.
 * Le domaine dépend de cette interface, jamais de l'implémentation concrète.
 */
class IEmployeeServicePort {
  /**
   * Récupère la liste complète des employés
   * @returns {Promise<Array>} Liste des employés
   */
  async getAll() {
    throw new Error('Method not implemented: getAll');
  }
}

module.exports = IEmployeeServicePort;

/**
 * Output Port — IMeetingServicePort
 * Contrat que l'adaptateur outbound AxiosMeetingAdapter doit implémenter.
 * Le domaine dépend de cette interface, jamais de l'implémentation concrète.
 */
class IMeetingServicePort {
  /**
   * Récupère toutes les réunions (vue admin, tous statuts)
   * @returns {Promise<Array>} Liste de toutes les réunions
   */
  async getAll() {
    throw new Error('Method not implemented: getAll');
  }
}

module.exports = IMeetingServicePort;

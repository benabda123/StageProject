// ============================================================
// Use Case — GetMyFavorites
// Retourne tous les favoris de l'utilisateur connecté
// ============================================================

class GetMyFavorites {
  /**
   * @param {object} favoriteRepository - Instance de PostgresFavoriteRepository
   */
  constructor(favoriteRepository) {
    this.favoriteRepository = favoriteRepository;
  }

  /**
   * @param {string} employeeId - sub Keycloak (extrait du token JWT)
   * @returns {Promise<Array>} Liste des favoris de l'utilisateur
   */
  async execute(employeeId) {
    if (!employeeId) {
      throw new Error('employeeId est requis');
    }

    const favorites = await this.favoriteRepository.findByEmployeeId(employeeId);
    return favorites;
  }
}

module.exports = GetMyFavorites;

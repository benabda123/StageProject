// ============================================================
// Use Case — RemoveFavorite
// Supprime un favori — vérifie l'ownership avant suppression
// Un utilisateur ne peut supprimer que SES propres favoris
// ============================================================

class RemoveFavorite {
  /**
   * @param {object} favoriteRepository - Instance de PostgresFavoriteRepository
   */
  constructor(favoriteRepository) {
    this.favoriteRepository = favoriteRepository;
  }

  /**
   * @param {number|string} favoriteId - ID de l'entrée favorite à supprimer
   * @param {string} employeeId - sub Keycloak (extrait du token JWT — ownership check)
   * @returns {Promise<object>} Résultat de suppression
   */
  async execute(favoriteId, employeeId) {
    if (!favoriteId) {
      throw new Error('favoriteId est requis');
    }
    if (!employeeId) {
      throw new Error('employeeId est requis');
    }

    // Vérification de l'existence et de l'ownership
    const favorite = await this.favoriteRepository.findById(favoriteId);

    if (!favorite) {
      throw new Error('FAVORITE_NOT_FOUND');
    }

    // Vérification d'ownership : seul le propriétaire peut supprimer son favori
    if (favorite.employeeId !== employeeId) {
      throw new Error('FORBIDDEN');
    }

    await this.favoriteRepository.delete(favoriteId);
    return { message: 'Favori supprimé avec succès', id: favoriteId };
  }
}

module.exports = RemoveFavorite;

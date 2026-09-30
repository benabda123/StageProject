// ============================================================
// Use Case — AddFavorite
// Ajoute une vidéo aux favoris de l'utilisateur connecté
// employee_id est TOUJOURS extrait du token JWT (jamais du body)
// ============================================================

class AddFavorite {
  /**
   * @param {object} favoriteRepository - Instance de PostgresFavoriteRepository
   */
  constructor(favoriteRepository) {
    this.favoriteRepository = favoriteRepository;
  }

  /**
   * @param {string} employeeId - sub Keycloak (extrait du token, pas du body)
   * @param {object} videoData - { videoId, title, thumbnail, url }
   * @returns {Promise<object>} Entrée favorite créée
   */
  async execute(employeeId, videoData) {
    const { videoId, title, thumbnail, url } = videoData;

    if (!videoId || !title || !url) {
      throw new Error('videoId, title et url sont obligatoires');
    }

    try {
      const favorite = await this.favoriteRepository.create({
        employeeId,
        videoId,
        title,
        thumbnail: thumbnail || null,
        url,
      });
      return favorite;
    } catch (err) {
      // Gestion propre de la contrainte unique (employee_id, video_id)
      // Postgres retourne un code d'erreur 23505 pour les violations de contrainte unique
      if (err.code === '23505') {
        throw new Error('Cette vidéo est déjà dans vos favoris');
      }
      throw err;
    }
  }
}

module.exports = AddFavorite;

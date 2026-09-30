// ============================================================
// Domain Entity — FavoriteTraining
// Représente une vidéo mise en favori par un utilisateur
// ============================================================

class FavoriteTraining {
  constructor({ id, employeeId, videoId, title, thumbnail, url, createdAt }) {
    this.id = id;
    this.employeeId = employeeId; // sub Keycloak — jamais fourni par le client
    this.videoId = videoId;       // ID YouTube de la vidéo
    this.title = title;
    this.thumbnail = thumbnail;
    this.url = url;
    this.createdAt = createdAt;
  }
}

module.exports = FavoriteTraining;

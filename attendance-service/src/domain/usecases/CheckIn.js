/**
 * Use Case — CheckIn
 *
 * Logique anti-fraude complète :
 *   1. Vérifie que l'employee n'est PAS en congé approuvé aujourd'hui
 *   2. Vérifie que la position GPS est dans le rayon autorisé du bureau
 *   3. Vérifie qu'il n'a pas déjà pointé aujourd'hui
 *   4. Enregistre le pointage avec la position GPS et la distance calculée
 */
class CheckIn {
  constructor(attendanceRepository, leaveServiceClient) {
    this.repo = attendanceRepository;
    this.leaveClient = leaveServiceClient;
  }

  async execute({ employeeId, employeeUsername, lat, lng }) {
    // ── Validation des entrées ─────────────────────────────────────────────
    if (!employeeId) throw new Error('Employee ID requis');
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      throw new Error('Coordonnées GPS requises pour le pointage');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Coordonnées GPS invalides');
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Coordonnées GPS hors limites');
    }

    // ── 1. Vérifier congé approuvé aujourd'hui ────────────────────────────
    const onLeave = await this.leaveClient.isOnLeaveToday(employeeId);
    if (onLeave) {
      throw new Error(
        "Pointage refusé : vous avez un congé approuvé aujourd'hui. " +
        "Contactez l'administrateur si c'est une erreur."
      );
    }

    // ── 2. Vérifier la distance GPS avec le bureau ────────────────────────
    const officeLat = parseFloat(process.env.OFFICE_LATITUDE || '36.8065');
    const officeLng = parseFloat(process.env.OFFICE_LONGITUDE || '10.1815');
    const maxRadius = parseInt(process.env.MAX_CHECKIN_RADIUS_METERS || '200', 10);

    const distanceMeters = this._haversineDistance(latitude, longitude, officeLat, officeLng);

    if (distanceMeters > maxRadius) {
      throw new Error(
        `Pointage refusé : vous êtes à ${Math.round(distanceMeters)}m du bureau. ` +
        `La distance maximale autorisée est de ${maxRadius}m. ` +
        `Vous devez être physiquement présent au bureau pour pointer.`
      );
    }

    // ── 3. Vérifier doublon (déjà pointé aujourd'hui) ─────────────────────
    const today = this._getTodayDateString();
    const existing = await this.repo.findByEmployeeAndDate(employeeId, today);
    if (existing) {
      throw new Error(
        `Vous avez déjà pointé aujourd'hui à ${this._formatTime(existing.checkInTime)}. ` +
        `Un seul pointage par jour est autorisé.`
      );
    }

    // ── 4. Enregistrer le pointage ────────────────────────────────────────
    const record = await this.repo.create({
      employeeId,
      employeeUsername,
      checkInTime: new Date(),
      checkInLat: latitude,
      checkInLng: longitude,
      distanceMeters: Math.round(distanceMeters * 100) / 100,
      workDate: today,
      status: 'present',
    });

    return record;
  }

  /**
   * Formule de Haversine — distance en mètres entre deux points GPS
   * @private
   */
  _haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Rayon Terre en mètres
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /** @private */
  _getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }

  /** @private */
  _formatTime(date) {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}

module.exports = CheckIn;

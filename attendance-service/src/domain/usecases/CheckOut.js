/**
 * Use Case — CheckOut
 *
 * Logique :
 *   1. Vérifie qu'un check-in existe aujourd'hui pour cet employee
 *   2. Vérifie qu'il n'a pas déjà fait son check-out
 *   3. Enregistre l'heure de sortie, la position GPS, et calcule la durée
 */
class CheckOut {
  constructor(attendanceRepository) {
    this.repo = attendanceRepository;
  }

  async execute({ employeeId, lat, lng }) {
    if (!employeeId) throw new Error('Employee ID requis');

    // Coordonnées GPS optionnelles au check-out (moins critique qu'à l'entrée)
    const latitude = lat !== undefined ? parseFloat(lat) : null;
    const longitude = lng !== undefined ? parseFloat(lng) : null;

    // ── 1. Trouver le pointage d'aujourd'hui ──────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const record = await this.repo.findByEmployeeAndDate(employeeId, today);

    if (!record) {
      throw new Error(
        "Vous n'avez pas encore pointé aujourd'hui. " +
        'Effectuez d\'abord un check-in avant de pointer la sortie.'
      );
    }

    // ── 2. Vérifier que check-out pas déjà fait ───────────────────────────
    if (record.isCheckedOut()) {
      const outTime = new Date(record.checkOutTime).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit'
      });
      throw new Error(
        `Vous avez déjà pointé votre sortie aujourd'hui à ${outTime}.`
      );
    }

    // ── 3. Calculer la durée ──────────────────────────────────────────────
    const checkOutTime = new Date();
    const durationMinutes = Math.round(
      (checkOutTime - new Date(record.checkInTime)) / 60000
    );

    // ── 4. Mettre à jour le record ────────────────────────────────────────
    const updated = await this.repo.updateCheckOut(record.id, {
      checkOutTime,
      checkOutLat: latitude,
      checkOutLng: longitude,
      durationMinutes,
      status: 'checked_out',
    });

    return updated;
  }
}

module.exports = CheckOut;

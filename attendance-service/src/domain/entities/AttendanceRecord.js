/**
 * Entity — AttendanceRecord
 * Représente un enregistrement de pointage pour un employé pour une journée donnée.
 * Indépendant de tout framework — pur métier.
 */
class AttendanceRecord {
  constructor({
    id,
    employeeId,
    employeeUsername,
    checkInTime,
    checkOutTime,
    checkInLat,
    checkInLng,
    checkOutLat,
    checkOutLng,
    distanceMeters,
    workDate,
    durationMinutes,
    status,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.employeeId = employeeId;
    this.employeeUsername = employeeUsername;
    this.checkInTime = checkInTime;
    this.checkOutTime = checkOutTime || null;
    this.checkInLat = checkInLat;
    this.checkInLng = checkInLng;
    this.checkOutLat = checkOutLat || null;
    this.checkOutLng = checkOutLng || null;
    this.distanceMeters = distanceMeters;
    this.workDate = workDate;
    this.durationMinutes = durationMinutes || null;
    this.status = status || 'present';
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Calcule la durée de travail en minutes entre checkIn et checkOut
   * @returns {number|null}
   */
  computeDuration() {
    if (!this.checkInTime || !this.checkOutTime) return null;
    const diff = new Date(this.checkOutTime) - new Date(this.checkInTime);
    return Math.round(diff / 60000);
  }

  /**
   * Formate la durée en "Xh Ym"
   * @returns {string}
   */
  formattedDuration() {
    const minutes = this.durationMinutes || this.computeDuration();
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  isCheckedOut() {
    return this.status === 'checked_out';
  }
}

module.exports = AttendanceRecord;

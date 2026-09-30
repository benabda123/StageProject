/**
 * Entity — Poll
 * Représente un sondage créé par un admin.
 * options: [{ id: string, text: string }]
 */
class Poll {
  constructor({ id, title, description, options, deadline, status, isAnonymous, createdBy, createdById, createdAt, updatedAt }) {
    this.id = id;
    this.title = title;
    this.description = description || null;
    this.options = options || [];
    this.deadline = deadline;
    this.status = status || 'active';
    this.isAnonymous = isAnonymous || false;
    this.createdBy = createdBy;
    this.createdById = createdById;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isExpired() {
    return new Date() > new Date(this.deadline);
  }

  isActive() {
    return this.status === 'active' && !this.isExpired();
  }

  validate() {
    const errors = [];
    if (!this.title?.trim()) errors.push('Le titre est requis');
    if (!this.deadline) errors.push('La date limite est requise');
    if (new Date(this.deadline) <= new Date()) errors.push('La date limite doit être dans le futur');
    if (!this.options || this.options.length < 2) errors.push('Au moins 2 options sont requises');
    if (this.options.length > 8) errors.push('Maximum 8 options autorisées');
    if (this.options.some(o => !o.text?.trim())) errors.push('Toutes les options doivent avoir un texte');
    return errors;
  }
}

module.exports = Poll;

/**
 * Use Case — ClosePoll
 * Fermeture manuelle d'un sondage par l'admin.
 */
class ClosePoll {
  constructor(pollRepository) {
    this.repo = pollRepository;
  }

  async execute(pollId, requesterId) {
    const poll = await this.repo.findById(pollId);
    if (!poll) throw new Error('Sondage non trouvé');
    if (poll.status === 'closed') throw new Error('Ce sondage est déjà fermé');
    return await this.repo.updateStatus(pollId, 'closed');
  }
}

module.exports = ClosePoll;

/**
 * Use Case — SubmitVote
 * Un employee vote sur un sondage actif.
 * Vérifie : sondage existe, sondage actif, deadline non dépassée, pas de doublon.
 */
class SubmitVote {
  constructor(pollRepository) {
    this.repo = pollRepository;
  }

  async execute({ pollId, optionId }, employeeId, employeeUsername) {
    if (!pollId) throw new Error('Poll ID requis');
    if (!optionId) throw new Error('Option ID requis');

    // Récupérer le sondage
    const poll = await this.repo.findById(pollId);
    if (!poll) throw new Error('Sondage non trouvé');

    // Vérifier que le sondage est encore actif
    if (poll.status === 'closed') {
      throw new Error('Ce sondage est fermé et n\'accepte plus de votes');
    }

    // Vérifier la deadline
    if (poll.isExpired()) {
      // Fermer automatiquement le sondage expiré
      await this.repo.updateStatus(pollId, 'closed');
      throw new Error('La date limite de ce sondage est dépassée');
    }

    // Vérifier que l'option existe dans ce sondage
    const validOption = poll.options.find(o => o.id === optionId);
    if (!validOption) {
      throw new Error('Option invalide pour ce sondage');
    }

    // Vérifier doublon (un seul vote par employee par sondage)
    const existingVote = await this.repo.findVoteByEmployeeAndPoll(employeeId, pollId);
    if (existingVote) {
      throw new Error('Vous avez déjà voté pour ce sondage');
    }

    // Enregistrer le vote
    const vote = await this.repo.createVote({
      pollId,
      employeeId,
      employeeUsername,
      optionId,
    });

    return vote;
  }
}

module.exports = SubmitVote;

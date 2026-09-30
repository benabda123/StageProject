/**
 * Use Case — GetPollResults
 * Récupère les résultats d'un sondage avec les stats de votes.
 * Si le sondage a expiré, le ferme automatiquement.
 */
class GetPollResults {
  constructor(pollRepository) {
    this.repo = pollRepository;
  }

  async execute(pollId, requesterId, requesterRoles = []) {
    const poll = await this.repo.findById(pollId);
    if (!poll) throw new Error('Sondage non trouvé');

    // Auto-close si deadline dépassée
    if (poll.status === 'active' && poll.isExpired()) {
      await this.repo.updateStatus(pollId, 'closed');
      poll.status = 'closed';
    }

    const votes = await this.repo.findVotesByPollId(pollId);
    const totalVotes = votes.length;

    // Calculer les résultats par option
    const results = poll.options.map(option => {
      const count = votes.filter(v => v.optionId === option.id).length;
      return {
        optionId: option.id,
        text: option.text,
        count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    });

    // Winner = option avec le plus de votes
    const winner = results.reduce((max, cur) => cur.count > max.count ? cur : max, results[0]);

    // Liste des votants (uniquement pour admin/manager et si non anonyme)
    const isAdmin = requesterRoles.includes('admin') || requesterRoles.includes('manager');
    const voters = (!poll.isAnonymous && isAdmin)
      ? votes.map(v => ({ employeeUsername: v.employeeUsername, optionId: v.optionId, votedAt: v.votedAt }))
      : [];

    // Vérifier si le requester a déjà voté
    const myVote = votes.find(v => v.employeeId === requesterId);

    return {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        deadline: poll.deadline,
        status: poll.status,
        isAnonymous: poll.isAnonymous,
        createdBy: poll.createdBy,
        createdAt: poll.createdAt,
      },
      totalVotes,
      results,
      winner: totalVotes > 0 ? winner : null,
      voters,
      myVote: myVote ? { optionId: myVote.optionId, votedAt: myVote.votedAt } : null,
      hasVoted: !!myVote,
    };
  }
}

module.exports = GetPollResults;

/**
 * Use Case — GetActivePolls
 * Récupère les sondages actifs pour un employee avec son statut de vote.
 */
class GetActivePolls {
  constructor(pollRepository) {
    this.repo = pollRepository;
  }

  async execute(employeeId) {
    // Récupérer tous les sondages actifs (deadline non dépassée)
    const polls = await this.repo.findActive();

    // Enrichir avec le statut de vote de l'employee
    const enriched = await Promise.all(
      polls.map(async (poll) => {
        const myVote = await this.repo.findVoteByEmployeeAndPoll(employeeId, poll.id);
        const voteCount = await this.repo.countVotesByPollId(poll.id);

        return {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          options: poll.options,
          deadline: poll.deadline,
          status: poll.status,
          isAnonymous: poll.isAnonymous,
          createdBy: poll.createdBy,
          createdAt: poll.createdAt,
          hasVoted: !!myVote,
          myOptionId: myVote?.optionId || null,
          totalVotes: voteCount,
          // Temps restant en millisecondes
          timeRemaining: Math.max(0, new Date(poll.deadline) - new Date()),
        };
      })
    );

    return enriched;
  }
}

module.exports = GetActivePolls;

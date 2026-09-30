/**
 * Entity — Vote
 * Un vote soumis par un employee pour un sondage.
 */
class Vote {
  constructor({ id, pollId, employeeId, employeeUsername, optionId, votedAt }) {
    this.id = id;
    this.pollId = pollId;
    this.employeeId = employeeId;
    this.employeeUsername = employeeUsername;
    this.optionId = optionId;
    this.votedAt = votedAt;
  }
}

module.exports = Vote;

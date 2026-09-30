class RejectLeave {
  constructor(leaveRepository) {
    this.leaveRepository = leaveRepository;
  }

  execute(leaveId) {
    return this.leaveRepository.updateStatus(leaveId, 'refuse');
  }
}

module.exports = RejectLeave;

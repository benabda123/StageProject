class ApproveLeave {
  constructor(leaveRepository) {
    this.leaveRepository = leaveRepository;
  }

  execute(leaveId) {
    return this.leaveRepository.updateStatus(leaveId, 'accepte');
  }
}

module.exports = ApproveLeave;

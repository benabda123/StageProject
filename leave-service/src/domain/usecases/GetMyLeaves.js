class GetMyLeaves {
  constructor(leaveRepository) {
    this.leaveRepository = leaveRepository;
  }

  execute(employeeId) {
    return this.leaveRepository.findByEmployeeId(employeeId);
  }
}

module.exports = GetMyLeaves;

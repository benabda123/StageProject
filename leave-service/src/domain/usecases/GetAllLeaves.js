class GetAllLeaves {
  constructor(leaveRepository) {
    this.leaveRepository = leaveRepository;
  }

  execute(filters = {}) {
    return this.leaveRepository.findAll(filters);
  }
}

module.exports = GetAllLeaves;

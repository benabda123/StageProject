const Leave = require('../entities/Leave');

class CreateLeaveRequest {
  constructor(leaveRepository) {
    this.leaveRepository = leaveRepository;
  }

  execute(leaveData) {
    const leave = new Leave({
      ...leaveData,
      status: 'en_attente'
    });

    const errors = leave.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return this.leaveRepository.create(leave);
  }
}

module.exports = CreateLeaveRequest;

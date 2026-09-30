class GetMyTasks {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(employeeId) {
    return await this.taskRepository.findByEmployeeId(employeeId);
  }
}

module.exports = GetMyTasks;

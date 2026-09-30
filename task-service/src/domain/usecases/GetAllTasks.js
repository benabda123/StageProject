class GetAllTasks {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(filters = {}) {
    return await this.taskRepository.findAll(filters);
  }
}

module.exports = GetAllTasks;

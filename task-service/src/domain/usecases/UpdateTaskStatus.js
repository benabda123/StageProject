class UpdateTaskStatus {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(id, status, requestingEmployeeId) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    // Security check: employee can only update their own tasks
    if (task.employeeId !== requestingEmployeeId) {
      throw new Error('Forbidden: You can only update your own tasks');
    }

    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    task.status = status;
    task.updatedAt = new Date();

    return await this.taskRepository.update(id, task);
  }
}

module.exports = UpdateTaskStatus;

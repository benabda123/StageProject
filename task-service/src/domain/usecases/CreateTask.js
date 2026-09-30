const Task = require('../entities/Task');

class CreateTask {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(taskData) {
    const task = new Task({
      title: taskData.title,
      description: taskData.description,
      employeeId: taskData.employeeId,
      employeeUsername: taskData.employeeUsername,
      createdBy: taskData.createdBy,
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate
    });

    const validation = task.isValid();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    return await this.taskRepository.create(task);
  }
}

module.exports = CreateTask;

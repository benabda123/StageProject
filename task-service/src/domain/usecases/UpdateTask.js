const Task = require('../entities/Task');

class UpdateTask {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(id, taskData) {
    const existingTask = await this.taskRepository.findById(id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    const updatedTask = new Task({
      id: existingTask.id,
      title: taskData.title !== undefined ? taskData.title : existingTask.title,
      description: taskData.description !== undefined ? taskData.description : existingTask.description,
      employeeId: taskData.employeeId !== undefined ? taskData.employeeId : existingTask.employeeId,
      employeeUsername: taskData.employeeUsername !== undefined ? taskData.employeeUsername : existingTask.employeeUsername,
      createdBy: existingTask.createdBy,
      status: taskData.status !== undefined ? taskData.status : existingTask.status,
      priority: taskData.priority !== undefined ? taskData.priority : existingTask.priority,
      dueDate: taskData.dueDate !== undefined ? taskData.dueDate : existingTask.dueDate,
      createdAt: existingTask.createdAt,
      updatedAt: new Date()
    });

    const validation = updatedTask.isValid();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    return await this.taskRepository.update(id, updatedTask);
  }
}

module.exports = UpdateTask;

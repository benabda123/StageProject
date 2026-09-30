class DeleteTask {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(id) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    await this.taskRepository.delete(id);
    return { message: 'Task deleted successfully' };
  }
}

module.exports = DeleteTask;

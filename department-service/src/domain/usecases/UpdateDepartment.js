class UpdateDepartment {
  constructor(departmentRepository) {
    this.departmentRepository = departmentRepository;
  }

  async execute(id, data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Department name must be at least 2 characters long.');
    }
    return await this.departmentRepository.update(id, data);
  }
}

module.exports = UpdateDepartment;
class CreateDepartment {
  constructor(departmentRepository) {
    this.departmentRepository = departmentRepository;
  }

  async execute(data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Department name must be at least 2 characters long.');
    }
    return await this.departmentRepository.create(data);
  }
}

module.exports = CreateDepartment;
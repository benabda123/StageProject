class GetDepartmentById {
  constructor(departmentRepository) {
    this.departmentRepository = departmentRepository;
  }

  async execute(id) {
    return await this.departmentRepository.getById(id);
  }
}

module.exports = GetDepartmentById;
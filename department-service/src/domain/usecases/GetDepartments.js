class GetDepartments {
  constructor(departmentRepository) {
    this.departmentRepository = departmentRepository;
  }

  async execute() {
    return await this.departmentRepository.getAll();
  }
}

module.exports = GetDepartments;
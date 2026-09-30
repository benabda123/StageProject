class DeleteDepartment {
  constructor(departmentRepository) {
    this.departmentRepository = departmentRepository;
  }

  async execute(id) {
    return await this.departmentRepository.delete(id);
  }
}

module.exports = DeleteDepartment;
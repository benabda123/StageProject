class GetEmployeeById {
  constructor(repository) { this.repository = repository; }
  async execute(id) { return await this.repository.findById(id); }
}
module.exports = GetEmployeeById;
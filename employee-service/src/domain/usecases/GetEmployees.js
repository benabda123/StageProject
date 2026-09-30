class GetEmployees {
  constructor(repository) { this.repository = repository; }
  async execute() { return await this.repository.findAll(); }
}
module.exports = GetEmployees;
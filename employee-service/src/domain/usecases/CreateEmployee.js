class CreateEmployee {
  constructor(repository) { this.repository = repository; }
  async execute(data) { return await this.repository.save(data); }
}
module.exports = CreateEmployee;
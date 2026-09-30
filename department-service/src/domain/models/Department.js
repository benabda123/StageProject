class Department {
  constructor({ id, name, description, created_at }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = created_at;
  }
}

module.exports = Department;
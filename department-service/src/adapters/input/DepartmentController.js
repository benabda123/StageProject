const PostgresDepartmentRepository = require('../output/PostgresDepartmentRepository');
const GetDepartments = require('../../domain/usecases/GetDepartments');
const GetDepartmentById = require('../../domain/usecases/GetDepartmentById');
const CreateDepartment = require('../../domain/usecases/CreateDepartment');
const UpdateDepartment = require('../../domain/usecases/UpdateDepartment');
const DeleteDepartment = require('../../domain/usecases/DeleteDepartment');

const repository = new PostgresDepartmentRepository();

class DepartmentController {
  static async getAll(req, res) {
    try {
      const useCase = new GetDepartments(repository);
      const departments = await useCase.execute();
      res.json(departments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const useCase = new GetDepartmentById(repository);
      const department = await useCase.execute(req.params.id);
      if (!department) return res.status(404).json({ error: 'Department not found' });
      res.json(department);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const useCase = new CreateDepartment(repository);
      const department = await useCase.execute(req.body);
      res.status(201).json(department);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const useCase = new UpdateDepartment(repository);
      const department = await useCase.execute(req.params.id, req.body);
      if (!department) return res.status(404).json({ error: 'Department not found' });
      res.json(department);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const useCase = new DeleteDepartment(repository);
      const success = await useCase.execute(req.params.id);
      if (!success) return res.status(404).json({ error: 'Department not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = DepartmentController;
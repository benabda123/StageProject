const express = require('express');
const router = express.Router();
const requireRole = require('../../middleware/requireRole');

const PostgresEmployeeRepository = require('../output/PostgresEmployeeRepository');
const CreateEmployee = require('../../domain/usecases/CreateEmployee');
const GetEmployees = require('../../domain/usecases/GetEmployees');
const GetEmployeeById = require('../../domain/usecases/GetEmployeeById');
const UpdateEmployee = require('../../domain/usecases/UpdateEmployee');
const DeleteEmployee = require('../../domain/usecases/DeleteEmployee');

// Initialisation de la couche d'accès aux données et des cas d'utilisation
const repo = new PostgresEmployeeRepository();
const createEmployeeUC = new CreateEmployee(repo);
const getEmployeesUC = new GetEmployees(repo);
const getEmployeeByIdUC = new GetEmployeeById(repo);
const updateEmployeeUC = new UpdateEmployee(repo);
const deleteEmployeeUC = new DeleteEmployee(repo);

// Healthcheck
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Employee Service' });
});

// GET tous les employés - Accessible à tous les utilisateurs authentifiés
const getAll = async (req, res) => {
  try {
    const list = await getEmployeesUC.execute();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/', getAll);
router.get('/employees', getAll);

// GET un employé par ID - Accessible à tous les utilisateurs authentifiés
const getById = async (req, res) => {
  try {
    const emp = await getEmployeeByIdUC.execute(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/:id', getById);
router.get('/employees/:id', getById);

// POST créer un employé - Accessible uniquement aux admin et manager
const create = async (req, res) => {
  try {
    const created = await createEmployeeUC.execute(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.post('/', requireRole('admin', 'hr'), create);
router.post('/employees', requireRole('admin', 'hr'), create);

// PUT modifier un employé - Accessible uniquement aux admin et manager
const update = async (req, res) => {
  try {
    const updated = await updateEmployeeUC.execute(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Employee not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.put('/:id', requireRole('admin', 'hr'), update);
router.put('/employees/:id', requireRole('admin', 'hr'), update);

// DELETE supprimer un employé - Accessible uniquement aux admin
const remove = async (req, res) => {
  try {
    const deleted = await deleteEmployeeUC.execute(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.delete('/:id', requireRole('admin', 'hr'), remove);
router.delete('/employees/:id', requireRole('admin', 'hr'), remove);

module.exports = router;
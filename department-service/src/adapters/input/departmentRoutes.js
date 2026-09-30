const express = require('express');
const router = express.Router();
const departmentController = require('./DepartmentController');
const requireRole = require('../../middleware/requireRole');

// Accessible à tous les utilisateurs authentifiés
router.get('/', departmentController.getAll);
router.get('/:id', departmentController.getById);

// Accessible uniquement aux admin
router.post('/', requireRole('admin'), departmentController.create);
router.put('/:id', requireRole('admin'), departmentController.update);

// Accessible uniquement aux admin
router.delete('/:id', requireRole('admin'), departmentController.delete);

module.exports = router;
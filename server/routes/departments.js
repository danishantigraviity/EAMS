const express = require('express');
const router = express.Router();
const deptController = require('../controllers/departmentController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);
router.get('/', deptController.getDepartments);
router.get('/:id', deptController.getDepartment);
router.get('/:id/assets', deptController.getDepartmentAssets);
router.post('/', requireRole('super_admin', 'hr_team'), deptController.createDepartment);
router.put('/:id', requireRole('super_admin', 'hr_team'), deptController.updateDepartment);
router.delete('/:id', requireRole('super_admin'), deptController.deleteDepartment);
module.exports = router;

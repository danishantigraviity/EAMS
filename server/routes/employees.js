const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, requireRole } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');

router.use(protect);
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployee);
router.get('/:id/assets', employeeController.getEmployeeAssets);
router.post('/', requireRole('super_admin', 'hr_team'), uploadProfileImage.single('profileImage'), employeeController.createEmployee);
router.put('/:id', requireRole('super_admin', 'hr_team'), uploadProfileImage.single('profileImage'), employeeController.updateEmployee);
router.delete('/:id', requireRole('super_admin', 'hr_team'), employeeController.deleteEmployee);
module.exports = router;

const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);
router.get('/expiring', licenseController.getExpiringLicenses);
router.get('/', licenseController.getLicenses);
router.get('/:id', licenseController.getLicense);
router.post('/', requireRole('super_admin', 'it_team'), licenseController.createLicense);
router.put('/:id', requireRole('super_admin', 'it_team'), licenseController.updateLicense);
router.delete('/:id', requireRole('super_admin'), licenseController.deleteLicense);
router.post('/:id/assign', requireRole('super_admin', 'it_team', 'hr_team'), licenseController.assignSeat);
router.post('/:id/unassign', requireRole('super_admin', 'it_team', 'hr_team'), licenseController.unassignSeat);
module.exports = router;

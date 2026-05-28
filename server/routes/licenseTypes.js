const express = require('express');
const router = express.Router();
const licenseTypeController = require('../controllers/licenseTypeController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.get('/', licenseTypeController.getLicenseTypes);
router.post('/', requireRole('super_admin', 'it_team'), licenseTypeController.createLicenseType);
router.put('/:id', requireRole('super_admin', 'it_team'), licenseTypeController.updateLicenseType);
router.delete('/:id', requireRole('super_admin', 'it_team'), licenseTypeController.deleteLicenseType);

module.exports = router;

// assets routes
const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect, requireRole } = require('../middleware/auth');
const { uploadAssetImage } = require('../middleware/upload');

router.use(protect);

router.get('/expiring-warranty', requireRole('super_admin', 'it_team', 'hr_team'), assetController.getExpiringWarranty);
router.get('/', assetController.getAssets);
router.get('/:id', assetController.getAsset);
router.get('/:id/history', assetController.getAssetHistory);
router.post('/', requireRole('super_admin', 'it_team'), uploadAssetImage.single('image'), assetController.createAsset);
router.put('/:id', requireRole('super_admin', 'it_team'), uploadAssetImage.single('image'), assetController.updateAsset);
router.delete('/:id', requireRole('super_admin'), assetController.deleteAsset);
router.post('/:id/assign', requireRole('super_admin', 'it_team', 'hr_team'), assetController.assignAsset);
router.post('/:id/unassign', requireRole('super_admin', 'it_team', 'hr_team'), assetController.unassignAsset);

module.exports = router;

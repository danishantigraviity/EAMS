const express = require('express');
const router = express.Router();
const assetTypeController = require('../controllers/assetTypeController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.get('/', assetTypeController.getAssetTypes);
router.post('/', requireRole('super_admin', 'it_team'), assetTypeController.createAssetType);
router.put('/:id', requireRole('super_admin', 'it_team'), assetTypeController.updateAssetType);
router.delete('/:id', requireRole('super_admin', 'it_team'), assetTypeController.deleteAssetType);

module.exports = router;

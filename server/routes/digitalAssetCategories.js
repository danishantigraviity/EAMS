const express = require('express');
const router = express.Router();
const digitalAssetCategoryController = require('../controllers/digitalAssetCategoryController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.get('/', digitalAssetCategoryController.getDigitalAssetCategories);
router.post('/', requireRole('super_admin', 'it_team'), digitalAssetCategoryController.createDigitalAssetCategory);
router.put('/:id', requireRole('super_admin', 'it_team'), digitalAssetCategoryController.updateDigitalAssetCategory);
router.delete('/:id', requireRole('super_admin', 'it_team'), digitalAssetCategoryController.deleteDigitalAssetCategory);

module.exports = router;

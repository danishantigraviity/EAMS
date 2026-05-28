const express = require('express');

// Digital Assets Router
const digitalRouter = express.Router();
const digitalController = require('../controllers/digitalAssetController');
const { protect, requireRole } = require('../middleware/auth');
const { uploadDigitalAsset } = require('../middleware/upload');

digitalRouter.use(protect);
digitalRouter.get('/', digitalController.getDigitalAssets);
digitalRouter.post('/', uploadDigitalAsset.single('file'), digitalController.uploadDigitalAsset);
digitalRouter.put('/:id', digitalController.updateDigitalAsset);
digitalRouter.delete('/:id', requireRole('super_admin', 'it_team'), digitalController.deleteDigitalAsset);
digitalRouter.get('/:id/download', digitalController.getDownloadUrl);
digitalRouter.get('/:id/preview-file', digitalController.getExtractedFileContent);

module.exports = digitalRouter;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/maintenanceController');
const { protect, requireRole } = require('../middleware/auth');
const { uploadAssetImage } = require('../middleware/upload');

router.use(protect);
router.get('/', ctrl.getRequests);
router.post('/', uploadAssetImage.single('image'), ctrl.createRequest);
router.put('/:id', requireRole('super_admin', 'it_team'), ctrl.updateRequest);
router.delete('/:id', requireRole('super_admin'), ctrl.deleteRequest);
module.exports = router;

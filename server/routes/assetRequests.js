const express = require('express');
const router = express.Router();
const assetRequestController = require('../controllers/assetRequestController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', assetRequestController.createRequest);
router.get('/', assetRequestController.getRequests);
router.put('/:id', assetRequestController.updateRequest);

module.exports = router;

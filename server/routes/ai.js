const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { uploadOCRImage } = require('../middleware/upload');

router.use(protect);
router.post('/chat', aiController.chat);
router.post('/ocr', uploadOCRImage.single('image'), aiController.ocrScan);
module.exports = router;

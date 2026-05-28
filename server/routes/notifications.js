const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/user/:userId', ctrl.getUserNotifications);
router.get('/me', (req, res, next) => { req.params.userId = req.user._id; next(); }, ctrl.getUserNotifications);
router.post('/', ctrl.createNotification);
router.put('/:id/read', ctrl.markAsRead);
router.put('/read-all/:userId', ctrl.markAllAsRead);
router.delete('/:id', ctrl.deleteNotification);
module.exports = router;

const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);
router.get('/stats', requireRole('super_admin', 'it_team', 'hr_team'), getDashboardStats);
module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const Asset = require('../models/Asset');
const License = require('../models/License');
const MaintenanceRequest = require('../models/MaintenanceRequest');

router.use(protect, requireRole('super_admin', 'it_team', 'hr_team'));

router.get('/assets', async (req, res, next) => {
  try {
    const [byType, byStatus, byDepartment] = await Promise.all([
      Asset.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
      Asset.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Asset.aggregate([
        { $match: { isDeleted: false, department: { $ne: null } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: '$dept' },
        { $project: { name: '$dept.name', count: 1 } },
      ]),
    ]);
    res.json({ success: true, data: { byType, byStatus, byDepartment } });
  } catch (error) { next(error); }
});

router.get('/maintenance', async (req, res, next) => {
  try {
    const [byStatus, byPriority, avgResolution] = await Promise.all([
      MaintenanceRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      MaintenanceRequest.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      MaintenanceRequest.aggregate([
        { $match: { resolvedAt: { $ne: null } } },
        { $addFields: { resolutionHours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] } } },
        { $group: { _id: null, avgHours: { $avg: '$resolutionHours' } } },
      ]),
    ]);
    res.json({ success: true, data: { byStatus, byPriority, avgResolutionHours: avgResolution[0]?.avgHours || 0 } });
  } catch (error) { next(error); }
});

router.get('/licenses', async (req, res, next) => {
  try {
    const [byVendor, expiryTimeline] = await Promise.all([
      License.aggregate([{ $group: { _id: '$vendor', totalCost: { $sum: '$cost' }, count: { $sum: 1 } } }]),
      License.find().select('softwareName expiryDate cost vendor').sort({ expiryDate: 1 }),
    ]);
    res.json({ success: true, data: { byVendor, expiryTimeline } });
  } catch (error) { next(error); }
});

module.exports = router;

const Asset = require('../models/Asset');
const User = require('../models/User');
const License = require('../models/License');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const ActivityLog = require('../models/ActivityLog');
const AssetHistory = require('../models/AssetHistory');

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalEmployees,
      activeEmployees,
      totalAssets,
      assetsByStatus,
      assetsByType,
      assetsByDepartment,
      openMaintenance,
      expiringLicenses,
      expiringWarranties,
      recentActivity,
      monthlyAssetGrowth,
    ] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'employee', isActive: true }),
      Asset.countDocuments({ isDeleted: false }),

      // Assets by status
      Asset.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Assets by type
      Asset.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),

      // Assets by department
      Asset.aggregate([
        { $match: { isDeleted: false, department: { $ne: null } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'dept',
          },
        },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, count: 1, name: '$dept.name', code: '$dept.code' } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      MaintenanceRequest.countDocuments({ status: { $in: ['open', 'in-progress'] } }),

      License.countDocuments({
        expiryDate: { $lte: thirtyDaysFromNow, $gte: now },
      }),

      Asset.countDocuments({
        warrantyExpiry: { $lte: thirtyDaysFromNow, $gte: now },
        isDeleted: false,
      }),

      ActivityLog.find()
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(10),

      // Monthly asset growth (last 6 months)
      Asset.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, isDeleted: false } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Build status map
    const statusMap = {};
    assetsByStatus.forEach((s) => { statusMap[s._id] = s.count; });

    // Build type map
    const typeMap = {};
    assetsByType.forEach((t) => { typeMap[t._id] = t.count; });

    // Maintenance by priority
    const maintenanceByPriority = await MaintenanceRequest.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    const priorityMap = {};
    maintenanceByPriority.forEach((p) => { priorityMap[p._id] = p.count; });

    res.json({
      success: true,
      data: {
        overview: {
          totalEmployees,
          activeEmployees,
          totalAssets,
          assignedAssets: statusMap['assigned'] || 0,
          availableAssets: statusMap['available'] || 0,
          damagedAssets: statusMap['damaged'] || 0,
          maintenanceAssets: statusMap['maintenance'] || 0,
          retiredAssets: statusMap['retired'] || 0,
          openMaintenanceRequests: openMaintenance,
          expiringLicenses,
          expiringWarranties,
        },
        assetsByStatus: statusMap,
        assetsByType: typeMap,
        assetsByDepartment,
        maintenanceByPriority: priorityMap,
        monthlyAssetGrowth,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

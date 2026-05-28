const Asset = require('../models/Asset');
const User = require('../models/User');
const License = require('../models/License');

// GET /api/search?q=
exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters.' });
    }

    const searchRegex = { $regex: q, $options: 'i' };

    const [assets, employees, licenses] = await Promise.all([
      Asset.find({
        isDeleted: false,
        $or: [{ name: searchRegex }, { serialNumber: searchRegex }, { vendor: searchRegex }, { type: searchRegex }],
      })
        .select('name type serialNumber status imageUrl vendor')
        .limit(5),

      User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { employeeId: searchRegex }],
      })
        .select('name email role profileImage employeeId')
        .limit(5),

      License.find({
        $or: [{ softwareName: searchRegex }, { vendor: searchRegex }],
      })
        .select('softwareName vendor expiryDate totalSeats usedSeats')
        .limit(5),
    ]);

    res.json({
      success: true,
      data: {
        assets,
        employees,
        licenses,
        total: assets.length + employees.length + licenses.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

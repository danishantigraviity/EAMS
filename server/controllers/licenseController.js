const License = require('../models/License');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { broadcast } = require('../utils/websocket');

// GET /api/licenses
exports.getLicenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const filter = {};
    if (search) filter.$text = { $search: search };

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (status === 'active') filter.expiryDate = { $gt: thirtyDaysFromNow };
    else if (status === 'expiring') filter.expiryDate = { $lte: thirtyDaysFromNow, $gte: now };
    else if (status === 'expired') filter.expiryDate = { $lt: now };

    const skip = (Number(page) - 1) * Number(limit);
    const [licenses, total] = await Promise.all([
      License.find(filter)
        .populate('assignedTo', 'name email profileImage')
        .populate('department', 'name code')
        .populate('createdBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      License.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: licenses,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/licenses/:id
exports.getLicense = async (req, res, next) => {
  try {
    const license = await License.findById(req.params.id)
      .populate('assignedTo', 'name email profileImage department')
      .populate('department', 'name code')
      .populate('createdBy', 'name');

    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    res.json({ success: true, data: license });
  } catch (error) {
    next(error);
  }
};

// POST /api/licenses
exports.createLicense = async (req, res, next) => {
  try {
    const license = await License.create({ ...req.body, createdBy: req.user._id, usedSeats: 0 });
    broadcast('licenses_update', { action: 'create', licenseId: license._id });
    res.status(201).json({ success: true, data: license, message: 'License created successfully.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/licenses/:id
exports.updateLicense = async (req, res, next) => {
  try {
    const license = await License.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name email');

    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    broadcast('licenses_update', { action: 'update', licenseId: license._id });
    res.json({ success: true, data: license, message: 'License updated.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/licenses/:id
exports.deleteLicense = async (req, res, next) => {
  try {
    const license = await License.findByIdAndDelete(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    broadcast('licenses_update', { action: 'delete', licenseId: req.params.id });
    res.json({ success: true, message: 'License deleted.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/licenses/:id/assign
exports.assignSeat = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const license = await License.findById(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });

    if (license.usedSeats >= license.totalSeats) {
      return res.status(400).json({ success: false, message: 'No available seats.' });
    }
    if (license.assignedTo.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already has this license.' });
    }
    if (license.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'License is expired.' });
    }

    license.assignedTo.push(userId);
    license.usedSeats += 1;
    await license.save();

    await Notification.create({
      userId,
      type: 'asset_assigned',
      title: 'Software License Assigned',
      message: `${license.softwareName} license has been assigned to you.`,
      resourceId: license._id,
      resourceType: 'License',
    });

    const populated = await License.findById(license._id).populate('assignedTo', 'name email profileImage');
    broadcast('licenses_update', { action: 'assign', licenseId: license._id, userId });
    res.json({ success: true, data: populated, message: 'Seat assigned.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/licenses/:id/unassign
exports.unassignSeat = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const license = await License.findById(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });

    if (!license.assignedTo.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User does not have this license.' });
    }

    license.assignedTo = license.assignedTo.filter((id) => id.toString() !== userId);
    license.usedSeats = Math.max(0, license.usedSeats - 1);
    await license.save();

    const populated = await License.findById(license._id).populate('assignedTo', 'name email profileImage');
    broadcast('licenses_update', { action: 'unassign', licenseId: license._id, userId });
    res.json({ success: true, data: populated, message: 'Seat unassigned.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/licenses/expiring
exports.getExpiringLicenses = async (req, res, next) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const licenses = await License.find({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
    })
      .populate('assignedTo', 'name email')
      .sort({ expiryDate: 1 });

    res.json({ success: true, data: licenses, total: licenses.length });
  } catch (error) {
    next(error);
  }
};

const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');
const User = require('../models/User');
const Notification = require('../models/Notification');
const qrcode = require('qrcode');
const { cloudinary } = require('../middleware/upload');
const { sendEmail } = require('../utils/email');
const { sendAssetAssignedEmail } = require('../utils/email');
const { broadcast } = require('../utils/websocket');

// GET /api/assets
exports.getAssets = async (req, res, next) => {
  try {
    const { type, status, department, assignedTo, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = { isDeleted: false };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [assets, total] = await Promise.all([
      Asset.find(filter)
        .populate('assignedTo', 'name email profileImage employeeId')
        .populate('department', 'name code')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Asset.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: assets,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/assets/:id
exports.getAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo', 'name email profileImage employeeId department')
      .populate('department', 'name code')
      .populate('createdBy', 'name email');

    if (!asset || asset.isDeleted) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    res.json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};

// POST /api/assets
exports.createAsset = async (req, res, next) => {
  try {
    const assetData = {
      ...req.body,
      createdBy: req.user._id,
    };

    if (req.file) {
      assetData.imageUrl = req.file.path;
      assetData.imagePublicId = req.file.filename;
    }

    const asset = await Asset.create(assetData);

    // Generate QR code string
    const qrData = `EAMS-${asset._id}-${asset.serialNumber}`;
    const qrCodeDataUrl = await qrcode.toDataURL(qrData);
    asset.qrCode = qrData;
    await asset.save();

    // Log creation
    await AssetHistory.create({
      assetId: asset._id,
      action: 'created',
      performedBy: req.user._id,
      notes: 'Asset created',
      newStatus: asset.status,
    });

    broadcast('assets_update', { action: 'create', assetId: asset._id });

    res.status(201).json({ success: true, data: asset, message: 'Asset created successfully.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/assets/:id
exports.updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset || asset.isDeleted) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const previousStatus = asset.status;
    const updates = { ...req.body };
    if (req.file) {
      // Delete old image from Cloudinary
      if (asset.imagePublicId) {
        await cloudinary.uploader.destroy(asset.imagePublicId).catch(() => {});
      }
      updates.imageUrl = req.file.path;
      updates.imagePublicId = req.file.filename;
    }

    Object.assign(asset, updates);
    await asset.save();

    await AssetHistory.create({
      assetId: asset._id,
      action: 'updated',
      performedBy: req.user._id,
      notes: `Asset updated`,
      previousStatus,
      newStatus: asset.status,
    });

    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'name email')
      .populate('department', 'name code');

    broadcast('assets_update', { action: 'update', assetId: asset._id });

    res.json({ success: true, data: populated, message: 'Asset updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/assets/:id (soft delete)
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset || asset.isDeleted) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    asset.isDeleted = true;
    asset.status = 'retired';
    await asset.save();

    await AssetHistory.create({
      assetId: asset._id,
      action: 'retired',
      performedBy: req.user._id,
      notes: 'Asset retired (soft deleted)',
      previousStatus: asset.status,
      newStatus: 'retired',
    });

    broadcast('assets_update', { action: 'delete', assetId: asset._id });

    res.json({ success: true, message: 'Asset retired successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/assets/:id/assign
exports.assignAsset = async (req, res, next) => {
  try {
    const { employeeId, notes } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset || asset.isDeleted) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }
    if (asset.status !== 'available') {
      return res.status(400).json({ success: false, message: `Asset is not available (current status: ${asset.status}).` });
    }

    const employee = await User.findById(employeeId).populate('department', 'name');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const previousAssignedTo = asset.assignedTo;
    asset.assignedTo = employeeId;
    asset.status = 'assigned';
    await asset.save();

    await AssetHistory.create({
      assetId: asset._id,
      action: 'assigned',
      performedBy: req.user._id,
      toEmployee: employeeId,
      fromEmployee: previousAssignedTo,
      notes: notes || `Assigned to ${employee.name}`,
      previousStatus: 'available',
      newStatus: 'assigned',
    });

    // Create notification
    await Notification.create({
      userId: employeeId,
      type: 'asset_assigned',
      title: 'Asset Assigned to You',
      message: `${asset.name} (${asset.serialNumber}) has been assigned to you.`,
      resourceId: asset._id,
      resourceType: 'Asset',
    });

    // Send email
    await sendAssetAssignedEmail(employee, asset).catch(console.error);

    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'name email profileImage')
      .populate('department', 'name code');

    broadcast('assets_update', { action: 'assign', assetId: asset._id, employeeId });

    res.json({ success: true, data: populated, message: `Asset assigned to ${employee.name}.` });
  } catch (error) {
    next(error);
  }
};

// POST /api/assets/:id/unassign
exports.unassignAsset = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const asset = await Asset.findById(req.params.id).populate('assignedTo', 'name email');

    if (!asset || asset.isDeleted) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }
    if (asset.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Asset is not currently assigned.' });
    }

    const previousEmployee = asset.assignedTo;

    await AssetHistory.create({
      assetId: asset._id,
      action: 'returned',
      performedBy: req.user._id,
      fromEmployee: previousEmployee ? previousEmployee._id : null,
      notes: notes || `Returned by ${previousEmployee ? previousEmployee.name : 'unknown'}`,
      previousStatus: 'assigned',
      newStatus: 'available',
    });

    asset.assignedTo = null;
    asset.status = 'available';
    await asset.save();

    if (previousEmployee) {
      await Notification.create({
        userId: previousEmployee._id,
        type: 'asset_return',
        title: 'Asset Returned',
        message: `${asset.name} (${asset.serialNumber}) has been unassigned from you.`,
        resourceId: asset._id,
        resourceType: 'Asset',
      });
    }

    broadcast('assets_update', { action: 'unassign', assetId: asset._id, employeeId: previousEmployee ? previousEmployee._id : null });

    res.json({ success: true, data: asset, message: 'Asset unassigned successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/assets/:id/history
exports.getAssetHistory = async (req, res, next) => {
  try {
    const history = await AssetHistory.find({ assetId: req.params.id })
      .populate('performedBy', 'name email')
      .populate('toEmployee', 'name email')
      .populate('fromEmployee', 'name email')
      .sort({ timestamp: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// GET /api/assets/expiring-warranty
exports.getExpiringWarranty = async (req, res, next) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const assets = await Asset.find({
      warrantyExpiry: { $lte: thirtyDaysFromNow, $gte: new Date() },
      isDeleted: false,
    })
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .sort({ warrantyExpiry: 1 });

    res.json({ success: true, data: assets, total: assets.length });
  } catch (error) {
    next(error);
  }
};

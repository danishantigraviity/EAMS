const MaintenanceRequest = require('../models/MaintenanceRequest');
const Asset = require('../models/Asset');
const Notification = require('../models/Notification');
const AssetHistory = require('../models/AssetHistory');
const { sendMaintenanceUpdateEmail } = require('../utils/email');
const { broadcast } = require('../utils/websocket');

exports.getRequests = async (req, res, next) => {
  try {
    const { status, priority, assetId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assetId) filter.assetId = assetId;
    if (req.user.role === 'employee') filter.reportedBy = req.user._id;

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(filter)
        .populate('assetId', 'name type serialNumber imageUrl')
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MaintenanceRequest.countDocuments(filter),
    ]);

    res.json({
      success: true, data: requests, total,
      page: Number(page), limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) { next(error); }
};

exports.createRequest = async (req, res, next) => {
  try {
    const { assetId, issue, priority } = req.body;
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

    const previousStatus = asset.status;
    const request = await MaintenanceRequest.create({
      assetId,
      reportedBy: req.user._id,
      issue,
      priority: priority || 'medium',
      imageUrl: req.file ? req.file.path : null,
    });

    asset.status = 'maintenance';
    await asset.save();

    await AssetHistory.create({
      assetId: asset._id,
      action: 'maintenance_started',
      performedBy: req.user._id,
      notes: `Maintenance requested: ${issue}`,
      previousStatus,
      newStatus: 'maintenance',
    });

    const populated = await MaintenanceRequest.findById(request._id)
      .populate('assetId', 'name type serialNumber')
      .populate('reportedBy', 'name email');

    broadcast('maintenance_update', { action: 'create', requestId: request._id });
    broadcast('assets_update', { action: 'update', assetId });

    res.status(201).json({ success: true, data: populated, message: 'Maintenance request created.' });
  } catch (error) { next(error); }
};

exports.updateRequest = async (req, res, next) => {
  try {
    const { status, assignedTo, notes, estimatedResolutionDate } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id).populate('reportedBy', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    const previousStatus = request.status;
    if (status) request.status = status;
    if (assignedTo) request.assignedTo = assignedTo;
    if (notes) request.notes = notes;
    if (estimatedResolutionDate) request.estimatedResolutionDate = estimatedResolutionDate;

    if (status === 'resolved' && previousStatus !== 'resolved') {
      request.resolvedAt = new Date();
      const asset = await Asset.findById(request.assetId);
      if (asset) {
        asset.status = asset.assignedTo ? 'assigned' : 'available';
        await asset.save();
        await AssetHistory.create({
          assetId: asset._id,
          action: 'maintenance_completed',
          performedBy: req.user._id,
          notes: `Maintenance resolved: ${notes || 'No notes'}`,
          previousStatus: 'maintenance',
          newStatus: asset.status,
        });
      }
    }

    await request.save();

    if (request.reportedBy) {
      await Notification.create({
        userId: request.reportedBy._id,
        type: 'maintenance_update',
        title: 'Maintenance Request Updated',
        message: `Your maintenance request status changed to: ${request.status}`,
        resourceId: request._id,
        resourceType: 'MaintenanceRequest',
      });
      await sendMaintenanceUpdateEmail(request.reportedBy, request).catch(console.error);
    }

    const populated = await MaintenanceRequest.findById(request._id)
      .populate('assetId', 'name type serialNumber')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email');

    broadcast('maintenance_update', { action: 'update', requestId: request._id, status });
    broadcast('assets_update', { action: 'update', assetId: request.assetId });

    res.json({ success: true, data: populated, message: 'Request updated.' });
  } catch (error) { next(error); }
};

exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    broadcast('maintenance_update', { action: 'delete', requestId: req.params.id });

    res.json({ success: true, message: 'Request cancelled.' });
  } catch (error) { next(error); }
};

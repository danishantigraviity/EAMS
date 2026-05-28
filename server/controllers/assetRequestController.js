const AssetRequest = require('../models/AssetRequest');
const AssetType = require('../models/AssetType');
const Notification = require('../models/Notification');
const { broadcast } = require('../utils/websocket');

exports.createRequest = async (req, res, next) => {
  try {
    const { assetType, customAssetType, description, urgency } = req.body;

    if (!assetType) {
      return res.status(400).json({ success: false, message: 'Asset type is required.' });
    }
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    let finalAssetType = assetType;

    // Check if user selected "other" and provided a custom asset type name
    if (assetType.toLowerCase() === 'other') {
      if (!customAssetType || !customAssetType.trim()) {
        return res.status(400).json({ success: false, message: 'Custom asset type name is required when choosing Other.' });
      }

      const trimmedName = customAssetType.trim();
      const code = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

      if (!code) {
        return res.status(400).json({ success: false, message: 'Invalid custom asset type name.' });
      }

      // Check if this type already exists in AssetType collection
      let typeExists = await AssetType.findOne({
        $or: [
          { code },
          { name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } }
        ]
      });

      if (!typeExists) {
        // Create new AssetType dynamically
        typeExists = await AssetType.create({
          name: trimmedName,
          code,
          category: 'Other',
          icon: 'HelpCircle',
          description: 'Dynamically added via employee asset request'
        });
      }

      finalAssetType = typeExists.code; // Use the new/existing type code
    }

    // Create the AssetRequest document
    const request = await AssetRequest.create({
      requestedBy: req.user._id,
      assetType: finalAssetType,
      description,
      urgency: urgency || 'medium'
    });

    broadcast('requests_update', { action: 'create', requestId: request._id });

    res.status(201).json({
      success: true,
      data: request,
      message: 'Asset request submitted successfully!'
    });
  } catch (error) {
    next(error);
  }
};

exports.getRequests = async (req, res, next) => {
  try {
    const { status, urgency, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (req.user.role === 'employee') {
      filter.requestedBy = req.user._id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      AssetRequest.find(filter)
        .populate('requestedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AssetRequest.countDocuments(filter)
    ]);

    // Fetch asset types to map codes to names
    const assetTypes = await AssetType.find({});
    const typeMap = {};
    assetTypes.forEach(t => {
      typeMap[t.code] = t.name;
    });

    const requestsWithTypeName = requests.map(req => {
      const doc = req.toObject();
      doc.assetTypeName = typeMap[req.assetType] || req.assetType;
      return doc;
    });

    res.json({
      success: true,
      data: requestsWithTypeName,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRequest = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const request = await AssetRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Asset request not found.' });
    }

    request.status = status;
    if (reviewNotes !== undefined) {
      request.reviewNotes = reviewNotes;
    }
    request.reviewedBy = req.user._id;

    await request.save();

    broadcast('requests_update', { action: 'update', requestId: request._id, status });

    res.json({
      success: true,
      data: request,
      message: `Asset request updated to ${status} successfully!`
    });
  } catch (error) {
    next(error);
  }
};


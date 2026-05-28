const AssetType = require('../models/AssetType');
const Asset = require('../models/Asset');

// GET /api/asset-types
exports.getAssetTypes = async (req, res, next) => {
  try {
    const assetTypes = await AssetType.find({}).sort({ category: 1, name: 1 });
    res.json({ success: true, data: assetTypes, total: assetTypes.length });
  } catch (error) {
    next(error);
  }
};

// POST /api/asset-types
exports.createAssetType = async (req, res, next) => {
  try {
    const { name, code, category, icon, description } = req.body;

    // Check if code or name already exists
    const existingType = await AssetType.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toLowerCase() }]
    });

    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'An asset type with this name or code already exists.',
      });
    }

    const assetType = await AssetType.create({
      name: name.trim(),
      code: code.trim().toLowerCase(),
      category,
      icon: icon || 'Package',
      description,
    });

    res.status(201).json({
      success: true,
      data: assetType,
      message: 'Asset type created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/asset-types/:id
exports.updateAssetType = async (req, res, next) => {
  try {
    const { name, code, category, icon, description } = req.body;
    const { id } = req.params;

    // Check if asset type exists
    const assetType = await AssetType.findById(id);
    if (!assetType) {
      return res.status(404).json({ success: false, message: 'Asset type not found.' });
    }

    // Check if another asset type has same name or code
    if (name || code) {
      const duplicateQuery = { _id: { $ne: id } };
      const conditions = [];
      if (name) conditions.push({ name: name.trim() });
      if (code) conditions.push({ code: code.trim().toLowerCase() });
      duplicateQuery.$or = conditions;

      const duplicate = await AssetType.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another asset type with this name or code already exists.',
        });
      }
    }

    // If the code is changing, check if there are assets using the old code and update them or restrict it
    const newCode = code ? code.trim().toLowerCase() : assetType.code;
    const oldCode = assetType.code;

    if (newCode !== oldCode) {
      // Update existing assets using this code to use the new code
      await Asset.updateMany({ type: oldCode }, { type: newCode });
    }

    assetType.name = name ? name.trim() : assetType.name;
    assetType.code = newCode;
    assetType.category = category || assetType.category;
    assetType.icon = icon || assetType.icon;
    assetType.description = description !== undefined ? description : assetType.description;

    await assetType.save();

    res.json({
      success: true,
      data: assetType,
      message: 'Asset type updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/asset-types/:id
exports.deleteAssetType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assetType = await AssetType.findById(id);
    if (!assetType) {
      return res.status(404).json({ success: false, message: 'Asset type not found.' });
    }

    // Check if any active asset uses this type code
    const assetCount = await Asset.countDocuments({ type: assetType.code, isDeleted: false });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${assetType.name}" because ${assetCount} active asset(s) are currently associated with it.`,
      });
    }

    await AssetType.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Asset type deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

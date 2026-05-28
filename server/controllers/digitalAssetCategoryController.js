const DigitalAssetCategory = require('../models/DigitalAssetCategory');
const DigitalAsset = require('../models/DigitalAsset');

// GET /api/digital-asset-categories
exports.getDigitalAssetCategories = async (req, res, next) => {
  try {
    const categories = await DigitalAssetCategory.find({}).sort({ name: 1 });
    res.json({ success: true, data: categories, total: categories.length });
  } catch (error) {
    next(error);
  }
};

// POST /api/digital-asset-categories
exports.createDigitalAssetCategory = async (req, res, next) => {
  try {
    const { name, code, icon, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required.' });
    }

    // Check if code or name already exists
    const existingCategory = await DigitalAssetCategory.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toLowerCase() }
      ]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name or code already exists.',
      });
    }

    const category = await DigitalAssetCategory.create({
      name: name.trim(),
      code: code.trim().toLowerCase(),
      icon: icon || 'File',
      description: description || '',
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/digital-asset-categories/:id
exports.updateDigitalAssetCategory = async (req, res, next) => {
  try {
    const { name, code, icon, description } = req.body;
    const { id } = req.params;

    // Check if category exists
    const category = await DigitalAssetCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check if another category has same name or code
    if (name || code) {
      const duplicateQuery = { _id: { $ne: id } };
      const conditions = [];
      if (name) conditions.push({ name: name.trim() });
      if (code) conditions.push({ code: code.trim().toLowerCase() });
      duplicateQuery.$or = conditions;

      const duplicate = await DigitalAssetCategory.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name or code already exists.',
        });
      }
    }

    const newCode = code ? code.trim().toLowerCase() : category.code;
    const oldCode = category.code;

    if (newCode !== oldCode) {
      // Update existing digital assets using this category code to use the new code
      await DigitalAsset.updateMany({ category: oldCode }, { category: newCode });
    }

    category.name = name ? name.trim() : category.name;
    category.code = newCode;
    category.icon = icon || category.icon;
    category.description = description !== undefined ? description : category.description;

    await category.save();

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/digital-asset-categories/:id
exports.deleteDigitalAssetCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await DigitalAssetCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check if any active digital assets use this category code
    const assetCount = await DigitalAsset.countDocuments({ category: category.code });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${category.name}" because ${assetCount} file(s) are currently associated with it.`,
      });
    }

    await DigitalAssetCategory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

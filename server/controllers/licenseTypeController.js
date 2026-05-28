const LicenseType = require('../models/LicenseType');
const License = require('../models/License');

// GET /api/license-types
exports.getLicenseTypes = async (req, res, next) => {
  try {
    const types = await LicenseType.find({}).sort({ name: 1 });
    res.json({ success: true, data: types, total: types.length });
  } catch (error) {
    next(error);
  }
};

// POST /api/license-types
exports.createLicenseType = async (req, res, next) => {
  try {
    const { name, code, icon, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required.' });
    }

    // Check if code or name already exists
    const existingType = await LicenseType.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toLowerCase() }
      ]
    });

    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'A license type with this name or code already exists.',
      });
    }

    const licenseType = await LicenseType.create({
      name: name.trim(),
      code: code.trim().toLowerCase(),
      icon: icon || 'Calendar',
      description: description || '',
    });

    res.status(201).json({
      success: true,
      data: licenseType,
      message: 'License type created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/license-types/:id
exports.updateLicenseType = async (req, res, next) => {
  try {
    const { name, code, icon, description } = req.body;
    const { id } = req.params;

    // Check if license type exists
    const licenseType = await LicenseType.findById(id);
    if (!licenseType) {
      return res.status(404).json({ success: false, message: 'License type not found.' });
    }

    // Check if another license type has same name or code
    if (name || code) {
      const duplicateQuery = { _id: { $ne: id } };
      const conditions = [];
      if (name) conditions.push({ name: name.trim() });
      if (code) conditions.push({ code: code.trim().toLowerCase() });
      duplicateQuery.$or = conditions;

      const duplicate = await LicenseType.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another license type with this name or code already exists.',
        });
      }
    }

    const newCode = code ? code.trim().toLowerCase() : licenseType.code;
    const oldCode = licenseType.code;

    if (newCode !== oldCode) {
      // Update existing licenses using this licenseType code to use the new code
      await License.updateMany({ licenseType: oldCode }, { licenseType: newCode });
    }

    licenseType.name = name ? name.trim() : licenseType.name;
    licenseType.code = newCode;
    licenseType.icon = icon || licenseType.icon;
    licenseType.description = description !== undefined ? description : licenseType.description;

    await licenseType.save();

    res.json({
      success: true,
      data: licenseType,
      message: 'License type updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/license-types/:id
exports.deleteLicenseType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const licenseType = await LicenseType.findById(id);
    if (!licenseType) {
      return res.status(404).json({ success: false, message: 'License type not found.' });
    }

    // Check if any active licenses use this licenseType code
    const licenseCount = await License.countDocuments({ licenseType: licenseType.code });
    if (licenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${licenseType.name}" because ${licenseCount} license(s) are currently associated with it.`,
      });
    }

    await LicenseType.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'License type deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

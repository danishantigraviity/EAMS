const User = require('../models/User');
const Asset = require('../models/Asset');
const ActivityLog = require('../models/ActivityLog');
const { cloudinary } = require('../middleware/upload');

// GET /api/employees
exports.getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, department, role, isActive } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [employees, total] = await Promise.all([
      User.find(filter)
        .populate('department', 'name code')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-passwordHash -refreshTokens -blacklistedTokens'),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: employees,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:id
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate('department', 'name code head')
      .select('-passwordHash -refreshTokens');

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const [assets, activity] = await Promise.all([
      Asset.find({ assignedTo: employee._id, isDeleted: false })
        .populate('department', 'name')
        .sort('-updatedAt'),
      ActivityLog.find({ userId: employee._id }).sort({ timestamp: -1 }).limit(20),
    ]);

    res.json({ success: true, data: { employee, assets, activity } });
  } catch (error) {
    next(error);
  }
};

// POST /api/employees
exports.createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone, employeeId } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already in use.' });

    const employee = new User({
      name,
      email,
      passwordHash: password,
      role: role || 'employee',
      department: department || null,
      phone: phone || null,
      employeeId: employeeId || null,
    });

    if (req.file) employee.profileImage = req.file.path;
    await employee.save();

    const populated = await User.findById(employee._id)
      .populate('department', 'name code')
      .select('-passwordHash');

    res.status(201).json({ success: true, data: populated, message: 'Employee created.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/employees/:id
exports.updateEmployee = async (req, res, next) => {
  try {
    const { name, role, department, phone, employeeId, isActive } = req.body;
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    if (name) employee.name = name;
    if (role) employee.role = role;
    if (department !== undefined) employee.department = department;
    if (phone !== undefined) employee.phone = phone;
    if (employeeId !== undefined) employee.employeeId = employeeId;
    if (isActive !== undefined) employee.isActive = isActive;

    if (req.file) {
      if (employee.profileImage) {
        const publicId = employee.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`eams/profiles/${publicId}`).catch(() => {});
      }
      employee.profileImage = req.file.path;
    }

    await employee.save();

    const populated = await User.findById(employee._id)
      .populate('department', 'name code')
      .select('-passwordHash');

    res.json({ success: true, data: populated, message: 'Employee updated.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/employees/:id
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    employee.isActive = false;
    await employee.save();

    res.json({ success: true, message: 'Employee deactivated.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:id/assets
exports.getEmployeeAssets = async (req, res, next) => {
  try {
    const assets = await Asset.find({ assignedTo: req.params.id, isDeleted: false })
      .populate('department', 'name')
      .sort('-updatedAt');

    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

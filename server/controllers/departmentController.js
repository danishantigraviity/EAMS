const Department = require('../models/Department');
const User = require('../models/User');
const Asset = require('../models/Asset');

exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('head', 'name email profileImage')
      .sort({ name: 1 });

    // Add counts
    const deptIds = departments.map((d) => d._id);
    const [empCounts, assetCounts] = await Promise.all([
      User.aggregate([
        { $match: { department: { $in: deptIds } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
      Asset.aggregate([
        { $match: { department: { $in: deptIds }, isDeleted: false } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
    ]);

    const empMap = {};
    empCounts.forEach((e) => { empMap[e._id.toString()] = e.count; });
    const assetMap = {};
    assetCounts.forEach((a) => { assetMap[a._id.toString()] = a.count; });

    const result = departments.map((d) => ({
      ...d.toJSON(),
      employeeCount: empMap[d._id.toString()] || 0,
      assetCount: assetMap[d._id.toString()] || 0,
    }));

    res.json({ success: true, data: result, total: result.length });
  } catch (error) { next(error); }
};

exports.getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate('head', 'name email');
    if (!department) return res.status(404).json({ success: false, message: 'Department not found.' });

    const [employees, assets] = await Promise.all([
      User.find({ department: department._id }).select('name email role profileImage isActive'),
      Asset.find({ department: department._id, isDeleted: false }).select('name type status serialNumber'),
    ]);

    res.json({ success: true, data: { department, employees, assets } });
  } catch (error) { next(error); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept, message: 'Department created.' });
  } catch (error) { next(error); }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('head', 'name email');
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
    res.json({ success: true, data: dept, message: 'Department updated.' });
  } catch (error) { next(error); }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
    res.json({ success: true, message: 'Department deactivated.' });
  } catch (error) { next(error); }
};

exports.getDepartmentAssets = async (req, res, next) => {
  try {
    const assets = await Asset.find({ department: req.params.id, isDeleted: false })
      .populate('assignedTo', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: assets });
  } catch (error) { next(error); }
};

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

departmentSchema.virtual('employeeCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true,
});

departmentSchema.virtual('assetCount', {
  ref: 'Asset',
  localField: '_id',
  foreignField: 'department',
  count: true,
});

module.exports = mongoose.model('Department', departmentSchema);

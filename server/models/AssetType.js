const mongoose = require('mongoose');

const assetTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset type name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Asset type code is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['IT Devices', 'Office Furniture', 'Network Devices', 'Accessories', 'Other'],
      default: 'Other',
    },
    icon: {
      type: String,
      default: 'Package',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
assetTypeSchema.index({ code: 1 });
assetTypeSchema.index({ category: 1 });

module.exports = mongoose.model('AssetType', assetTypeSchema);

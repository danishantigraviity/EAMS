const mongoose = require('mongoose');

const digitalAssetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'File',
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


module.exports = mongoose.model('DigitalAssetCategory', digitalAssetCategorySchema);

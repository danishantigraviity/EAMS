const mongoose = require('mongoose');

const licenseTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'License Type name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'License Type code is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'Calendar',
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



module.exports = mongoose.model('LicenseType', licenseTypeSchema);

const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      index: 'text',
    },
    type: {
      type: String,
      required: [true, 'Asset type is required'],
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    warrantyExpiry: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'damaged', 'maintenance', 'retired'],
      default: 'available',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    qrCode: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    cost: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
assetSchema.index({ status: 1, department: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ warrantyExpiry: 1 });
assetSchema.index({ type: 1 });
assetSchema.index({ name: 'text', serialNumber: 'text', vendor: 'text' });

// Virtual: isWarrantyExpiring
assetSchema.virtual('isWarrantyExpiring').get(function () {
  if (!this.warrantyExpiry) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.warrantyExpiry <= thirtyDaysFromNow && this.warrantyExpiry >= new Date();
});

// Virtual: isWarrantyExpired
assetSchema.virtual('isWarrantyExpired').get(function () {
  if (!this.warrantyExpiry) return false;
  return this.warrantyExpiry < new Date();
});

module.exports = mongoose.model('Asset', assetSchema);

const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema(
  {
    softwareName: {
      type: String,
      required: [true, 'Software name is required'],
      trim: true,
    },
    licenseKey: {
      type: String,
      required: [true, 'License key is required'],
      unique: true,
      trim: true,
    },
    vendor: {
      type: String,
      required: [true, 'Vendor is required'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: 1,
    },
    usedSeats: {
      type: Number,
      default: 0,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    cost: {
      type: Number,
      default: 0,
    },
    renewalReminderSent: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
    licenseType: {
      type: String,
      default: 'subscription',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
licenseSchema.index({ expiryDate: 1 });
licenseSchema.index({ softwareName: 'text', vendor: 'text' });

// Virtual: isExpiringSoon (< 30 days)
licenseSchema.virtual('isExpiringSoon').get(function () {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiryDate <= thirtyDaysFromNow && this.expiryDate >= new Date();
});

// Virtual: isExpired
licenseSchema.virtual('isExpired').get(function () {
  return this.expiryDate < new Date();
});

// Virtual: availableSeats
licenseSchema.virtual('availableSeats').get(function () {
  return this.totalSeats - this.usedSeats;
});

// Virtual: usagePercentage
licenseSchema.virtual('usagePercentage').get(function () {
  return this.totalSeats > 0 ? Math.round((this.usedSeats / this.totalSeats) * 100) : 0;
});

module.exports = mongoose.model('License', licenseSchema);

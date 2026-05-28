const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issue: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'cancelled'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    estimatedResolutionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

maintenanceRequestSchema.index({ assetId: 1 });
maintenanceRequestSchema.index({ reportedBy: 1 });
maintenanceRequestSchema.index({ status: 1, priority: -1 });

// Virtual: resolutionTimeHours
maintenanceRequestSchema.virtual('resolutionTimeHours').get(function () {
  if (!this.resolvedAt || !this.createdAt) return null;
  const diff = this.resolvedAt - this.createdAt;
  return Math.round(diff / (1000 * 60 * 60));
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

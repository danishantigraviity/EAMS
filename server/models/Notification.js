const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'asset_assigned',
        'asset_return',
        'warranty_expiry',
        'license_expiry',
        'maintenance_update',
        'maintenance_created',
        'asset_request',
        'general',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    resourceType: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

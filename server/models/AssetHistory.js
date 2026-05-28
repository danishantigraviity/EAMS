const mongoose = require('mongoose');

const assetHistorySchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['assigned', 'returned', 'repaired', 'transferred', 'created', 'updated', 'retired', 'maintenance_started', 'maintenance_completed'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fromEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    previousStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

assetHistorySchema.index({ assetId: 1, timestamp: -1 });

module.exports = mongoose.model('AssetHistory', assetHistorySchema);

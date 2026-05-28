const mongoose = require('mongoose');

const rideBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true,
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
    },
    dropLocation: {
      type: String,
      required: [true, 'Drop location is required'],
      trim: true,
    },
    pickupTime: {
      type: Date,
      required: [true, 'Pickup time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    driverName: {
      type: String,
      default: '',
      trim: true,
    },
    driverPhone: {
      type: String,
      default: '',
      trim: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rideBookingSchema.index({ user: 1 });
rideBookingSchema.index({ status: 1 });

module.exports = mongoose.model('RideBooking', rideBookingSchema);

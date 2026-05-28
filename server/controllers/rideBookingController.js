const RideBooking = require('../models/RideBooking');

// @desc    Create a new ride booking
// @route   POST /api/ride-bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { vehicleType, pickupLocation, dropLocation, pickupTime } = req.body;

    const booking = new RideBooking({
      user: req.user._id,
      vehicleType,
      pickupLocation,
      dropLocation,
      pickupTime,
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Ride booking request submitted successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all ride bookings (Admin sees all, Employee/Customer sees their own)
// @route   GET /api/ride-bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    let filter = {};

    // If not super_admin or it_team, filter by user
    if (!['super_admin', 'it_team'].includes(req.user.role)) {
      filter.user = req.user._id;
    }

    const bookings = await RideBooking.find(filter)
      .populate('user', 'name email employeeId')
      .sort('-createdAt');

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ride booking
// @route   GET /api/ride-bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await RideBooking.findById(req.params.id).populate('user', 'name email employeeId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Ride booking not found.' });
    }

    // Check ownership
    if (!['super_admin', 'it_team'].includes(req.user.role) && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking.' });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ride booking (Admin updates driver/notes/status, Employee can cancel)
// @route   PUT /api/ride-bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await RideBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Ride booking not found.' });
    }

    const isAdmin = ['super_admin', 'it_team'].includes(req.user.role);
    const isOwner = booking.user.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking.' });
    }

    if (isAdmin) {
      // Admin can update everything
      const { status, driverName, driverPhone, adminNotes, vehicleType, pickupLocation, dropLocation, pickupTime } = req.body;

      if (status) booking.status = status;
      if (driverName !== undefined) booking.driverName = driverName;
      if (driverPhone !== undefined) booking.driverPhone = driverPhone;
      if (adminNotes !== undefined) booking.adminNotes = adminNotes;
      if (vehicleType) booking.vehicleType = vehicleType;
      if (pickupLocation) booking.pickupLocation = pickupLocation;
      if (dropLocation) booking.dropLocation = dropLocation;
      if (pickupTime) booking.pickupTime = pickupTime;
    } else {
      // Employee can only update details if pending, or cancel the booking
      const { status, vehicleType, pickupLocation, dropLocation, pickupTime } = req.body;

      if (status === 'cancelled') {
        booking.status = 'cancelled';
      } else {
        if (booking.status !== 'pending') {
          return res.status(400).json({ success: false, message: 'Cannot modify a booking that is already confirmed or completed.' });
        }
        if (vehicleType) booking.vehicleType = vehicleType;
        if (pickupLocation) booking.pickupLocation = pickupLocation;
        if (dropLocation) booking.dropLocation = dropLocation;
        if (pickupTime) booking.pickupTime = pickupTime;
      }
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Ride booking updated successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ride booking
// @route   DELETE /api/ride-bookings/:id
// @access  Private (Admin Only)
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await RideBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Ride booking not found.' });
    }

    await booking.deleteOne();

    res.json({
      success: true,
      message: 'Ride booking deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rideBookingController = require('../controllers/rideBookingController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const bookingValidation = [
  body('vehicleType').trim().notEmpty().withMessage('Vehicle type is required'),
  body('pickupLocation').trim().notEmpty().withMessage('Pickup location is required'),
  body('dropLocation').trim().notEmpty().withMessage('Drop location is required'),
  body('pickupTime').isISO8601().withMessage('Valid pickup time in ISO8601 format is required'),
];

// Protect all routes
router.use(protect);

router.route('/')
  .post(bookingValidation, validate, rideBookingController.createBooking)
  .get(rideBookingController.getBookings);

router.route('/:id')
  .get(rideBookingController.getBookingById)
  .put(rideBookingController.updateBooking)
  .delete(requireRole('super_admin', 'it_team'), rideBookingController.deleteBooking);

module.exports = router;

import Joi from 'joi';
import { Booking } from '../models/Booking.js';

// Schema for validating booking data to be created
const createSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(), // must end AFTER it starts
  purpose: Joi.string().required(),
  bookedBy: Joi.string()
});

// Schema for validating booking data to be updated
const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date().greater(Joi.ref('startDate')), // must end AFTER it starts
  purpose: Joi.string(),
  bookedBy: Joi.string(),
}).or('roomNumber', 'startDate', 'endDate', 'purpose', 'bookedBy'); // at least one field must be provided

// Helper method to wrap a booking document into a public-facing object
function publicBooking(b) {
  if (!b) return null;

  let bookedByData = b.bookedBy;

  if (b.bookedBy && typeof b.bookedBy === 'object') {
    bookedByData = {
      id: b.bookedBy._id || b.bookedBy.id,
      name: b.bookedBy.name,
      email: b.bookedBy.email,
    };
  }

  return {
    id: b._id || b.id,
    roomNumber: b.roomNumber,
    startDate: b.startDate,
    endDate: b.endDate,
    purpose: b.purpose,
    bookedBy: b.bookedBy ? bookedByData : null, // FIX: reference b.bookedBy instead of undefined bookedBy
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

// Helper method to check if a proposed booking conflicts with an existing one
async function hasBookingConflict(roomNumber, startDate, endDate, ignoreBookingId = null) {
  const query = {
    roomNumber: roomNumber,
    startDate: { $lt: new Date(endDate) },   // starts BEFORE proposed end time
    endDate: { $gt: new Date(startDate) },    // ends AFTER proposed start time
  };

  // If updating, ignore the current booking ID
  if (ignoreBookingId) {
    query._id = { $ne: ignoreBookingId };
  }

  const existingBooking = await Booking.findOne(query);
  return Boolean(existingBooking);
}

// GET /api/bookings
export async function getAllBookings(req, res, next) {
  try {
    const bookings = await Booking.find()
      .populate('bookedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings.map(publicBooking));
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
export async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('bookedBy', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking: publicBooking(booking) });
  } catch (err) { next(err); }
}

// POST /api/bookings
export async function createBooking(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // Check for overlapping bookings
    const isConflict = await hasBookingConflict(value.roomNumber, value.startDate, value.endDate);
    if (isConflict) {
      return res.status(409).json({ message: 'Booking conflicts with an existing booking' });
    }

    // Create booking and populate user details
    const booking = await Booking.create(value);
    const populatedBooking = await booking.populate('bookedBy', 'name email');

    res.status(201).json({ booking: publicBooking(populatedBooking) });
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
export async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;

    // Fetch existing booking
    const booking = await Booking.findById(id).populate('bookedBy', 'name email');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate input payload
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) return res.status(400).json({ message: error.message });

    // Merge new values with existing DB data
    const roomNumber = value.roomNumber || booking.roomNumber;
    const startDate = value.startDate || booking.startDate;
    const endDate = value.endDate || booking.endDate;

    // Verify end date follows start date
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'endDate must be strictly after startDate' });
    }

    // Check for schedule conflicts (excluding current booking ID)
    const isConflict = await hasBookingConflict(roomNumber, startDate, endDate, id);
    if (isConflict) {
      return res.status(409).json({ message: 'Booking conflicts with an existing booking' });
    }

    // Apply updates and save
    Object.assign(booking, value);
    await booking.save();
    
    // Re-populate if bookedBy was updated
    if (value.bookedBy) {
      await booking.populate('bookedBy', 'name email');
    }

    res.json({ booking: publicBooking(booking) });
  } catch (err) { next(err); }
}

// DELETE /api/bookings/:id
export async function deleteBooking(req, res, next) {
  try {
    const doc = await Booking.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) { next(err); }
}
import { Booking } from '../models/Booking.js';

// TODO: write a validation schema for create/update per README.md section 2.
const Joi = require('joi');

// Schema for validating booking data to be created
const createSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(), // must end AFTER it starts
  purpose: Joi.string().required(),
  bookedBy: Joi.string().required(),
});

// Schema for validating booking data to be updated
const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date().greater(Joi.ref('startDate')), // must end AFTER it starts
  purpose: Joi.string(),
  bookedBy: Joi.string(),
}).or('roomNumber', 'startDate', 'endDate', 'purpose', 'bookedBy'); // at least one field must be provided



// TODO: per README.md section 4, you will need a way to detect whether a
// proposed booking conflicts with an existing one on the same room.

// GET /api/bookings
// TODO: implement per README.md section 3.
export async function getAllBookings(req, res, next) {
  try {
    // TODO
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getBooking(req, res, next) {
  try {
    // TODO
  } catch (err) { next(err); }
}

// POST /api/bookings
// TODO: implement per README.md sections 3 and 4.
export async function createBooking(req, res, next) {
  try {
    // TODO
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
// TODO: implement per README.md sections 3, 4, and 5.
export async function updateBooking(req, res, next) {
  try {
    // TODO
  } catch (err) { next(err); }
}

// DELETE /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteBooking(req, res, next) {
  try {
    // TODO
  } catch (err) { next(err); }
}

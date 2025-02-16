const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor',
    // required: [true, 'Booking must belong to a Doctor!']
  },
  clinic: {
    type: mongoose.Schema.ObjectId,
    ref: 'Clinic',
    // required: [true, 'Booking must belong to a Doctor!']
  },
  center: {
    type: mongoose.Schema.ObjectId,
    ref: 'Center',
    // required: [true, 'Booking must belong to a Doctor!']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!']
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price.']
  },
  paid: {
    type: Boolean,
    default: true
  },
  date: {
    type: Date,
    default: new Date('2024-07-25')
  },
  time: {
    type: String,
    default: '15:00' // or '3:00 PM' if you prefer
  },
  isfinish: {
    type: Boolean,
    default: false
  }
},
{
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: { virtuals: true }
});

bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'doctor',
    select: 'name'
  });
  next();
});

bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'clinic',
    select: 'name'
  });
  next();
});

bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'center',
    select: 'name'
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

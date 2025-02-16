const stripe = require('stripe')(process.env.STRIPE_SECRET);
const Doctor = require('./../models/DoctorModel');
const Clinic = require('./../models/clinicModel');
const Center = require('./../models/centerModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlersFactory');
const AppError = require('./../utils//apiError');
const expressAsyncHandler = require('express-async-handler');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1. Get the currently booked doctor
    const doctor = await Doctor.findById(req.params.doctorId);

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/`,
        cancel_url: `${req.protocol}://${req.get('host')}/doctor/${encodeURIComponent(doctor.name)}`,
        client_reference_id: req.params.doctorId,
        line_items: [
            {
                price_data: {
                    currency: 'egp',
                    product_data: {
                        name: `${doctor.name} Doctor`,
                        description: `${doctor.bio}`,
                    },
                    unit_amount: doctor.price * 100, // Convert price to smallest currency unit
                },
                quantity: 1
            }
        ],
        mode: 'payment' // Specify the mode as 'payment'
    });

    // 3. Return session as response with only id and url
    res.status(200).json({
        status: 'success',
        session: {
            id: session.id,
            url: session.url
        }
    });
});

// check-out for clinic
exports.getCheckoutClinicSession = catchAsync(async (req, res, next) => {
    // 1. Get the currently booked clinic
    const clinic = await Clinic.findById(req.params.clinicId);

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/`,
        cancel_url: `${req.protocol}://${req.get('host')}/clinic/${encodeURIComponent(clinic.name)}`,
        client_reference_id: req.params.clinicId,
        line_items: [
            {
                price_data: {
                    currency: 'egp',
                    product_data: {
                        name: `${clinic.name} Clinic`,
                        description: `${clinic.bio}`,
                    },
                    unit_amount: clinic.price * 100, // Convert price to smallest currency unit
                },
                quantity: 1
            }
        ],
        mode: 'payment' // Specify the mode as 'payment'
    });

    // 3. Return session as response
    res.status(200).json({
        status: 'success',
        session: {
            id: session.id,
            url: session.url
        }
    });
});

// check-out for center
exports.getCheckoutCenterSession = catchAsync(async (req, res, next) => {
    // 1. Get the currently booked center
    const center = await Center.findById(req.params.centerId);

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/`,
        cancel_url: `${req.protocol}://${req.get('host')}/center/${encodeURIComponent(center.name)}`,
        client_reference_id: req.params.centerId,
        line_items: [
            {
                price_data: {
                    currency: 'egp',
                    product_data: {
                        name: `${center.name} Center`,
                        description: `${center.bio}`,
                    },
                    unit_amount: center.price * 100, // Convert price to smallest currency unit
                },
                quantity: 1
            }
        ],
        mode: 'payment' // Specify the mode as 'payment'
    });

    // 3. Return session as response
    res.status(200).json({
        status: 'success',
        session: {
            id: session.id,
            url: session.url
        }
    });
});


const createBookingCheckout = async session => {
    try {
        const doctorId = session.client_reference_id;
        const doctor = await Doctor.findById(doctorId).select('name');
        const user = await User.findOne({ email: session.customer_email }).select('name');
        
        // Check if user exists
        if (!user) {
            throw new Error('User not found');
        }

        const price = session.amount_total / 100; // 'amount_total' contains the total amount in the smallest currency unit
        const date = new Date('2024-07-25');
        const time = '15:00'; // or '3:00 PM' if you prefer

        const booking = await Booking.create({
            doctor: doctorId,
            user: user.id,
            price,
            date,
            time
        });

        console.log('Booking created:', booking);

        // Constructing response
        const response = {
            doctorName: doctor.name,
            userName: user.name,
            price: booking.price,
            paid: booking.paid,
            id: booking.id,
            date: booking.date,
            time: booking.time
        };

        return response;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw new AppError('Error creating booking', 500);
    }
};


// create booking for clinic
const createBookingClinicCheckout = async session => {
    try {
        const clinicId = session.client_reference_id;
        const clinic = await Doctor.findById(clinicId);
        const user = await User.findOne({ email: session.customer_email });
        
        // Check if user exists
        if (!user) {
            throw new Error('User not found');
        }

        const price = session.amount_total / 100; // 'amount_total' contains the total amount in the smallest currency unit
        await Booking.create({ clinic: clinicId, user: user.id, price });
        console.log('Booking created:', { clinic: clinicId, user: user.id, price });
    } catch (error) {
        console.error('Error creating booking:', error);
        throw new AppError('Error creating booking', 500);
    }
};

// create booking for center
const createBookingCenterCheckout = async session => {
    try {
        const centerId = session.client_reference_id;
        const center = await Doctor.findById(centerId);
        const user = await User.findOne({ email: session.customer_email });
        
        // Check if user exists
        if (!user) {
            throw new Error('User not found');
        }

        const price = session.amount_total / 100; // 'amount_total' contains the total amount in the smallest currency unit
        await Booking.create({ center: centerId, user: user.id, price });
        console.log('Booking created:', { center: centerId, user: user.id, price });
    } catch (error) {
        console.error('Error creating booking:', error);
        throw new AppError('Error creating booking', 500);
    }
};


exports.webhookCheckout = catchAsync(async (req, res, next) => {
    const signature = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const clientReferenceId = session.client_reference_id;
        const doctor = await Doctor.findById(clientReferenceId);
        const clinic = await Clinic.findById(clientReferenceId);
        const center = await Center.findById(clientReferenceId);

        if (doctor) {
            createBookingCheckout(session);
            res.status(200).json({ received: true, bookingType: 'doctor' });
        } else if (clinic) {
            createBookingClinicCheckout(session);
            res.status(200).json({ received: true, bookingType: 'clinic' });
        } else if (center) {
            createBookingCenterCheckout(session)
            res.status(200).json({ received: true, bookingType: 'center' })
        }
         else {
            return next(new AppError('Invalid client reference id', 404));
        }
    } else {
        res.status(200).json({ received: false });
    }
});



exports.getUserBookings = catchAsync(async (req, res, next) => {
    const userId = req.params.userId;

    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ user: userId })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'doctor', select: 'name' })
        .populate({ path: 'user', select: 'name' });

    const totalBookings = await Booking.countDocuments({ user: userId });

    if (!bookings || bookings.length === 0) {
        return next(new AppError('No bookings found for this user', 404));
    }

    // Constructing response
    const formattedBookings = bookings.map(booking => ({
        doctorName: booking.doctor.name,
        userName: booking.user.name,
        price: booking.price,
        paid: booking.paid,
        id: booking.id,
        date: booking.date,
        time: booking.time,
        isfinish: booking.isfinish
    }));

    res.status(200).json({
        status: 'success',
        results: formattedBookings.length,
        totalBookings,
        data: formattedBookings
    });
});



exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);


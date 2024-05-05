const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory.js');

exports.checkoutSession = catchAsync(async (req, res, next) => {
  // 1. Get Currently booked Tour
  const tour = await Tour.findById(req.params.tourId);
  // 2. Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    // This is the detail about the service itself=
    mode: 'payment',
    // So in this case the stripe will create a session which
    // further proceeds and create a webhook which can be used to redirect to the success_url
    // But in this case we cannot do that
    // insted the below version  will be used
    // but remember this is not secure anyone who knows about the structure of this url can use and book the tour without even actually checking out
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // This is the detail about the product
    line_items: [
      {
        price_data: {
          currency: 'USD',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`
            ]
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }
    ]
  });
  // 3. Create Session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

// function to create a new booking

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only temporary, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  // this next stack will be the getOverview page from the viewRoutes.js file
  // this will create an array and will redirect to
  // ${req.protocol}://${req.get('host')}/
  res.redirect(req.originalUrl.split('?')[0]);
});

// creating a booking
// exports.createBooking = catchAsync(async (req, res, next) => {
//   const data = await Booking.create(req.body);
//   res.status(200).json({
//     status: 'success',
//     data
//   });
// });

// // updating the booking
// exports.updateBooking = catchAsync(async (req, res, next) => {
//   const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   if (!booking) return next(AppError('Booking not found', 404));

//   res.status(200).json({
//     status: 'success',
//     booking
//   });
// });

// exports.deleteBooking = catchAsync(async (req, res, next) => {
//   await Booking.findByIdAndDelete(req.params.id);
//   res.status(200).json({
//     status: 'success'
//   });
// });

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

const Review = require('../models/reviewsModel.js');
// const catchAsync = require('../utils/catchAsync.js');
const factory = require('./handlerFactory.js');

// exports.getAllReview = catchAsync(async (req, res, next) => {
//   // so this route specifies that the user can get all the reviews
//   // for a particular requested id
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);

//   res.status(200).send({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });

// exports.getReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.params.id);

//   if (!review) {
//     return next(new AppError('No reviews on this tour', 404));
//   }

//   res.status(200).json({
//     status: 'Success',
//     data: {
//       review
//     }
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.users) req.body.users = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);

// exports.createReview = catchAsync(async (req, res, next) => {
//   // Allow nested routes

//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.users) req.body.users = req.user.id;
//   const review = await Review.create(req.body);

//   res.status(201).json({
//     status: 'Success',
//     message: 'Review created ',
//     review: {
//       review
//     }
//   });
// });

// or you can use the old method
exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

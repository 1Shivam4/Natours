const mongoose = require('mongoose');
const Tour = require('../models/tourModel.js');

// review / rating / createdAt / ref to tour / ref to user

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must being to a tour']
      }
    ],
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must be from a user']
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    otObject: { virtuals: true }
  }
);
// by applying that we can restrict any user to give duplicate reviews to the tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  //   this.populate({
  //     path: 'users',
  //     select: 'name '
  //   });
  //   this.populate({
  //     path: 'tour',
  //     select: 'name photo'
  //   });

  this.populate({
    path: 'users',
    select: 'name '
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // the this keyword will have the access to the current database model
  // so by using the statics method we can apply the aggregation pipeline
  // But remember that the aggregate method returns an promise so it should be an async function
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        // This will count the entrie number of rating that has been assigned to the tour
        avgRating: { $avg: '$rating' }
        // so using this we can calculate the average rating on a tour
      }
    }
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function(next) {
  // this point to the current review
  this.constructor.calcAverageRatings(this.tour);
  // so the this.constructor will have the control the the review model
  // Review.calcAverageRatings(this.tour);
});

// findByIdUpdate
// findByIdDelete
// so this pre middleware is used to locate the tour
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

// This will actually update the rating
reviewSchema.post(/^findOneAnd/, async function() {
  // this.r = this.findOne(); will NOT work Here query has already executed
  // so using the above method we get ahold of the the current review doucument and update it along with the rating
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('review', reviewSchema);

module.exports = Review;

const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal of 40 characters'],
      minlength: [10, 'a tour must have minimum of 10 characters']
      // validate: [validator.isAlpha, "tour name must only contain charaters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Diffuclty is either easy , medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1 or zero'],
      max: [5, 'It should be below 5'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: function(val) {
        // this will not work if you are updating some data
        return val < this.price; // 100<200
      },
      message: 'Discount price ({VALUE}) should be below regular price'
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // This is called the embedding data
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // so this how we reference users any anything in mongoose
    // guides:Array //  this was used for embedding the data
    guides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    // reviews: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Review'
    //   }
    // ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// this is called the single indexing
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
// in this 1 means ascending and -1 means descending
tourSchema.index({ slug: 1 });
// this is to locate the 2d sphere on the earth's surface
tourSchema.index({ startLocation: '2dsphere' });

// console.log(tourSchema.indexes());

// virtual population
tourSchema.virtual('reviews', {
  ref: 'review',
  foreignField: 'tour',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() but it will not work on .insertMany()
// This will be the hook for the next pre method
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  // the this keyword is showing the current doucment
  next();
});

// so to embed the documents we can use this pre statment
// tourSchema.pre('save', async function(next) {
//   // so this will return a bunch of promises
//   const guidesPromises = this.guides.map(async id => await User.findById(id));

//   // so to store those promises we will await for the all the promises and get their value
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// This is called the pre save hook
// tourSchema.pre("save", function (next) {
//   console.log("Will save document....");
//   next();
// });

// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
  // tourSchema.pre("find", function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  // the this keyword in this section is pointng to the current query
  next();
});

// incase you always want to populate all of your documents use the query middleware
tourSchema.pre(/^find/, function(next) {
  // in the query middleware the this keyword always points to the current
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});
// this can only be used when the data
// is executed this is beacause the query
// is actually finished at this point
// tourSchema.post(/^find/, function(docs, next) {
//   // console.log(`query took ${Date.now() - this.start} miliseconds`);
//   next();
// });

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   // the the pipeline in the aggregation method is an array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   // the this keyword is pointing to the aggregation object
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

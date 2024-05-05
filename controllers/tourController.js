const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const factory = require('./handlerFactory.js');

const multerStorage = multer.memoryStorage();
// if the uploaded file is an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// When you want to save the images to mixed fields
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2.  Images
  req.body.images = [];

  // This has done because unlike any other image processing while looping around the uploaded images can cause the images to be pushed into the array but in an unhandled promise
  // That will certainly cause problems on saving the new images to the file system
  // So to avoid that we use Promise.all to handle all the returned promises and map out the array elements and save them

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

// When there is an single image
// upload.single('image'); req.file
// When there are multiple images with the same name
// upload.array('images', 5); req.files

// Aliasing
// this is the prefilling in the site for the users
// so that the user does not have to do it
// on its own
exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // The simple method will be saved in the readme file

//   // EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .panginate();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
//   // const tours = await Tour.find()
//   //   .where("duration")
//   //   .equals(5)
//   //   .where("difficulty")
//   //   .equals("easy");
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   // this is the populate method in mongoose to bascially populate the getTour with the actual data

//   // so this populate data is the fundamental of the monogdb database modelling
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // or Tour.findOne({_id:req.params.id})

//   // This will be controlling the 404 page not found error into our app
//   if (!tour) {
//     return next(new AppError(`No tour find with that ID`, 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// example of error handling for the async function
exports.createTour = factory.createOne(Tour);

// catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       newTour
//     }
//   });
// try {

// } catch (err) {
//   res.status(400).json({
//     status: "failed",
//     message: err,
//   });
// }
// });

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const update = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   if (!update) {
//     return next(new AppError(`No tour find with that ID`, 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       update
//     }
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError(`No tour find with that ID`, 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     message: 'Tour successfully deleted',
//     tour
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: "$difficulty",
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // { $match: { _id: { $ne: "EASY" } } },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyClients = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    { $sort: { numTourStarts: -1 } },
    { $limit: 6 }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// tours-distance?distance=233&center=-48,45&unit=n1
// what we are using /tour-distance/233/center/30.336400, 78.030031/unit/mi

// So this will help us to find and determine any tour that is inside of this particular distance or radius
exports.getTourWithin = catchAsync(async (req, res, next) => {
  // we are destructuring the input data for getting all the data specificly
  const { distance, latlng, unit } = req.params;
  // as latitude and longitude are in same string seperated by , we first store it in an array and then split them by ,
  const [lat, lan] = latlng.split(',');

  // this is to get the radius from the distance
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lan) {
    next(
      new AppError(
        'Please provide latitude and longitude in the fromat lat,lan',
        400
      )
    );
  }
  // console.log(distance, lat, lan);
  const tours = await Tour.find({
    // as we know we have indexed the startLocation into our schema we can implement the $geoWithin in our query string
    // The $geoWithin query string is an build in mongodb query string that allows to track down the coordinates of the location
    // so to execute the query string we need to use another query string that is $centerSphere which furthur stores an array of coordinates
    // keep in mind that the $centerSphere query string will store the coordinates in the specified order
    // i.e. [[lan,lat],radius]
    startLocation: { $geoWithin: { $centerSphere: [[lan, lat], radius] } }
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours }
  });
});
// by default the result will be calculated in meters
exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lan] = latlng.split(',');

  const multipler = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lan) {
    next(
      new AppError(
        'Please provide latitude and longitude in the fromat lat,lan',
        400
      )
    );
  }

  const distance = await Tour.aggregate([
    {
      // always keep in mind that the geoNear will always be the first one in the aggregation pipeline
      // and the thing about the geoNear is that it will require one of the indexes of the data that we have aquired
      // so as we have indexed the startLocation index into our model
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lan * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multipler
      }
      // this method is to get only the specific fields
      // $project: {
      //   distance: 1,
      //   name: 1
      // }
    },
    {
      $project: { distance: 1, name: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distance
    }
  });
});

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures.js');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No tour find with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      message: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError(`No tour find with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'Success',
      message: 'Document created successdully ',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError(`No document find with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on Tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .panginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        doc
      }
    });
  });

// this is just an reference
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

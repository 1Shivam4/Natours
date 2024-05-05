const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const factory = require('./handlerFactory.js');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-789738br-2314234234.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// This way the image will be saved as a buffer or temperory file
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

exports.uploadPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  if (!req.file) return next();

  // This is done because when the image file is in the buffer memory the req.file.filename becomes undefined
  // And to upload it using our updateMe middleware, we actually need the req.file.filename to save the file into our memory
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`/public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  // in this we basically loop through
  // all the objects and see if the allowed fields are there or not
  // if it is one of the allowed fields then we will keep them in the new field
  const newObject = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

// exports.getAllUsers = catchAsync(async (req, res) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     data: {
//       users
//     }
//   });
// });

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// This will update the currently logged in user
// So this is to ensure that instead of updating
// the user password we are apdating the user data
// so instead of doing in the auhtController
// It is feasible to do it in user controller
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file); // to see the file name
  // console.log(req.body);
  //1. Create error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please user updateMyPassword',
        400
      )
    );
  }
  // . body.role 'admin
  // 2. First we have filtered out the users that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // to check if the uploaded content is a file or not
  if (req.file) filteredBody.photo = req.file.filename;

  // 3. update the document
  const userUpdate = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: userUpdate
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'Success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use signup instead'
  });
};

// Only for the administrators excluding the password field
// or do not update password with this
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.patchUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

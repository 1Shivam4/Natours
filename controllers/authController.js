const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const Email = require('../utils/email.js');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 23 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.header('x-forwarded-proto') === 'https'
  });

  // this should remove the password form the signup output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  // Sending up the mail
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1. check the email and password of the client
  if (!email || !password) {
    return next(new AppError('Please provide email and password'));
  }
  // 2. Check user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. if everything okay, send token to the client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

// exports.protect = catchAsync(async (req, res, next) => {
//   // 1) Getting token and check if its there
//   // so to do this you can set headers use docs to know how to implement the headers
//   // console.log(req.headers);
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   }
//   // console.log(req.headers);

//   // only use the token that exits in order to get rid of
//   // the jwt malformed
//   if (!token) {
//     return next(
//       new AppError('You are not logged in! Please log in to get access.', 401),
//     );
//   }

//   // 2) Verification token
//   // this will return a promise
//   // all this will promisify the token and then the promised value
//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
//   // console.log(decoded);
//   // 3) Check if user still exits
//   // This section of code is basically to
//   // identify weather the user exits or not
//   // if the users id has been deleted but it is still logged with the expired id it should be handled here
//   const freshUser = await User.findById(decoded.id);
//   if (!freshUser) {
//     return next(
//       new AppError(
//         'The user belonging to this token does no longer exits. ',
//         401,
//       ),
//     );
//   }
//   // 4) Check if user changes password after the token is issued
//   // for this we will use instances method to find if the user password has changed or not
//   // so most of this part of the code will be executed in userModel
//   // this instance has been called from the userModel
//   if (freshUser.changedPasswordAfter(decoded.iat)) {
//     return new AppError('User recently changed password ! Please Login again');
//   }

//   // grant access to protected route
//   req.user = freshUser;
//   next();
// });

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError('User recently changed password! Please log in again.', 401),
  //   );
  // }

  // // // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  // This has be done because it can use the local access to all the defined routes
  res.locals.user = currentUser;
  next();
});

// this only here to see the logged in pages or rendered pages
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // VERIFY TOKEN
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // THERE is an logged in user
      res.locals.user = currentUser;
      return next();
    }
  } catch (e) {
    return next();
  }

  // if there is no logged in user then get the next middleware rightaway
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permissions to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted emial
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Generate an random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 3) Send it to the user's email

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:${resetURL}.\n If you didn't forgot you password please ignore this email`;
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: `Your password token (valid for 10 min)`,
    //   message
    // });
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(`There was an error sending the email. Try again later`)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) if token has not expired, and there is user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired'));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 3) Update the changedPasswordAt property for the user
  // 4) Log the user in send jwt
  createSendToken(user, 200, req, res);
});

// This is only for the user who is already logged in
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. User from the collecion
  const user = await User.findById(req.user.id).select('+password');
  //2 Check if the posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError('Incorrect password please enter the correct password', 401)
    );
  }
  // 3. if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will not work intended

  createSendToken(user, 200, req, res);

  //4 . Log USer in send JWT
});

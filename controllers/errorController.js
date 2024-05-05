const AppError = require('../utils/appError.js');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};

// Also used regular expressions
const handleDuplicateErrorDB = err => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/);

  const handleJwtError = () => new AppError('Invalid token: please log again');

  const message = `Duplicate field value ${value}. Please enter some other value`;
  return new AppError(message, 400);
};

const handleJwtExpiredError = () =>
  new AppError('Your token has expired please login again', 401);

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // APIs
  if (req.originalUrl.startsWith('/api')) {
    return res.status(
      res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      })
    );
  }
  // B) RENDERED WEBSITE
  console.error('ERROR 💥💥', err);
  return res
    .status(err.statusCode)
    .render('error', { title: 'something went wrong', msg: err.message });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    // a) API
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(
        res.status(err.statusCode).json({
          status: err.status,
          message: err.message
        })
      );
    }
    // B) Programming or other unknown error : don't leak error details
    // 1) log the error
    // console.error('ERROR 💥💥', err);
    // 2) send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something wend wrong'
    });
  }
  // RENDERED WEBSITE
  // a) API
  if (err.isOperational) {
    // A) Operational, trusted error: send message to client
    return res
      .status(err.statusCode)
      .render('error', { title: 'something went wrong', msg: err.message });
  }
  // Programming or other unknown error : don't leak error details
  // 1) log the error
  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: 'Please try again later'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // this will handle the error created by the mongoose
    // So this error will create a new error and mark that as an operational error
    // this happens because all the operations in the DB have the isOperations Error set to true automatically
    let error = { ...err }; // to get all the values from the err object
    error.message = err.message;

    if (error.keyValue.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateErrorDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError();
    if (error.name === 'TokenExpiredError') error = handleJwtExpiredError();
    sendErrorProd(err, res);
  }
};

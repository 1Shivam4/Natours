const path = require('path');
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

dotenv.config();

const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');
const tourRouter = require('./routes/tourRoute.js');
const usersRoute = require('./routes/usersRoute.js');
const reviewRoute = require('./routes/reviewRoute.js');
const bookingRoute = require('./routes/bookingRoute.js');
const viewRouter = require('./routes/viewRoutes.js');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// 1. GLOBAL Middlewares

// SECURITY HTTP Headers
// so this is the setting security http headers
// remember to set this as top as possible beacuse
// it will automatically set the required security headers
app.use(helmet());

// limit the request from the same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request form this IP, please  try again in an hour'
});

app.use('/api', limiter);

// body-parser, reading data from the body into req.body
app.use(
  express.json({
    limit: '10kb'
  })
);
// Well this urlencoded middleware is required to get the form input data from the client
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// DATA SANITIZATION against NoSQL query injections
// this does to look for the req.body and req.query and req.params and then filter out all of the $signs and dots from the code
app.use(mongoSanitize());

// Data sanitization against XSS
// this will prevent you from the malicious html code
app.use(xssClean());

// prevent parameter plooution
// it is basically used to clear out the query string
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'price',
      'difficulty'
    ]
  })
);

app.use(compression());

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toLocaleDateString();
  // console.log(req.cookies);
  next();
});

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 2. Route Handlers

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', usersRoute);
app.use('/api/v1/reviews', reviewRoute);
app.use('/api/v1/booking', bookingRoute);

app.all('*', (req, res, next) => {
  // next(err);
  next(new AppError(`Can't find the ${req.originalUrl} on this url`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;

const express = require('express');
const user = require('../controllers/userController.js');
const auth = require('../controllers/authController.js');

// 3. Routes

// app.get('/api/v1/tours', getTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', patchTour);
// app.delete('/api/v1/tours/:id', deleteTour);

const route = express.Router();

route.post('/signup', auth.signup);
route.post('/login', auth.login);
route.get('/logout', auth.logout);

route.post('/forgotPassword', auth.forgotPassword);

route.patch('/resetPassword/:token', auth.resetPassword);

// Protect all routes after this middleware
route.use(auth.protect);

route.patch('/updateMyPassword', auth.updatePassword);

route.get('/me', user.getMe, user.getUser);
route.patch('/updateMe', user.uploadPhoto, user.resizeUserPhoto, user.updateMe);
route.delete('/deleteMe', auth.protect, user.deleteMe);

route.use(auth.restrictTo('admin'));

route
  .route('/')
  .get(user.getAllUsers)
  .post(user.createUser);

route
  .route('/:id')
  .get(user.getUser)
  .patch(user.patchUser)
  .delete(user.deleteUser);

module.exports = route;

const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  // This is the route that will be hit when the credit card is actually charged
  // but in this case the getOverview Page will be unsecured
  // so to make it secure we need to set the url set to the original url and by redirecting the url to the home url it will not have the query strings i.e. user, tour and price
  bookingController.createBookingCheckout,
  // So after the url has been hit without the query string we can have access to this route
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);

module.exports = router;

const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect);
router.get('/checkout-session/:tourId', bookingController.checkoutSession);

router
  .route('/')
  .get(
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.getAllBooking
  )
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.getBooking
  )
  .patch(
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.updateBooking
  )
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.deleteBooking
  );

module.exports = router;

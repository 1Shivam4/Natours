const express = require('express');
const tour = require('../controllers/tourController.js');
const authController = require('../controllers/authController.js');
const reviewRouter = require('../routes/reviewRoute.js');

const router = express.Router();
// This will create a new custome route and make it look like a file of its own
// router.param("id", tour.checkId);

// POST  /tour/2344/reviews
// GET /tour/2344/reviews
// GET /tour/2344/reviews/908jksda

// well we just commented out this piece of code
// because this does not belongs here

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(tour.aliasTopTours, tour.getAllTours);

router.route('/tour-stats').get(tour.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tour.getMonthlyClients
  );

// this is a geospatial query that will help up to find certain tour within a certain radius
router
  .route('/tours-within/:distance/center/:latlng/unit/:query')
  .get(tour.getTourWithin);
// tours-distance?distance=233&center=-48,45&unit=n1
// what we are using /tour-distance/233/center/-48,40/unit/n1

router.route('/distance/:latlng/unit/:unit').get(tour.getDistance);

router
  .route('/')
  .get(tour.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tour.createTour
  );

router
  .route('/:id')
  .get(tour.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tour.uploadTourImages,
    tour.resizeTourImages,
    tour.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tour.deleteTour
  );

module.exports = router;

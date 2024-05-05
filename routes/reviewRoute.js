const express = require('express');
const {
  createReview,
  getReview,
  getAllReview,
  updateReview,
  deleteReview,
  setTourUserIds
} = require('../controllers/reviewController');
const auth = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
router.use(auth.protect);

router.get('/:id', getReview);

// POST  /tour/2344/reviews
// GET /tour/2344/reviews
router
  .route('/')
  .get(getAllReview)
  .post(auth.protect, auth.restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(auth.restrictTo('user', 'admin'), updateReview)
  .delete(auth.restrictTo('user', 'admin'), deleteReview);
module.exports = router;

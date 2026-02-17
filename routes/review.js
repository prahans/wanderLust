const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/Listing.js");
const Review = require("../models/review.js");
const {isLoggedIn, isReviewAuthor} = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

//Post review Route
router.post("/",
   isLoggedIn,
   wrapAsync(reviewController.createReview)
  );

//Delete review Route
router.delete("/:reviewId",isLoggedIn, isReviewAuthor, wrapAsync (reviewController.destroyReview)
);

module.exports = router;
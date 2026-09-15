const Listing = require("./models/Listing.js");
const Review = require("./models/review.js");
const { listingSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const { cloudinary } = require("./cloudConfig.js");

module.exports.validateListing = async (req, res, next) => {
  const { error, value } = listingSchema.validate(req.body, { abortEarly: false });
  const messages = error ? error.details.map((detail) => detail.message) : [];
  if (req.method === "POST" && !req.file) {
    messages.push("Please upload a listing image.");
  }

  if (messages.length) {
    // Multer uploads before the multipart fields can be validated.
    if (req.file && req.file.filename) {
      const result = await cloudinary.uploader.destroy(req.file.filename, { invalidate: true });
      if (result.result !== "ok" && result.result !== "not found") {
        throw new ExpressError(502, "The listing is invalid and its uploaded photo could not be removed.");
      }
    }
    throw new ExpressError(400, messages.join(" "));
  }

  req.body = value;
  next();
};

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
    req.session.redirectUrl = req.originalUrl
    req.flash("error", "you must be logged in to create listing!");
    return res.redirect("/login");
  }
  next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
  if(req.session.redirectUrl){
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
}

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  if(!listing.owner._id.equals(res.locals.currUser._id)){
    req.flash("error", "You are not the owner of this listing");
    return res.redirect(`/listings/${id}`);
  }
  next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if(!review.author._id.equals(res.locals.currUser._id)){
    req.flash("error", "You are not the author of this review");
    return res.redirect(`/listings/${id}`);
  }
  next();
}

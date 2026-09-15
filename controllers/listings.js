const Listing = require("../models/Listing");
const { cloudinary } = require("../cloudConfig");
const ExpressError = require("../utils/ExpressError");
const LISTING_CATEGORIES = require("../utils/listingCategories");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find();
    res.render("listings/index.ejs", { allListings });
  }


module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs", { listingCategories: LISTING_CATEGORIES });
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id).populate({path: "reviews", populate: {path: "author"}}).populate("owner");
    if(!listing){
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
  }

module.exports.createListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  }

module.exports.renderEditForm  = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if(!listing){
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl, listingCategories: LISTING_CATEGORIES });
  }

module.exports.updateListing = async (req, res) => {
    if (!req.body) {
      throw new ExpressError(400, "Send  valid data for listing");
    }
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, {
      runValidators: true,
      new: true,
    });
    if (!listing) {
      throw new ExpressError(404, "Listing you requested for does not exist!");
    }

    if (typeof req.file !== "undefined") {
     if (listing.image && listing.image.filename) {
     await cloudinary.uploader.destroy(listing.image.filename);
    }
    let url = req.file.path;
    let filename = req.file.filename;

    listing.image = { url, filename };

   await listing.save();
  }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  }

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    if (listing.image && listing.image.filename) {
      // Keep the listing available to retry if Cloudinary cleanup fails.
      const result = await cloudinary.uploader.destroy(listing.image.filename, {
        invalidate: true,
      });
      if (result.result !== "ok" && result.result !== "not found") {
        throw new ExpressError(502, "Unable to delete listing photo. Please try again.");
      }
    }

    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
  }

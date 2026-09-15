const mongoose = require("mongoose");
const Review = require("./review.js");
const LISTING_CATEGORIES = require("../utils/listingCategories");

const Schema = mongoose.Schema;

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      url: { type: String, required: true },
      filename: String,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    categories: {
      type: [{ type: String, enum: LISTING_CATEGORIES }],
      required: true,
      validate: {
        validator: (categories) => Array.isArray(categories)
          && categories.length >= 1
          && categories.length <= 3
          && new Set(categories).size === categories.length,
        message: "Please select between 1 and 3 different categories.",
      },
    },

    isTrending: {
      type: Boolean,
      default: false,
    },

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({
      _id: {
        $in: listing.reviews,
      },
    });
  }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;

const mongoose = require("mongoose");
const Review = require("./review.js");

const Schema = mongoose.Schema;

const LISTING_CATEGORIES = [
  "Rooms",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Amazing Pools",
  "Camping",
  "Farms",
  "Arctic",
  "Boats",
  "Domes",
  "Villas",
  "Beachfront",
  "Cabins",
  "Tiny Homes",
];

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
      url: String,
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

    categories: [
      {
        type: String,
        enum: LISTING_CATEGORIES,
      },
    ],

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

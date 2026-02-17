const { ref } = require("joi");
const mongoose = require("mongoose");
const Review = require("./review.js");
const Schema = mongoose.Schema;

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image:{
   filename: {
    type: String,
    default: "listingimage",
   },
   url: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1649083048770-82e8ffd80431?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1974",
    },
  },
  price: Number,
  location: String,
  country: String,
  reviews:[
    {
      type: Schema.Types.ObjectId,
      ref: "Review"
    }
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if(listing){
    await Review.deleteMany({_id: {$in: listing.reviews}});
  }
})

const Listing = new mongoose.model("Listing", listingSchema);
module.exports = Listing;
// module.exports = mongoose.models.Listing || mongoose.model("Listing", listingSchema);

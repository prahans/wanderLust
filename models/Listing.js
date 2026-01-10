const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },

  image: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1649083048770-82e8ffd80431?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1974",
  },
  price: Number,
  location: String,
  country: String,
});

const Listing = new mongoose.model("Listing", listingSchema);
module.exports = Listing;

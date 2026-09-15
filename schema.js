const Joi = require("joi");
const LISTING_CATEGORIES = require("./utils/listingCategories");

module.exports.listingQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow("").default(""),
  category: Joi.string().trim().valid("Trending", ...LISTING_CATEGORIES).allow("").default(""),
}).unknown(true);

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    location: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    price: Joi.number().min(0).required(),
    categories: Joi.array()
      .items(Joi.string().valid(...LISTING_CATEGORIES))
      .min(1)
      .max(3)
      .unique()
      .required()
      .messages({
        "any.required": "Please select between 1 and 3 categories.",
        "array.min": "Please select between 1 and 3 categories.",
        "array.max": "Please select between 1 and 3 categories.",
        "array.unique": "Please select each category only once.",
      }),
    isTrending: Joi.forbidden().messages({
      "any.unknown": "Trending status is managed by the application.",
    }),
  }).required(),
}).required();

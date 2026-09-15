const assert = require("node:assert/strict");
const { test } = require("node:test");
const ejs = require("ejs");
const path = require("node:path");
const { listingSchema } = require("../schema");
const Listing = require("../models/Listing");
const listingCategories = require("../utils/listingCategories");

const fields = {
  title: "Himalayan Mountain Cabin",
  description: "A quiet cabin with mountain views.",
  location: "Pokhara",
  country: "Nepal",
  price: 1200,
  categories: ["Mountains", "Cabins"],
};
const storedFields = {
  owner: "699425d34cb3d8f78eb993f6",
  image: { url: "https://example.com/photo.jpg", filename: "test-photo" },
};

test("Joi accepts 1 to 3 categories and normalizes form text and price", () => {
  for (const count of [1, 2, 3]) {
    const { error, value } = listingSchema.validate({ listing: {
      ...fields, title: "  Cabin  ", price: "0", categories: listingCategories.slice(0, count),
    } });
    assert.equal(error, undefined);
    assert.equal(value.listing.title, "Cabin");
    assert.equal(value.listing.price, 0);
  }
});

test("Joi and Mongoose reject missing, excessive, unknown, and duplicate categories", () => {
  for (const categories of [undefined, null, [], listingCategories.slice(0, 4), ["Unknown"], ["Cabins", "Cabins"]]) {
    const listing = { ...fields, categories };
    assert.ok(listingSchema.validate({ listing }).error, JSON.stringify(categories));
    assert.ok(new Listing({ ...listing, ...storedFields }).validateSync(), JSON.stringify(categories));
  }
});

test("Joi rejects incomplete bodies, blank required fields, and invalid prices", () => {
  for (const body of [undefined, {}, { listing: {} }]) {
    assert.ok(listingSchema.validate(body).error);
  }
  for (const field of ["title", "description", "location", "country", "price"]) {
    for (const value of [undefined, "", "   "]) {
      assert.ok(listingSchema.validate({ listing: { ...fields, [field]: value } }).error);
    }
  }
  for (const price of [-1, "free", Infinity]) {
    assert.ok(listingSchema.validate({ listing: { ...fields, price } }).error);
  }
});

test("owners cannot submit trending status, ownership, reviews, or image IDs", () => {
  for (const extra of [{ isTrending: true }, { isTrending: false }, { owner: "someone" }, { reviews: [] }, { image: storedFields.image }]) {
    assert.ok(listingSchema.validate({ listing: { ...fields, ...extra } }).error);
  }
  assert.equal(new Listing({ ...fields, ...storedFields }).isTrending, false);
});

test("Mongoose requires a photo URL and accepts valid listing data", () => {
  assert.ok(new Listing({ ...fields, owner: storedFields.owner }).validateSync());
  assert.equal(new Listing({ ...fields, ...storedFields }).validateSync(), undefined);
});

test("new and edit forms render the shared categories and preserve edit values", async () => {
  const listing = { ...fields, ...storedFields, _id: "test-listing" };
  for (const form of ["new", "edit"]) {
    const html = await ejs.renderFile(path.join(__dirname, `../views/listings/${form}.ejs`), {
      layout() {}, listingCategories, listing, originalImageUrl: storedFields.image.url,
    });
    const checkboxes = html.match(/<input\s+class="form-check-input category-checkbox"[\s\S]*?\/>/g);
    assert.equal(checkboxes.length, listingCategories.length);
    assert.equal(checkboxes.filter((input) => /\bchecked\b/.test(input)).length, form === "edit" ? 2 : 0);
    assert.ok(checkboxes.every((input) => !/\brequired\b/.test(input)));
    if (form === "edit") {
      assert.match(html, /required>A quiet cabin with mountain views\.<\/textarea>/);
      assert.match(html, /value="Nepal" name="listing\[country\]"/);
      assert.match(html, /value="Pokhara" name="listing\[location\]"/);
    }
  }
});

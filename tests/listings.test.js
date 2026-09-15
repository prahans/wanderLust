const assert = require("node:assert/strict");
const { test } = require("node:test");
const Listing = require("../models/Listing");
const { cloudinary } = require("../cloudConfig");
const { destroyListing } = require("../controllers/listings");

function setup(t, listing = { image: { filename: "wanderlust_DEV/test-photo" } }) {
  const req = { params: { id: "test-listing" }, flash: t.mock.fn() };
  const res = { redirect: t.mock.fn() };
  t.mock.method(Listing, "findById", async () => listing);
  const deleteListing = t.mock.method(Listing, "findByIdAndDelete", async () => listing);
  const destroyImage = t.mock.method(cloudinary.uploader, "destroy", async () => ({ result: "ok" }));
  return { req, res, deleteListing, destroyImage };
}

test("deletes the stored Cloudinary photo before the listing and confirms success", async (t) => {
  const { req, res, deleteListing, destroyImage } = setup(t);
  let finishCleanup;
  destroyImage.mock.mockImplementation(() => new Promise((resolve) => {
    finishCleanup = resolve;
  }));

  const deletion = destroyListing(req, res);
  await Promise.resolve();

  assert.deepEqual(destroyImage.mock.calls[0].arguments, [
    "wanderlust_DEV/test-photo", { invalidate: true },
  ]);
  assert.equal(deleteListing.mock.callCount(), 0);
  assert.equal(req.flash.mock.callCount(), 0);

  finishCleanup({ result: "ok" });
  await deletion;

  assert.deepEqual(deleteListing.mock.calls[0].arguments, ["test-listing"]);
  assert.deepEqual(req.flash.mock.calls[0].arguments, ["success", "Listing Deleted!"]);
  assert.deepEqual(res.redirect.mock.calls[0].arguments, ["/listings"]);
});

test("allows deletion when the photo was already removed from Cloudinary", async (t) => {
  const { req, res, deleteListing, destroyImage } = setup(t);
  destroyImage.mock.mockImplementation(async () => ({ result: "not found" }));

  await destroyListing(req, res);

  assert.equal(deleteListing.mock.callCount(), 1);
  assert.deepEqual(req.flash.mock.calls[0].arguments, ["success", "Listing Deleted!"]);
});

for (const image of [undefined, { url: "https://example.com/photo.jpg" }, { filename: "" }]) {
  test(`deletes a listing without a stored Cloudinary ID: ${JSON.stringify(image)}`, async (t) => {
    const { req, res, deleteListing, destroyImage } = setup(t, { image });

    await destroyListing(req, res);

    assert.equal(destroyImage.mock.callCount(), 0);
    assert.equal(deleteListing.mock.callCount(), 1);
  });
}

test("keeps the listing and propagates Cloudinary errors without reporting success", async (t) => {
  const { req, res, deleteListing, destroyImage } = setup(t);
  const error = new Error("Cloudinary unavailable");
  destroyImage.mock.mockImplementation(async () => { throw error; });

  await assert.rejects(destroyListing(req, res), error);

  assert.equal(deleteListing.mock.callCount(), 0);
  assert.equal(req.flash.mock.callCount(), 0);
  assert.equal(res.redirect.mock.callCount(), 0);
});

test("keeps the listing when Cloudinary does not confirm photo deletion", async (t) => {
  const { req, res, deleteListing, destroyImage } = setup(t);
  destroyImage.mock.mockImplementation(async () => ({ result: "failed" }));

  await assert.rejects(destroyListing(req, res), { statusCode: 502 });

  assert.equal(deleteListing.mock.callCount(), 0);
  assert.equal(req.flash.mock.callCount(), 0);
  assert.equal(res.redirect.mock.callCount(), 0);
});

test("handles a missing listing without deleting an image or reporting success", async (t) => {
  const { req, res, deleteListing, destroyImage } = setup(t, null);

  await destroyListing(req, res);

  assert.equal(destroyImage.mock.callCount(), 0);
  assert.equal(deleteListing.mock.callCount(), 0);
  assert.deepEqual(req.flash.mock.calls[0].arguments, [
    "error", "Listing you requested for does not exist!",
  ]);
  assert.deepEqual(res.redirect.mock.calls[0].arguments, ["/listings"]);
});

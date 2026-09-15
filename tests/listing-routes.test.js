const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const express = require("express");
const Listing = require("../models/Listing");
const { cloudinary, storage } = require("../cloudConfig");
const listingRouter = require("../routes/listing");

const owner = "699425d34cb3d8f78eb993f6";
const listingId = "699425d34cb3d8f78eb993f7";
const uploadedImage = { path: "https://example.com/new-photo.jpg", filename: "wanderlust_DEV/new-photo" };
const existingImage = { url: "https://example.com/old-photo.jpg", filename: "wanderlust_DEV/old-photo" };
const fields = {
  title: "  Mountain Cabin  ", description: "A quiet mountain cabin.",
  location: "Pokhara", country: "Nepal", price: "1200", categories: ["Mountains", "Cabins"],
};

test("listing routes validate real multipart forms before saving", async (t) => {
  const app = express();
  app.use((req, res, next) => {
    req.isAuthenticated = () => true;
    req.user = { _id: owner };
    req.flash = () => {};
    res.locals.currUser = req.user;
    next();
  });
  app.use("/listings", listingRouter);
  app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ message: err.message }));
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}/listings`;

  const cases = [
    { name: "creates a listing with one category", method: "POST", fields: { categories: ["Cabins"] }, file: true, status: 302 },
    { name: "edits legacy categories while keeping the existing photo and trending status", method: "PUT", status: 302 },
    { name: "edits categories with a replacement photo", method: "PUT", file: true, status: 302 },
    { name: "requires a photo when creating", method: "POST", status: 400, error: /upload a listing image/ },
    { name: "cleans up an upload when categories are missing", method: "POST", fields: { categories: undefined }, file: true, status: 400, error: /1 and 3 categories/ },
    { name: "rejects four categories during edit", method: "PUT", fields: { categories: ["Cabins", "Mountains", "Rooms", "Villas"] }, status: 400, error: /1 and 3 categories/ },
    { name: "rejects forged trending status and cleans up only the new photo", method: "PUT", fields: { isTrending: "true" }, file: true, status: 400, error: /Trending status/ },
    { name: "rejects negative prices", method: "POST", fields: { price: "-1" }, file: true, status: 400, error: /price/ },
    { name: "rejects unknown categories", method: "PUT", fields: { categories: ["Unknown"] }, status: 400, error: /categories/ },
    { name: "does not save if rejected-upload cleanup fails", method: "POST", fields: { categories: undefined }, file: true, cleanupFails: true, status: 502, error: /photo could not be removed/ },
  ];

  for (const scenario of cases) {
    await t.test(scenario.name, async (t) => {
      const currentListing = new Listing({ ...fields, _id: listingId, owner, image: existingImage, categories: [], isTrending: true });
      t.mock.method(Listing, "findById", async () => currentListing);
      const save = t.mock.method(Listing.prototype, "save", async function () {
        await this.validate();
        return this;
      });
      const update = t.mock.method(Listing, "findByIdAndUpdate", async (id, values, options) => {
        assert.equal(id, listingId);
        assert.equal(options.runValidators, true);
        assert.equal(options.new, true);
        const updated = new Listing({ ...currentListing.toObject(), ...values });
        await updated.validate();
        return updated;
      });
      t.mock.method(storage, "_handleFile", (req, file, callback) => {
        file.stream.on("end", () => callback(null, uploadedImage));
        file.stream.resume();
      });
      const destroy = t.mock.method(cloudinary.uploader, "destroy", async () => ({ result: scenario.cleanupFails ? "failed" : "ok" }));

      const body = new FormData();
      for (const [key, value] of Object.entries({ ...fields, ...scenario.fields })) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          value.forEach((category) => body.append(`listing[${key}][]`, category));
        } else {
          body.append(`listing[${key}]`, value);
        }
      }
      if (scenario.file) body.append("listing[image]", new Blob(["test image"], { type: "image/png" }), "photo.png");

      const response = await fetch(scenario.method === "PUT" ? `${baseUrl}/${listingId}` : baseUrl, {
        method: scenario.method, body, redirect: "manual",
      });
      const responseText = await response.text();
      assert.equal(response.status, scenario.status, responseText);

      if (scenario.status >= 400) {
        assert.match(responseText, scenario.error);
        assert.equal(save.mock.callCount(), 0);
        assert.equal(update.mock.callCount(), 0);
        assert.equal(destroy.mock.callCount(), scenario.file ? 1 : 0);
        if (scenario.file) assert.deepEqual(destroy.mock.calls[0].arguments, [uploadedImage.filename, { invalidate: true }]);
      } else if (scenario.method === "POST") {
        assert.equal(save.mock.callCount(), 1);
        const saved = save.mock.calls[0].this;
        assert.equal(saved.title, "Mountain Cabin");
        assert.equal(saved.price, 1200);
        assert.deepEqual(Array.from(saved.categories), ["Cabins"]);
        assert.equal(saved.owner.toString(), owner);
        assert.equal(saved.isTrending, false);
        assert.equal(saved.image.filename, uploadedImage.filename);
        assert.equal(destroy.mock.callCount(), 0);
      } else {
        assert.equal(update.mock.callCount(), 1);
        const updated = await update.mock.calls[0].result;
        assert.deepEqual(Array.from(updated.categories), fields.categories);
        assert.equal(updated.isTrending, true);
        assert.equal(updated.image.filename, scenario.file ? uploadedImage.filename : existingImage.filename);
        assert.equal(save.mock.callCount(), scenario.file ? 1 : 0);
        assert.equal(destroy.mock.callCount(), scenario.file ? 1 : 0);
        if (scenario.file) assert.equal(destroy.mock.calls[0].arguments[0], existingImage.filename);
      }
    });
  }
});

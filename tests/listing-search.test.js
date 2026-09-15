const assert = require("node:assert/strict");
const { once } = require("node:events");
const path = require("node:path");
const { test } = require("node:test");
const express = require("express");
const ejs = require("ejs");
const Listing = require("../models/Listing");
const { index } = require("../controllers/listings");
const listingCategories = require("../utils/listingCategories");
const listingRouter = require("../routes/listing");

const queryCases = [
  { name: "unfiltered browsing", query: {}, filter: {} },
  { name: "blank search", query: { search: "   ", category: "" }, filter: {} },
  { name: "partial name search", query: { search: "  cAbIn  " }, filter: { title: { $regex: "cAbIn", $options: "i" } } },
  { name: "category selection", query: { category: "Cabins" }, filter: { categories: "Cabins" } },
  { name: "trending selection", query: { category: "Trending" }, filter: { isTrending: true } },
  { name: "name and category together", query: { search: "Cabin", category: "Mountains" }, filter: { title: { $regex: "Cabin", $options: "i" }, categories: "Mountains" } },
  { name: "name and trending together", query: { search: "Cabin", category: "Trending" }, filter: { title: { $regex: "Cabin", $options: "i" }, isTrending: true } },
];

for (const scenario of queryCases) {
  test(`listing search supports ${scenario.name}`, async (t) => {
    const listings = [{ title: "Mountain Cabin" }];
    const find = t.mock.method(Listing, "find", async () => listings);
    const res = { render: t.mock.fn() };
    await index({ query: scenario.query }, res);
    assert.deepEqual(find.mock.calls[0].arguments, [scenario.filter]);
    const [template, locals] = res.render.mock.calls[0].arguments;
    assert.equal(template, "listings/index.ejs");
    assert.equal(locals.allListings, listings);
    assert.equal(locals.searchTerm, (scenario.query.search || "").trim());
    assert.equal(locals.selectedCategory, scenario.query.category || "");
    assert.deepEqual(locals.listingCategories, listingCategories);
  });
}

test("all supported categories can be used as filters", async (t) => {
  const find = t.mock.method(Listing, "find", async () => []);
  for (const category of listingCategories) {
    await index({ query: { category } }, { render() {} });
    assert.deepEqual(find.mock.calls.at(-1).arguments, [{ categories: category }]);
  }
});

test("search treats regex punctuation literally and ignores capitalization", async (t) => {
  const find = t.mock.method(Listing, "find", async () => []);
  const search = "Cabin (A+B) [1].*?^${}|\\";
  await index({ query: { search } }, { render() {} });
  const { title } = find.mock.calls[0].arguments[0];
  const matcher = new RegExp(title.$regex, title.$options);
  assert.equal(matcher.test(`The ${search.toLowerCase()} by the lake`), true);
  assert.equal(matcher.test("An unrelated cabin"), false);
});

test("invalid query values never reach the database", async (t) => {
  const find = t.mock.method(Listing, "find", async () => []);
  for (const query of [
    { category: "Unknown" }, { category: ["Cabins", "Villas"] },
    { search: ["Cabin", "Villa"] }, { search: { $ne: "" } },
    { category: { $ne: "" } }, { search: "a".repeat(201) },
  ]) {
    await assert.rejects(index({ query }, { render() {} }), { statusCode: 400 });
  }
  assert.equal(find.mock.callCount(), 0);
});

test("search and category controls work through the listing route and full layout", async (t) => {
  let listings = [{ _id: "cabin-id", title: "Himalayan Cabin", image: { url: "https://example.com/cabin.jpg" }, price: 1200 }];
  const find = t.mock.method(Listing, "find", async () => listings);
  const app = express();
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "ejs");
  app.engine("ejs", require("ejs-mate"));
  app.use((req, res, next) => {
    Object.assign(res.locals, { currUser: null, success: [], error: [] });
    next();
  });
  app.use("/listings", listingRouter);
  app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ message: err.message }));
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const response = await fetch(`${baseUrl}/listings?search=Cabin&category=Mountains`);
  const html = await response.text();
  assert.equal(response.status, 200, html);
  assert.match(html, /Himalayan Cabin/);
  assert.match(html, /role="search" action="\/listings" method="get"/);
  assert.match(html, /name="search"[\s\S]*?value="Cabin"/);
  assert.match(html, /type="hidden" name="category" value="Mountains"/);
  assert.match(html, /class="filter active"\s+href="\/listings\?search=Cabin&amp;category=Mountains"\s+aria-current="page"/);

  const links = html.match(/<a class="filter(?: active)?"[\s\S]*?<\/a>/g);
  assert.equal(links.length, listingCategories.length + 2);
  for (const link of links) {
    const href = link.match(/href="([^"]+)"/)[1].replaceAll("&amp;", "&");
    const url = new URL(href, baseUrl);
    assert.equal(url.searchParams.get("search"), "Cabin");
  }

  // Following All clears the category while retaining the current name search.
  const allHref = links[0].match(/href="([^"]+)"/)[1];
  const allResponse = await fetch(new URL(allHref, baseUrl));
  const allHtml = await allResponse.text();
  assert.equal(allResponse.status, 200);
  assert.deepEqual(find.mock.calls.at(-1).arguments, [{ title: { $regex: "Cabin", $options: "i" } }]);
  assert.doesNotMatch(allHtml, /type="hidden" name="category"/);

  // Following Clear filters restores the full listing query.
  const clearHref = html.match(/href="([^"]+)" class="clear-filters"/)[1];
  const clearResponse = await fetch(new URL(clearHref, baseUrl));
  await clearResponse.text();
  assert.equal(clearResponse.status, 200);
  assert.deepEqual(find.mock.calls.at(-1).arguments, [{}]);

  listings = [];
  const emptyResponse = await fetch(`${baseUrl}/listings?search=Nonexistent&category=Cabins`);
  const emptyHtml = await emptyResponse.text();
  assert.equal(emptyResponse.status, 200);
  assert.match(emptyHtml, /No listings found/);
  assert.match(emptyHtml, /Try a different listing name or category/);
  assert.doesNotMatch(emptyHtml, /class="listing-link"/);

  const escapedResponse = await fetch(`${baseUrl}/listings?search=${encodeURIComponent('<script>alert("x")</script>')}`);
  const escapedHtml = await escapedResponse.text();
  assert.equal(escapedResponse.status, 200);
  assert.doesNotMatch(escapedHtml, /<script>alert/);
  assert.match(escapedHtml, /&lt;script&gt;/);

  const invalidResponse = await fetch(`${baseUrl}/listings?category=Unknown`);
  await invalidResponse.text();
  assert.equal(invalidResponse.status, 400);
});

test("navbar search also renders on pages with no filter state", async () => {
  const html = await ejs.renderFile(path.join(__dirname, "../views/includes/navbar.ejs"), { currUser: null });
  assert.match(html, /role="search" action="\/listings" method="get"/);
  assert.match(html, /name="search"[\s\S]*?value=""/);
  assert.doesNotMatch(html, /type="hidden" name="category"/);
});

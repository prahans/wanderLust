const assert = require("node:assert/strict");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ejs = require("ejs");
const listingCategories = require("../utils/listingCategories");

async function renderTaxToggle(basePrices, checked = false) {
  const html = await ejs.renderFile(path.join(__dirname, "../views/listings/index.ejs"), {
    layout() {}, listingCategories, searchTerm: "", selectedCategory: "",
    allListings: basePrices.map((price, index) => ({
      _id: `listing-${index}`, title: "Test listing", price,
      image: { url: "https://example.com/photo.jpg" },
    })),
  });
  const prices = Array.from(html.matchAll(/data-base-price="([^"]+)"/g), (match) => ({
    dataset: { basePrice: match[1] }, textContent: "",
  }));
  const labels = prices.map(() => ({ hidden: true }));
  const toggle = { checked, addEventListener(event, handler) { this[event] = handler; } };
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, {
    Intl,
    document: {
      getElementById: () => toggle,
      querySelectorAll: () => prices,
      getElementsByClassName: () => labels,
    },
  });
  return { toggle, prices, labels };
}

test("tax toggle displays rounded totals and restores base prices without accumulating tax", async () => {
  const { toggle, prices, labels } = await renderTaxToggle([1200, 99.99, 0, 123456]);
  const baseDisplay = ["1,200", "99.99", "0", "1,23,456"];
  const totalDisplay = ["1,416", "117.99", "0", "1,45,678.08"];
  assert.deepEqual(prices.map((price) => price.textContent), baseDisplay);
  assert.ok(labels.every((label) => label.hidden));

  for (let cycle = 0; cycle < 2; cycle++) {
    toggle.checked = true;
    toggle.change();
    assert.deepEqual(prices.map((price) => price.textContent), totalDisplay);
    assert.ok(labels.every((label) => !label.hidden));

    toggle.checked = false;
    toggle.change();
    assert.deepEqual(prices.map((price) => price.textContent), baseDisplay);
    assert.ok(labels.every((label) => label.hidden));
  }
});

test("tax display handles restored switch state and an empty result list", async () => {
  const restored = await renderTaxToggle([1200], true);
  assert.equal(restored.prices[0].textContent, "1,416");
  assert.equal(restored.labels[0].hidden, false);

  const empty = await renderTaxToggle([]);
  empty.toggle.checked = true;
  assert.doesNotThrow(() => empty.toggle.change());
});

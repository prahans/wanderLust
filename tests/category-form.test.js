const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const script = readFileSync(path.join(__dirname, "../public/js/script.js"), "utf8");

function formHarness({ categories = true, fieldsValid = true } = {}) {
  const group = { setAttribute() {} };
  const error = { hidden: true };
  const checkboxes = Array.from({ length: 14 }, () => ({
    checked: false,
    validity: "",
    addEventListener(name, listener) { this[name] = listener; },
    setCustomValidity(message) { this.validity = message; },
    focus() {},
  }));
  const form = {
    querySelector(selector) { return categories ? (selector === "[data-category-group]" ? group : error) : null; },
    querySelectorAll() { return categories ? checkboxes : []; },
    checkValidity() { return fieldsValid && checkboxes.every((checkbox) => !checkbox.validity); },
    addEventListener(name, listener) { this[name] = listener; },
    classList: { add() {} },
  };
  vm.runInNewContext(script, { document: { querySelectorAll: () => [form] } });
  return {
    checkboxes, error,
    submit() {
      const event = { prevented: false, preventDefault() { this.prevented = true; }, stopPropagation() {} };
      form.submit(event);
      return event.prevented;
    },
  };
}

test("category group blocks zero or four selections and accepts any one to three", () => {
  for (const count of [0, 1, 2, 3, 4]) {
    const form = formHarness();
    // Choose categories at the end of the list, leaving the first unchecked.
    if (count) form.checkboxes.slice(-count).forEach((checkbox) => { checkbox.checked = true; });
    const invalid = count === 0 || count === 4;
    assert.equal(form.submit(), invalid);
    assert.equal(form.error.hidden, !invalid);
  }
});

test("category feedback clears as soon as the selection is corrected", () => {
  const form = formHarness();
  assert.equal(form.submit(), true);
  form.checkboxes[5].checked = true;
  form.checkboxes[5].change();
  assert.equal(form.error.hidden, true);
  assert.equal(form.submit(), false);
  form.checkboxes[5].checked = false;
  form.checkboxes[5].change();
  assert.equal(form.error.hidden, false);
  assert.equal(form.submit(), true);
});

test("normal field validation still applies to listing and other forms", () => {
  const listing = formHarness({ fieldsValid: false });
  listing.checkboxes[5].checked = true;
  assert.equal(listing.submit(), true);
  assert.equal(formHarness({ categories: false, fieldsValid: false }).submit(), true);
  assert.equal(formHarness({ categories: false }).submit(), false);
});

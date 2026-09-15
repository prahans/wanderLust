// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    const categoryGroup = form.querySelector("[data-category-group]");
    const categoryCheckboxes = Array.from(form.querySelectorAll(".category-checkbox"));
    const categoryError = form.querySelector("[data-category-error]");

    function validateCategories() {
      if (!categoryGroup) return true;

      const count = categoryCheckboxes.filter((checkbox) => checkbox.checked).length;
      const valid = count >= 1 && count <= 3;
      categoryError.hidden = valid;
      categoryGroup.setAttribute("aria-invalid", String(!valid));
      // The validity belongs to the whole group; no specific category is required.
      categoryCheckboxes[0].setCustomValidity(
        valid ? "" : "Please select between 1 and 3 categories."
      );
      return valid;
    }

    categoryCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", validateCategories);
    });

    form.addEventListener(
      "submit",
      (event) => {
        const categoriesValid = validateCategories();
        if (!form.checkValidity() || !categoriesValid) {
          event.preventDefault();
          event.stopPropagation();
          if (!categoriesValid) categoryCheckboxes[0].focus();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();

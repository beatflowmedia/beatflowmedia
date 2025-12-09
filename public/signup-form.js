// signup-form.js

// A minimal list of countries – replace or extend as needed
const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany",
  "France", "Spain", "Italy", "Netherlands", "Brazil", "India", "Japan"
];

document.addEventListener("DOMContentLoaded", () => {
  // Only run if this is injected into a dedicated signup root
  const container = document.getElementById('signup-root');
  if (!container) return;
  // 1) Create the <form> and container
  const form = document.createElement("form");
  form.id = "signup-form";
  form.style.maxWidth = "400px";
  form.style.margin = "0 auto";
  form.style.display = "grid";
  form.style.gap = "1rem";

  // Helper to create labeled inputs
  function makeField({ labelText, inputType = "text", name, required = false, placeholder = "", extraAttrs = {} }) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";

    const label = document.createElement("label");
    label.textContent = labelText;
    label.htmlFor = name;
    wrapper.append(label);

    let input;
    if (inputType === "select") {
      input = document.createElement("select");
    } else {
      input = document.createElement("input");
      input.type = inputType;
      input.placeholder = placeholder;
    }
    input.name = name;
    input.id = name;
    if (required) input.required = true;
    Object.entries(extraAttrs).forEach(([k, v]) => input.setAttribute(k, v));
    wrapper.append(input);
    return { wrapper, input };
  }

  // Business type (dropdown)
  const types = ["Brand", "Agency", "Small Business", "Other"];
  const { wrapper: typeW, input: typeInput } = makeField({
    labelText: "Business type",
    inputType: "select",
    name: "businessType",
    required: true
  });
  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeInput.append(opt);
  });
  form.append(typeW);

  // Business name
  form.append(makeField({
    labelText: "Business name",
    name: "businessName",
    required: true,
    placeholder: "Acme Corp"
  }).wrapper);

  // Business email
  form.append(makeField({
    labelText: "Business email",
    inputType: "email",
    name: "businessEmail",
    required: true,
    placeholder: "you@business.com"
  }).wrapper);

  // Business website (optional)
  form.append(makeField({
    labelText: "Business website (Optional)",
    inputType: "url",
    name: "businessWebsite",
    placeholder: "https://www.yoursite.com"
  }).wrapper);

  // Country or region with autocomplete via <datalist>
  const { wrapper: countryW, input: countryInput } = makeField({
    labelText: "Country or region",
    name: "country",
    required: true,
    placeholder: "Start typing..."
  });
  const dl = document.createElement("datalist");
  dl.id = "countries-list";
  COUNTRIES.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    dl.append(opt);
  });
  countryInput.setAttribute("list", dl.id);
  countryW.append(dl);
  form.append(countryW);

  // Checkbox: receive news
  const newsWrapper = document.createElement("div");
  const newsInput = document.createElement("input");
  newsInput.type = "checkbox";
  newsInput.id = "receiveNews";
  newsInput.name = "receiveNews";
  const newsLabel = document.createElement("label");
  newsLabel.htmlFor = newsInput.id;
  newsLabel.textContent = "I want to receive news and promotions from BeatFlow Ads Manager";
  newsWrapper.append(newsInput, newsLabel);
  form.append(newsWrapper);

  // Checkbox: agree to terms
  const termsWrapper = document.createElement("div");
  const termsInput = document.createElement("input");
  termsInput.type = "checkbox";
  termsInput.id = "agreeTerms";
  termsInput.name = "agreeTerms";
  termsInput.required = true;
  const termsLabel = document.createElement("label");
  termsLabel.htmlFor = termsInput.id;
  termsLabel.innerHTML = `On behalf of the business named above, I agree to the <a href="#" target="_blank">Master Advertising Terms & Conditions</a>`;
  termsWrapper.append(termsInput, termsLabel);
  form.append(termsWrapper);

  // Submit button
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Finish";
  submit.style.padding = "0.75rem";
  submit.style.backgroundColor = "#1DB954";
  submit.style.color = "#fff";
  submit.style.border = "none";
  submit.style.cursor = "pointer";
  form.append(submit);

  // 2) Handle form submission
  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = new FormData(form);
    // Basic validation demonstration
    if (!data.get("agreeTerms")) {
      alert("You must agree to the terms and conditions.");
      return;
    }
    // Here you’d normally POST to your server…
    const payload = Object.fromEntries(data.entries());
    console.log("Submitting sign-up:", payload);
    alert("Thanks! Your info has been submitted.");
    form.reset();
  });

  // 3) Insert into the page (hidden by default until 'Create an ad' is clicked)
  // Default visible on standalone page
  form.style.display = 'grid';
  container.append(form);

});

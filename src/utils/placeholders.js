// src/utils/placeholders.js
//
// The canonical placeholder for this app. Data URIs, not paths under public/,
// because a placeholder must not share a failure domain with the image it is
// standing in for: a /default-*.jpg is fetched over the same network that just
// failed, and when it 404s the browser renders the alt text instead. These cannot
// fail -- there is no request to fail.
//
// Fully percent-encoded via encodeURIComponent so the result is safe in every
// context it is used in: an <img src>, a CSS background-image: url(...) -- where a
// raw quote or space would terminate the token -- and an inline style string.
//
// CommonJS, like pricing.js and artwork.js, so these utilities are testable with
// plain jest and requireable by tooling outside the bundler. Webpack resolves named
// imports from CommonJS, so `import { getPlaceholderImage } from '../utils/placeholders'`
// keeps working unchanged in every component.

const svg = (width, height, text) =>
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
    '<rect width="' + width + '" height="' + height + '" fill="#333"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
          'font-family="sans-serif" font-size="24" fill="#888">' + text + '</text>' +
  '</svg>';

const getPlaceholderImage = (width = 300, height = 300, text = 'No Image') =>
  'data:image/svg+xml,' + encodeURIComponent(svg(width, height, text));

const PLACEHOLDER_IMAGE = getPlaceholderImage();

module.exports = {
  getPlaceholderImage,
  PLACEHOLDER_IMAGE
};

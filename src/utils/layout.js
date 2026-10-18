// src/utils/layout.js
//
// Layout constants shared across pages. Small on purpose.
//
// WHY THIS EXISTS — A BUG THAT LOOKED LIKE A STYLE CHOICE
// Three card grids were written as:
//
//     <Grid container spacing={'clamp(2rem, calc(1.5rem + 3vw), 4rem)'}>
//
// MUI's `spacing` is a THEME MULTIPLIER, not a CSS length. It expects 2 (meaning
// 2 × 8px), a responsive object, or an array. Handed a `clamp()` string it produces
// NO SPACING AT ALL -- not a fallback, not the default, nothing: the container gets
// `margin-top: 0` and every item gets `padding-top: 0`.
//
// So the rows touched. Measured on production before the fix:
//
//     "Recently Released Albums"   gap = 0px     container mt=0px, item pt=0px
//     the grid below it            gap = 16px    container mt=-16px, item pt=16px   (spacing={2})
//
// The second one is what a WORKING MUI grid looks like, and the contrast is the tell.
// It is a silent failure in the worst way: the code reads as though it is doing
// careful fluid spacing, the intent is legible, and the rendered result is zero.
//
// WHY A RESPONSIVE OBJECT RATHER THAN RESTORING THE clamp()
// MUI cannot take a clamp() here, so keeping the fluid curve would mean dropping
// `Grid` for a raw CSS grid with `gap` -- a refactor of three working layouts to
// recover spacing nobody has ever seen rendered. `{ xs: 2, sm: 3 }` is valid MUI,
// is mobile-first (the base rule IS the small screen, scaled UP), and matches the
// grids already rendering correctly on the same page at spacing={2} and {3}.
//
// ONE VALUE FOR ALL CARD GRIDS, and that is a decision rather than an accident. The
// three originals asked for two different curves -- 0.5-2rem for Featured Artists,
// 2-4rem for the other two -- but since NONE of them ever rendered, there is no
// existing look to preserve. Card rows on one page separating by the same amount is
// the better outcome, and one constant cannot drift the way three literals did.

/**
 * Vertical and horizontal gap between cards in a responsive card grid.
 *
 * Pass straight to a MUI `<Grid container spacing={CARD_GRID_SPACING}>`.
 * 16px on a phone, 24px from the small breakpoint up.
 */
const CARD_GRID_SPACING = { xs: 2, sm: 3 };

module.exports = { CARD_GRID_SPACING };

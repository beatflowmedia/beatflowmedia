# Accessibility Fixes Guide

## Overview
This document outlines accessibility issues found in the Lighthouse audit and how to fix them.

## Issues Identified

### 1. Buttons Without Accessible Names
**Problem:** Some buttons don't have accessible text for screen readers.

**Solution:** Ensure all buttons have one of the following:
- Text content
- `aria-label` attribute
- `aria-labelledby` attribute pointing to a label element

**Example:**
```jsx
// ❌ Bad
<button onClick={handleClick}>
  <FaIcon />
</button>

// ✅ Good
<button onClick={handleClick} aria-label="Play song">
  <FaPlay />
</button>
```

**Files to Check:**
- Icon-only buttons in NavBar.js
- Play/pause buttons in MiniPlayer.js
- Control buttons in NowPlayingBar.js

### 2. Form Elements Without Associated Labels
**Problem:** Input fields lack proper label associations.

**Solution:**
```jsx
// ❌ Bad
<input type="text" placeholder="Search..." />

// ✅ Good - Method 1: Wrapping label
<label>
  Search for songs
  <input type="text" placeholder="Search..." />
</label>

// ✅ Good - Method 2: ID association
<label htmlFor="search-input">Search for songs</label>
<input id="search-input" type="text" placeholder="Search..." />

// ✅ Good - Method 3: aria-label (when visual label not needed)
<input
  type="text"
  placeholder="Search..."
  aria-label="Search for songs, artists, or albums"
/>
```

**Files to Check:**
- Search inputs in NavBar.js
- Upload forms in ForArtists.js
- Filter inputs in admin components

### 3. Links Without Discernible Names
**Problem:** Links (especially icon links) lack accessible names.

**Solution:**
```jsx
// ❌ Bad
<Link to="/profile">
  <FaUser />
</Link>

// ✅ Good
<Link to="/profile" aria-label="Go to profile">
  <FaUser />
  <span className="sr-only">Profile</span>
</Link>
```

### 4. Heading Elements Not in Sequential Order
**Problem:** Heading hierarchy is broken (e.g., h1 → h3, skipping h2).

**Solution:**
- Always use headings in sequential order: h1 → h2 → h3 → h4
- Only one h1 per page
- Don't skip levels

```jsx
// ❌ Bad
<h1>My Page</h1>
<h3>Section Title</h3>

// ✅ Good
<h1>My Page</h1>
<h2>Section Title</h2>
<h3>Subsection</h3>
```

## Screen Reader Only Text
Add this CSS class for visually hidden but screen-reader-accessible text:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## ARIA Roles and States
Use appropriate ARIA attributes:

```jsx
// Navigation
<nav role="navigation" aria-label="Main navigation">
  {/* nav items */}
</nav>

// Search
<form role="search" aria-label="Site search">
  {/* search input */}
</form>

// Buttons with state
<button
  aria-pressed={isActive}
  aria-label="Toggle shuffle mode"
>
  <FaRandom />
</button>

// Expandable sections
<button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
>
  Menu
</button>
<div id="dropdown-menu" hidden={!isOpen}>
  {/* menu items */}
</div>
```

## Keyboard Navigation
Ensure all interactive elements are keyboard accessible:

1. **Tab Order**: Use `tabIndex` appropriately
   - `tabIndex={0}`: Add to tab order
   - `tabIndex={-1}`: Remove from tab order but allow programmatic focus

2. **Keyboard Shortcuts**: Document and implement
   - Space/Enter: Activate buttons
   - Escape: Close modals
   - Arrow keys: Navigate lists

3. **Focus Management**:
   - Visible focus indicators (already handled by Tailwind's `focus:ring`)
   - Trap focus in modals
   - Return focus after modal closes

## Testing Checklist

- [ ] All buttons have accessible names
- [ ] All form inputs have labels or aria-labels
- [ ] All links have discernible text
- [ ] Heading hierarchy is correct
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all interactive elements correctly
- [ ] Color contrast meets WCAG AA standards (4.5:1 for normal text)
- [ ] Images have alt text
- [ ] Videos have captions (if applicable)

## Tools

- **Lighthouse**: Built into Chrome DevTools
- **WAVE**: Browser extension for accessibility testing
- **axe DevTools**: Browser extension
- **Screen Readers**:
  - NVDA (Windows, free)
  - JAWS (Windows)
  - VoiceOver (Mac, built-in)
  - TalkBack (Android)

## Resources

- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility Docs](https://react.dev/learn/accessibility)

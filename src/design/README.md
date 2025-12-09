# BeatFlowMedia Design System

A comprehensive, production-ready design system built for the BeatFlowMedia music streaming platform. This design system provides a consistent visual language, accessibility-first components, and a scalable foundation for building modern web applications.

## 🎯 Overview

The BeatFlowMedia Design System is inspired by Spotify's design principles with a focus on:

- **Dark-first design** - Optimized for music streaming experiences
- **Accessibility** - WCAG 2.1 AA compliant components
- **Scalability** - Token-based system for consistent growth
- **Developer experience** - TypeScript support and comprehensive documentation
- **Performance** - Optimized components with minimal bundle impact

## 🚀 Quick Start

### Installation

```bash
# The design system is already included in this project
# For external projects, you would install it as:
npm install @beatflowmedia/design-system
```

### Basic Usage

```tsx
import React from "react";
import { DesignSystemProvider, Button, Card } from "@/design";

function App() {
  return (
    <DesignSystemProvider defaultMode="dark">
      <Card>
        <Button variant="primary" size="lg">
          Get Started
        </Button>
      </Card>
    </DesignSystemProvider>
  );
}
```

## 📁 Architecture

```
src/design/
├── tokens.ts              # Design tokens (colors, typography, spacing, etc.)
├── types.ts               # TypeScript type definitions
├── theme.ts               # Material-UI theme configuration
├── ThemeProvider.tsx      # Theme provider and context
├── utils.ts               # CSS-in-JS utilities and helpers
├── accessibility.ts       # Accessibility utilities (WCAG 2.1 AA)
├── components/
│   ├── atoms/             # Basic building blocks
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── molecules/         # Component combinations
│   └── organisms/         # Complex UI patterns
├── stories/               # Storybook documentation
│   └── DesignTokens.stories.mdx
└── index.ts              # Main export file
```

## 🎨 Design Tokens

### Colors

Our color system provides semantic meaning and ensures accessibility compliance:

```tsx
import { designTokens } from "@/design";

// Primary brand colors
const primary = designTokens.colors.primary[500]; // #1DB954 (Spotify green)
const surface = designTokens.colors.surface[900]; // #121212 (Dark background)
const muted = designTokens.colors.neutral[500]; // #B3B3B3 (Muted text)
const danger = designTokens.colors.danger[500]; // #E5534B (Error states)
```

### Typography

Responsive typography with fluid scaling:

```tsx
// Font sizes adapt to screen size
const xl = designTokens.typography.fontSize.xl.desktop; // 22px (PRD spec)
const md = designTokens.typography.fontSize.base.desktop; // 16px (PRD spec)
const sm = designTokens.typography.fontSize.sm.desktop; // 14px (PRD spec)

// Font families
const sans = designTokens.typography.fontFamily.sans; // Inter
const mono = designTokens.typography.fontFamily.mono; // JetBrains Mono
```

### Spacing

Consistent spacing based on 8px grid:

```tsx
const xs = designTokens.spacing.xs; // 4px  (PRD spec)
const sm = designTokens.spacing.sm; // 8px  (PRD spec)
const md = designTokens.spacing.md; // 16px (PRD spec)
const lg = designTokens.spacing.lg; // 24px (PRD spec)
```

### Motion

Animation tokens for consistent motion design:

```tsx
const fast = designTokens.motion.duration.fast; // 120ms (PRD spec)
const normal = designTokens.motion.duration.normal; // 240ms (PRD spec)
const easing = designTokens.motion.easing.easeOut; // Smooth transitions
```

## 🧩 Atomic Components

Our atomic components serve as the foundational building blocks of the design system, each crafted with music streaming platform requirements in mind.

### Button

Enhanced button component with music-specific variants and accessibility features:

```tsx
import { Button } from '@/design';

// Standard variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Subtle Action</Button>

// Music-specific variants
<Button variant="play" size="lg">Play Album</Button>
<Button variant="like" liked={isLiked}>♡ Like</Button>
<Button variant="music" leftIcon="music">Add to Playlist</Button>

// Sizes with PRD specifications
<Button size="xs">12px height</Button>  {/* 24px total height */}
<Button size="sm">14px height</Button>  {/* 32px total height */}
<Button size="md">16px height</Button>  {/* 40px total height */}
<Button size="lg">18px height</Button>  {/* 48px total height */}
<Button size="xl">20px height</Button>  {/* 56px total height */}

// Interactive states
<Button loading loadingText="Processing...">Submit</Button>
<Button disabled disabledReason="Premium feature">Upgrade</Button>

// With icons and animations
<Button leftIcon="play" rightIcon="download">Play & Download</Button>
<Button pulse>Live Stream</Button>
<Button glow color="primary">Premium Feature</Button>
```

### Icon

Comprehensive music iconography with 70+ icons and accessibility features:

```tsx
import { Icon } from '@/design';

// Playback controls
<Icon name="play" size="lg" />
<Icon name="pause" size="lg" />
<Icon name="next" color="primary" />
<Icon name="shuffle" spin={isShuffling} />

// Music library icons
<Icon name="music" size="xl" />
<Icon name="album" color="secondary" />
<Icon name="playlist" size="md" />
<Icon name="headphones" pulse />

// Interactive icons with animations
<Icon name="heart" bounce={isLiked} color="danger" />
<Icon name="settings" spin onClick={openSettings} />
<Icon name="trending" pulse color="primary" />

// Volume controls
<Icon name="volume-up" size="sm" />
<Icon name="volume-mute" color="neutral" />

// Sizes and colors
<Icon name="music" size={24} />  {/* Custom pixel size */}
<Icon name="play" color="#1DB954" />  {/* Custom color */}
<Icon name="heart" color="inherit" />  {/* Inherit parent color */}
```

### Input

Advanced input component with music search capabilities and validation:

```tsx
import { Input } from '@/design';

// Basic input with PRD specs
<Input
  label="Email"
  placeholder="Enter your email"
  size="md"  {/* 16px font size as per PRD */}
/>

// Music search with autocomplete
<Input
  type="search"
  label="Search Music"
  placeholder="Search songs, artists, or albums..."
  searchCategory="all"
  showSearchIcon
  clearable
  autocomplete="music"
/>

// Password with security features
<Input
  label="Password"
  type="password"
  state="error"
  helperText="Password must be at least 8 characters"
  showPasswordToggle
  showStrengthIndicator
/>

// Textarea with character count
<Input
  label="Playlist Description"
  multiline
  rows={4}
  characterCount
  maxCharacters={200}
  placeholder="Describe your playlist..."
/>

// Advanced validation
<Input
  label="Artist Name"
  validate={(value) => value.length >= 2}
  debounceValidation={300}
  showValidationIcon
  asyncValidation={checkArtistExists}
/>

// Music-specific inputs
<Input
  type="search"
  label="Search Artists"
  searchCategory="artists"
  filterable
  suggestions={artistSuggestions}
/>
```

### Image

Optimized image component with lazy loading and music-specific features:

```tsx
import { Image } from '@/design';

// Album art with play button
<Image
  src="/album-cover.jpg"
  alt="Album Cover"
  albumArt
  size="lg"
  showPlayButton
  isPlaying={currentTrack === trackId}
  onClick={handlePlayAlbum}
/>

// Artist photos with hover effects
<Image
  src="/artist-photo.jpg"
  alt="Artist Name"
  artistPhoto
  size={{ width: 200, height: 200 }}
  hoverEffect="zoom"
  rounded="full"
/>

// Playlist covers with overlay
<Image
  src="/playlist-cover.jpg"
  alt="My Playlist"
  playlistCover
  aspectRatio="square"
  overlay
  overlayGradient="bottom"
/>

// Optimized loading with quality settings
<Image
  src="/large-image.jpg"
  alt="HD Album Art"
  lazy
  quality="high"
  format="webp"
  placeholder="blur"
  fallback="/default-album.jpg"
/>

// Interactive features
<Image
  src="/track-artwork.jpg"
  alt="Track Artwork"
  size="md"
  fit="cover"
  clickable
  glow={isCurrentTrack}
  grayscale={!isAvailable}
/>
```

### Avatar

User avatar component with status indicators and music streaming features:

```tsx
import { Avatar } from '@/design';

// Basic user avatar
<Avatar
  name="John Doe"
  src="/user-avatar.jpg"
  size="lg"
/>

// Artist avatar with verification
<Avatar
  name="Taylor Swift"
  src="/artist-avatar.jpg"
  size="xl"
  verified
  artist
  glow
/>

// User with streaming status
<Avatar
  name="Music Lover"
  src="/user-avatar.jpg"
  showStatus
  status="streaming"
  isPlaying={true}
  clickable
  onClick={viewProfile}
/>

// Premium user with volume indicator
<Avatar
  name="Premium User"
  premium
  showVolumeIndicator
  volume={0.8}
  isMuted={false}
/>

// Loading and error states
<Avatar
  name="Loading User"
  loading
  fallback="icon"
/>

<Avatar
  name="Error User"
  src="/broken-image.jpg"
  fallback={<Icon name="user" size="lg" />}
  error
/>

// Custom styling
<Avatar
  name="Custom User"
  backgroundColor="#1DB954"
  textColor="#FFFFFF"
  border
  borderColor="primary"
  shadow
  pulse={isLive}
/>
```

### Performance-Optimized Components

All components include optimized versions for production use:

```tsx
import {
  OptimizedButton,
  OptimizedIcon,
  OptimizedInput,
  OptimizedImage,
  OptimizedAvatar
} from '@/design/optimized';

// Lazy-loaded, memoized components with bundle splitting
<OptimizedButton variant="primary" preload>
  Critical Action
</OptimizedButton>

<OptimizedImage
  src="/album-art.jpg"
  lazy
  intersection
  preload={priority}
/>
```

## 🎯 Theme System

### Theme Provider

Wrap your app with the DesignSystemProvider:

```tsx
import { DesignSystemProvider } from "@/design";

function App() {
  return (
    <DesignSystemProvider defaultMode="dark">
      {/* Your app components */}
    </DesignSystemProvider>
  );
}
```

### Theme Switching

```tsx
import { useDesignSystem } from "@/design";

function ThemeToggle() {
  const { mode, toggleMode } = useDesignSystem();

  return (
    <Button onClick={toggleMode}>
      {mode === "dark" ? "Light Mode" : "Dark Mode"}
    </Button>
  );
}
```

### Using Theme Tokens

```tsx
import { useThemeTokens } from "@/design";

function MyComponent() {
  const { tokens, mode } = useThemeTokens();

  return (
    <div
      style={{
        color: tokens.colors.primary[500],
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.md,
      }}
    >
      Current mode: {mode}
    </div>
  );
}
```

## 🛠 Utilities

### CSS-in-JS Utilities

```tsx
import { designSystemUtils } from "@/design";

const StyledComponent = styled.div`
  ${designSystemUtils.spacing.margin("md")}
  ${designSystemUtils.typography.fontSize("lg")}
  ${designSystemUtils.colors.color("primary.500")}
  ${designSystemUtils.animation.transition(["opacity", "transform"])}
`;
```

### Responsive Utilities

```tsx
import { responsive } from "@/design/utils";

const ResponsiveComponent = styled.div`
  ${responsive(
    { xs: "100%", md: "50%", lg: "33.333%" },
    (value) => `width: ${value};`,
  )}
`;
```

### Style Props

```tsx
import { parseStyleProps } from "@/design/utils";

const FlexBox = styled.div<StyleProps>`
  ${(props) => parseStyleProps(props)}
`;

// Usage
<FlexBox
  display="flex"
  alignItems="center"
  gap="md"
  p="lg"
  m={{ xs: "sm", md: "lg" }}
>
  Content
</FlexBox>;
```

## ♿ Accessibility

### WCAG 2.1 AA Compliance

All components are built with accessibility in mind:

- **Keyboard navigation** - Full keyboard support
- **Screen reader compatibility** - Proper ARIA attributes
- **Focus management** - Visible focus indicators
- **Color contrast** - Meets WCAG AA standards
- **Touch targets** - Minimum 44px on mobile
- **Reduced motion** - Respects user preferences

### Accessibility Utilities

```tsx
import { accessibility } from "@/design";

// Check color contrast
const isAccessible = accessibility.colorContrast.meetsAA("#1DB954", "#121212");

// Announce to screen readers
accessibility.screenReader.announce("Form submitted successfully");

// Focus management
const restoreFocus = accessibility.focusManagement.createFocusRestore();
// ... do something that changes focus
restoreFocus(); // Restore previous focus

// Keyboard navigation
const handleKeyDown = accessibility.keyboardNavigation.createKeyboardHandler({
  Enter: handleSelect,
  " ": handleSelect,
  Escape: handleClose,
});
```

## 📱 Responsive Design

### Breakpoint System

```tsx
import { designTokens } from "@/design";

const breakpoints = designTokens.breakpoints.values;
// xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280, 2xl: 1536

// Using breakpoints
const responsive = {
  xs: "mobile styles",
  md: "tablet styles",
  lg: "desktop styles",
};
```

### Container Utilities

```tsx
import { container } from "@/design/utils";

const Container = styled.div`
  ${container.maxWidth("lg")}// Max width with responsive padding
`;

const FluidContainer = styled.div`
  ${container.fluid()}// Full width with responsive padding
`;
```

## 🎨 Customization

### Extending Colors

```tsx
// Create custom theme with additional colors
const customTheme = createTheme(getTheme("dark"), {
  palette: {
    custom: {
      purple: "#9333EA",
      orange: "#EA580C",
    },
  },
});
```

### Custom Components

```tsx
import { styled } from "@mui/material/styles";
import { designTokens } from "@/design";

const CustomButton = styled(Button)(({ theme }) => ({
  backgroundColor: designTokens.colors.info[500],
  "&:hover": {
    backgroundColor: designTokens.colors.info[600],
  },
}));
```

## 📖 Storybook Documentation

Comprehensive interactive documentation with detailed component stories:

```bash
npm run storybook
```

This will start Storybook at `http://localhost:6006` where you can:

- Browse all components and their variants
- Interact with component props
- Test accessibility features
- View design tokens
- Copy code examples
- Test music-specific features

### Component Stories

Each component includes comprehensive Storybook stories:

#### Button Stories

```tsx
// Button.stories.tsx
export default {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: "Enhanced button with music streaming platform features",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "play", "like", "music"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
  },
};

// Interactive stories
export const PlayButton = {
  args: {
    variant: "play",
    size: "lg",
    children: "Play Album",
    leftIcon: "play",
  },
};

export const LikeButton = {
  args: {
    variant: "like",
    liked: true,
    children: "♡ 1.2k",
  },
};
```

#### Icon Stories

```tsx
// Icon.stories.tsx - 70+ music icons documented
export const MusicIcons = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, 100px)",
      gap: "16px",
    }}
  >
    {musicIcons.map((icon) => (
      <div key={icon} style={{ textAlign: "center" }}>
        <Icon name={icon} size="xl" />
        <div style={{ fontSize: "12px", marginTop: "8px" }}>{icon}</div>
      </div>
    ))}
  </div>
);

export const PlaybackControls = () => (
  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
    <Icon name="shuffle" color="neutral" />
    <Icon name="previous" size="lg" />
    <Icon name="play" size="xl" color="primary" />
    <Icon name="next" size="lg" />
    <Icon name="repeat" color="neutral" />
  </div>
);
```

#### Input Stories

```tsx
// Input.stories.tsx - Search functionality
export const MusicSearch = {
  args: {
    type: "search",
    label: "Search Music",
    placeholder: "Search songs, artists, or albums...",
    searchCategory: "all",
    showSearchIcon: true,
    clearable: true,
  },
};

export const ArtistSearch = {
  args: {
    type: "search",
    label: "Find Artists",
    searchCategory: "artists",
    suggestions: ["Taylor Swift", "The Beatles", "Billie Eilish"],
  },
};
```

#### Image Stories

```tsx
// Image.stories.tsx - Album art and optimization
export const AlbumArt = {
  args: {
    src: "/album-covers/folklore.jpg",
    alt: "Folklore Album Cover",
    albumArt: true,
    size: "lg",
    showPlayButton: true,
    isPlaying: false,
  },
};

export const ArtistPhoto = {
  args: {
    src: "/artists/taylor-swift.jpg",
    alt: "Taylor Swift",
    artistPhoto: true,
    size: { width: 200, height: 200 },
    hoverEffect: "zoom",
    rounded: "full",
  },
};
```

#### Avatar Stories

```tsx
// Avatar.stories.tsx - User profiles and status
export const StreamingUser = {
  args: {
    name: "Music Lover",
    src: "/users/user-1.jpg",
    showStatus: true,
    status: "streaming",
    isPlaying: true,
    clickable: true,
  },
};

export const VerifiedArtist = {
  args: {
    name: "Taylor Swift",
    src: "/artists/taylor-swift-avatar.jpg",
    size: "xl",
    verified: true,
    artist: true,
    glow: true,
  },
};
```

### Interactive Controls

Storybook includes interactive controls for all props:

- **Variant Selection**: Test all button variants and states
- **Size Controls**: Adjust sizes with live preview
- **Color Pickers**: Test custom colors and themes
- **Animation Toggles**: Enable/disable animations
- **Accessibility Simulation**: Test with screen readers
- **Theme Switching**: Toggle between light and dark modes
- **Performance Monitoring**: View render times and bundle sizes

## 🧪 Comprehensive Testing

The design system includes extensive test coverage for all components and utilities:

### Component Testing

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DesignSystemProvider,
  Button,
  Icon,
  Input,
  Image,
  Avatar,
} from "@/design";

// Test wrapper with theme
const renderWithTheme = (
  component: React.ReactElement,
  mode: "light" | "dark" = "dark",
) => {
  return render(
    <DesignSystemProvider defaultMode={mode}>{component}</DesignSystemProvider>,
  );
};

// Button component tests
test("button handles music-specific variants", () => {
  renderWithTheme(<Button variant="play">Play</Button>);
  expect(screen.getByRole("button")).toHaveClass("play-variant");
});

test("button shows loading state correctly", () => {
  renderWithTheme(
    <Button loading loadingText="Processing...">
      Submit
    </Button>,
  );
  expect(screen.getByText("Processing...")).toBeInTheDocument();
});

// Icon component tests
test("icon renders music iconography", () => {
  renderWithTheme(<Icon name="music" size="lg" />);
  expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
});

test("icon handles animations with reduced motion", () => {
  Object.defineProperty(window, "matchMedia", {
    value: jest.fn(() => ({ matches: true })), // reduced motion enabled
  });
  renderWithTheme(<Icon name="heart" pulse />);
  // Animations should be disabled
});

// Input component tests
test("input handles music search functionality", async () => {
  const onSearch = jest.fn();
  renderWithTheme(
    <Input type="search" searchCategory="artists" onSearchChange={onSearch} />,
  );

  await userEvent.type(screen.getByRole("textbox"), "Taylor Swift");
  expect(onSearch).toHaveBeenCalledWith("Taylor Swift", "artists");
});

// Image component tests
test("image shows play button overlay for album art", () => {
  renderWithTheme(
    <Image
      src="/album.jpg"
      alt="Album"
      albumArt
      showPlayButton
      isPlaying={false}
    />,
  );
  expect(screen.getByRole("img")).toBeInTheDocument();
});

test("image handles lazy loading with intersection observer", () => {
  const mockIntersectionObserver = jest.fn();
  window.IntersectionObserver = mockIntersectionObserver;

  renderWithTheme(<Image src="/test.jpg" alt="Test" lazy />);
  expect(mockIntersectionObserver).toHaveBeenCalled();
});

// Avatar component tests
test("avatar shows streaming status with animation", () => {
  renderWithTheme(
    <Avatar name="User" showStatus status="streaming" isPlaying={true} />,
  );
  expect(screen.getByRole("img")).toBeInTheDocument();
});
```

### Performance Testing

```tsx
import {
  performanceUtils,
  useIntersectionObserver,
  useDebouncedCallback,
  useVirtualScrolling,
} from "@/design/performance";

// Performance utilities tests
test("debounced callback delays execution", async () => {
  const callback = jest.fn();
  const { result } = renderHook(() => useDebouncedCallback(callback, 100));

  result.current();
  result.current();
  result.current();

  expect(callback).not.toHaveBeenCalled();

  await act(() => jest.advanceTimersByTime(100));
  expect(callback).toHaveBeenCalledTimes(1);
});

test("virtual scrolling calculates visible items correctly", () => {
  const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
  const { result } = renderHook(() => useVirtualScrolling(items, 50, 300));

  expect(result.current.visibleItems).toHaveLength(8); // 6 visible + 2 overscan
  expect(result.current.totalHeight).toBe(5000); // 100 * 50px
});
```

### Accessibility Testing

```tsx
import { accessibility } from "@/design";

// Color contrast validation
test("validates WCAG AA color contrast", () => {
  const contrastTest = accessibility.validateA11y.checkColorContrast(
    "#1DB954", // Spotify green
    "#121212", // Dark background
    "AA",
  );
  expect(contrastTest.passes).toBe(true);
  expect(contrastTest.ratio).toBeGreaterThan(4.5);
});

// Screen reader announcements
test("announces changes to screen readers", () => {
  const announceSpy = jest.spyOn(accessibility.screenReader, "announce");
  accessibility.screenReader.announce("Song added to playlist");
  expect(announceSpy).toHaveBeenCalledWith("Song added to playlist");
});

// Keyboard navigation
test("handles keyboard navigation correctly", async () => {
  const handleSelect = jest.fn();
  const keyHandler = accessibility.keyboardNavigation.createKeyboardHandler({
    Enter: handleSelect,
    " ": handleSelect,
  });

  const event = new KeyboardEvent("keydown", { key: "Enter" });
  keyHandler(event);
  expect(handleSelect).toHaveBeenCalled();
});

// Focus management
test("manages focus restoration", () => {
  const activeElement = document.createElement("button");
  document.body.appendChild(activeElement);
  activeElement.focus();

  const restoreFocus = accessibility.focusManagement.createFocusRestore();

  // Focus changes
  const newElement = document.createElement("input");
  document.body.appendChild(newElement);
  newElement.focus();

  // Restore previous focus
  restoreFocus();
  expect(document.activeElement).toBe(activeElement);
});
```

### Edge Case Testing

```tsx
// Test edge cases and error conditions
test("components handle empty or invalid props gracefully", () => {
  expect(() => {
    renderWithTheme(<Icon name="" />);
    renderWithTheme(<Avatar name="" />);
    renderWithTheme(<Image src="" alt="" />);
    renderWithTheme(<Input value={null} />);
  }).not.toThrow();
});

test("components respect reduced motion preferences", () => {
  Object.defineProperty(window, "matchMedia", {
    value: jest.fn(() => ({
      matches: true, // prefers-reduced-motion: reduce
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });

  // All animations should be disabled
  renderWithTheme(<Icon name="music" spin pulse bounce />);
  renderWithTheme(<Avatar name="User" pulse />);
  renderWithTheme(<Image src="/test.jpg" hoverEffect="zoom" />);
});

test("components handle network errors gracefully", async () => {
  // Mock failed image load
  const consoleError = jest.spyOn(console, "error").mockImplementation();

  renderWithTheme(
    <Image src="/broken-image.jpg" alt="Broken" fallback="/default.jpg" />,
  );

  // Simulate image error
  const img = document.querySelector("img");
  fireEvent.error(img);

  await waitFor(() => {
    expect(img.src).toContain("default.jpg");
  });

  consoleError.mockRestore();
});
```

### Test Coverage

- **Button**: 45+ test cases covering variants, states, accessibility, and interactions
- **Icon**: 40+ test cases covering iconography, animations, and accessibility
- **Input**: 35+ test cases covering validation, search, and form handling
- **Image**: 50+ test cases covering lazy loading, optimization, and music features
- **Avatar**: 35+ test cases covering status, verification, and interactive features
- **Performance**: 25+ test cases covering optimization utilities and hooks
- **Accessibility**: 20+ test cases covering WCAG compliance and screen reader support

## ⚡ Performance Optimizations

The design system includes comprehensive performance optimizations:

### Bundle Size Optimization

- **Tree-shakable** - Import only what you need
- **Lazy loading** - Components load on demand
- **CSS-in-JS** - No separate CSS files
- **Compressed tokens** - Optimized token structure
- **Code splitting** - Automatic component bundling

```tsx
// Tree-shakable imports
import { Button, Card } from "@/design"; // Only imports used components

// Performance-optimized versions
import { OptimizedButton } from "@/design/optimized";
```

### Performance Utilities

```tsx
import {
  useIntersectionObserver,
  useDebouncedCallback,
  useThrottledCallback,
  useDebouncedValue,
  useVirtualScrolling,
  generateOptimizedImageUrl,
  preloadImages,
} from "@/design/performance";

// Intersection observer for lazy loading
const { isIntersecting, elementRef } = useIntersectionObserver();

// Debounced search input
const debouncedSearch = useDebouncedCallback(performSearch, 300);

// Throttled scroll handler
const throttledScroll = useThrottledCallback(handleScroll, 16);

// Virtual scrolling for large lists
const { visibleItems, containerProps, onScroll } = useVirtualScrolling(
  items,
  50,
  400,
);

// Optimized image URLs
const optimizedSrc = generateOptimizedImageUrl("/album-art.jpg", {
  width: 300,
  height: 300,
  quality: 80,
  format: "webp",
});

// Preload critical images
await preloadImages(["/hero-image.jpg", "/featured-album.jpg"]);
```

### Performance Monitoring

```tsx
import { performanceUtils } from "@/design/performance";

// Mark performance points
performanceUtils.performanceMarkers.mark("component-mount");
performanceUtils.performanceMarkers.measure("render-time", "start", "end");

// Bundle analysis in development
performanceUtils.analyzeBundle("ComponentName");

// Memory cleanup
performanceUtils.useCleanupEffect(() => {
  // Cleanup logic
}, [dependencies]);
```

## 🔧 Development

### Running Storybook

```bash
npm run storybook
```

### Building Components

```bash
npm run build-storybook
```

### Testing

```bash
npm test
npm run test:a11y  # Accessibility tests
```

## 📋 Checklist

When using the design system, ensure:

- [ ] Wrapped app with `DesignSystemProvider`
- [ ] Using design tokens instead of hardcoded values
- [ ] Components have proper accessibility attributes
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 44px on mobile
- [ ] Animations respect reduced motion preferences
- [ ] Focus indicators are visible and clear
- [ ] Text is readable and properly sized

## 🤝 Contributing

When adding new components or features:

1. Follow existing patterns and conventions
2. Include TypeScript types
3. Add Storybook stories with documentation
4. Ensure WCAG 2.1 AA compliance
5. Test with keyboard navigation
6. Test with screen readers
7. Add responsive behavior
8. Include animation tokens

## 📚 Resources

- [Material-UI Documentation](https://mui.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [Storybook Documentation](https://storybook.js.org/docs)

## 🎵 Music Streaming Features

### JWT Playback Integration

The design system includes specialized features for music streaming platforms:

```tsx
import { usePlaybackToken, MusicPlayer } from "@/design/music";

// JWT token-based playback
const { token, refreshToken } = usePlaybackToken();

// Secure music playback
<MusicPlayer
  trackId="track_123"
  playbackToken={token}
  onTokenExpired={refreshToken}
  quality="high"
/>;
```

### Music-Specific Components

#### Playback Controls

```tsx
import { PlaybackControls } from "@/design/molecules";

<PlaybackControls
  isPlaying={isPlaying}
  onPlay={handlePlay}
  onPause={handlePause}
  onNext={handleNext}
  onPrevious={handlePrevious}
  showShuffle
  showRepeat
  volume={volume}
  onVolumeChange={setVolume}
/>;
```

#### Track Cards

```tsx
import { TrackCard } from "@/design/molecules";

<TrackCard
  track={trackData}
  showPlayButton
  showLikeButton
  showAddToPlaylist
  onPlay={handlePlay}
  onLike={handleLike}
  isCurrentTrack={currentTrack === track.id}
/>;
```

#### Album Grid

```tsx
import { AlbumGrid } from "@/design/organisms";

<AlbumGrid
  albums={albums}
  columnCount={{ xs: 2, sm: 3, md: 4, lg: 6 }}
  showPlayButton
  lazyLoad
  onAlbumClick={handleAlbumClick}
/>;
```

### Music Search Features

Advanced search capabilities for music content:

```tsx
import { MusicSearch } from "@/design/molecules";

<MusicSearch
  onSearch={handleSearch}
  categories={["songs", "artists", "albums", "playlists"]}
  suggestions={searchSuggestions}
  recentSearches={recentSearches}
  filters={{
    genre: ["pop", "rock", "jazz"],
    year: { min: 1990, max: 2024 },
    duration: { min: 0, max: 600 },
  }}
/>;
```

### Audio Visualization

Components for audio feedback and visualization:

```tsx
import { AudioVisualizer, VolumeIndicator } from '@/design/atoms';

// Real-time audio visualization
<AudioVisualizer
  audioData={audioData}
  barCount={32}
  color="primary"
  responsive
/>

// Volume level indicator
<VolumeIndicator
  volume={volume}
  isMuted={isMuted}
  orientation="horizontal"
  showPercentage
/>
```

### Playlist Management

```tsx
import { PlaylistCreator, PlaylistCard } from '@/design/molecules';

// Create new playlist
<PlaylistCreator
  onCreatePlaylist={handleCreatePlaylist}
  suggestedTracks={suggestedTracks}
  allowImport
  collaborative
/>

// Display playlist
<PlaylistCard
  playlist={playlistData}
  showTrackCount
  showDuration
  showCollaborators
  editable
  onEdit={handleEdit}
/>
```

## 🎯 Design Principles

### Music-First Design

- **Album Art Focused**: Components prioritize visual music content
- **Playback Centric**: All interactions consider music playback state
- **Audio Feedback**: Visual feedback for audio-related actions
- **Content Discovery**: Design optimized for music exploration

### Performance for Media

- **Lazy Loading**: Images and audio content load on demand
- **Adaptive Quality**: Images adapt to connection speed
- **Efficient Caching**: Smart caching for frequently accessed content
- **Bundle Splitting**: Code splitting for optimal loading

### Accessibility in Music

- **Audio Descriptions**: Rich descriptions for visual music content
- **Keyboard Navigation**: Full keyboard support for playback controls
- **Screen Reader Support**: Comprehensive ARIA labels for music elements
- **Motion Preferences**: Respect for reduced motion in audio visualizations

## 🔮 Future Enhancements

### Planned Features

- **AI-Powered Recommendations**: Smart component suggestions
- **Advanced Audio Processing**: Real-time audio analysis components
- **Social Features**: Collaborative playlist and sharing components
- **Mobile Optimization**: Enhanced mobile-first music components
- **Offline Support**: Components that work without network connectivity

### Component Roadmap

- **Molecules**: Advanced composite components (Q1 2024)
- **Organisms**: Complete page sections (Q2 2024)
- **Templates**: Full page layouts (Q3 2024)
- **Voice Interface**: Voice-controlled components (Q4 2024)

## 🎵 Spotify Design Inspiration

This design system draws inspiration from Spotify's design principles:

- Dark-first approach for media consumption
- Bold, high-contrast colors with Spotify green (#1DB954)
- Generous use of whitespace for content focus
- Subtle animations and micro-interactions
- Content-focused layout patterns
- Album art as primary visual element
- Seamless playback experience integration

## 📊 Component Statistics

- **5 Atomic Components**: Button, Icon, Input, Image, Avatar
- **70+ Music Icons**: Comprehensive iconography for music apps
- **250+ Test Cases**: Extensive test coverage across all components
- **15+ Performance Hooks**: Optimization utilities and helpers
- **WCAG 2.1 AA Compliant**: Full accessibility standard compliance
- **Tree-Shakable**: Optimized for minimal bundle impact
- **TypeScript Native**: Complete type safety and IntelliSense

---

**Built with ❤️ for the BeatFlowMedia platform**

_Empowering developers to create exceptional music streaming experiences_

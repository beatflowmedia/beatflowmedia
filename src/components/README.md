# BeatFlowMedia Molecular Components

A comprehensive collection of production-ready molecular components for music streaming applications, built with React and designed for optimal user experience, accessibility, and performance.

## 🎵 Components Overview

### Core Player Components

#### TrackRow

**Purpose**: Interactive track listing component for playlists, albums, and search results.

**Key Features**:

- Play/pause states with visual feedback
- Like/unlike functionality with heart animation
- Context menu with playlist actions
- Duration display and metadata truncation
- Multiple variants (default, compact, queue)
- Full accessibility support with keyboard navigation

**Usage**:

```jsx
<TrackRow
  track={track}
  index={0}
  isCurrentTrack={false}
  showAlbum={true}
  variant="default"
  onContextMenu={(e, track, index) => showContextMenu(e, track, index)}
/>
```

#### PlaylistHeader

**Purpose**: Rich header component for playlists and albums with cover art and metadata.

**Key Features**:

- Dynamic gradient extraction from album artwork
- Play all and shuffle functionality
- Follow/unfollow for social features
- Responsive design for mobile and desktop
- Share and download capabilities
- Owner permissions for edit/delete actions

**Usage**:

```jsx
<PlaylistHeader
  playlist={playlist}
  tracks={tracks}
  isOwner={false}
  onEdit={(playlist) => editPlaylist(playlist)}
  onDelete={(playlist) => deletePlaylist(playlist)}
/>
```

#### PlayerProgress

**Purpose**: Interactive progress bar with seek functionality and buffer visualization.

**Key Features**:

- Click and drag seeking with smooth animations
- Buffer range visualization
- Time display with hover preview
- Touch-friendly mobile interactions
- Keyboard navigation (arrow keys, home/end)
- Multiple size variants (mini, default, full)

**Usage**:

```jsx
<PlayerProgress
  variant="default"
  showTimes={true}
  showBuffer={true}
  className="w-full"
/>
```

#### NowPlayingBar

**Purpose**: Persistent mini player for app-wide playback control.

**Key Features**:

- Complete playback controls (play/pause, skip, shuffle, repeat)
- Volume control with expandable slider
- Track information with album art
- Like functionality and queue management
- Keyboard shortcuts for power users
- Responsive layout adaptation

**Usage**:

```jsx
<NowPlayingBar
  onQueueToggle={() => setQueueVisible(!queueVisible)}
  onExpand={() => navigateToFullPlayer()}
/>
```

#### QueuePanel

**Purpose**: Comprehensive queue management with drag & drop reordering.

**Key Features**:

- Drag and drop reordering with touch support
- Remove tracks with undo functionality
- Save queue as playlist
- Shuffle and clear queue actions
- Statistics display (track count, total duration)
- Enhanced accessibility with screen reader support

**Usage**:

```jsx
<QueuePanel visible={queueVisible} onClose={() => setQueueVisible(false)} />
```

## 🛠 Technical Architecture

### Design System Integration

- Built on top of atomic design principles
- Integrated with Material-UI design tokens
- Consistent spacing, typography, and color schemes
- Support for light and dark themes

### State Management

- Seamless integration with PlayerContext
- Real-time synchronization with audio playback
- Optimistic updates with error handling
- Persistent queue management with Firestore

### Authentication & Security

- JWT token integration for secure playback
- Automatic token refresh mechanism
- Error handling for authentication failures
- Secure MSE streaming with playback tokens

### Accessibility (WCAG 2.1 AA Compliant)

- Full keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences
- Focus management and skip links
- Proper ARIA labels and semantic markup

## 🎨 Storybook Documentation

All components include comprehensive Storybook documentation with:

### Interactive Playground

- Live component demos with real data
- Configurable props and variants
- State management examples
- Error scenarios and edge cases

### Design Guidelines

- Component anatomy and structure
- Usage patterns and best practices
- Responsive behavior examples
- Accessibility demonstrations

### Code Examples

- Integration with PlayerContext
- Authentication setup
- Custom styling approaches
- Performance optimization tips

## 🚀 Performance Optimizations

### Component Optimizations

- React.memo for expensive re-renders
- useCallback for stable function references
- Virtualization for long lists
- Image lazy loading with fallbacks

### Bundle Optimization

- Tree-shaking friendly exports
- Code splitting for large components
- Dynamic imports for non-critical features
- Optimized dependency bundling

### Audio Performance

- MSE streaming for seamless playback
- Buffer management for smooth seeking
- Preloading strategies for queue items
- Graceful degradation for older browsers

## 🔧 Development Setup

### Prerequisites

```bash
npm install @mui/material @mui/icons-material
npm install react-hot-toast react-icons classnames
npm install @hello-pangea/dnd # For drag & drop
```

### PlayerContext Integration

```jsx
import { PlayerProvider } from "../context/PlayerContext";

function App() {
  return (
    <PlayerProvider>
      <YourAppComponents />
    </PlayerProvider>
  );
}
```

### Authentication Setup

```jsx
import { useAuth, tokenManager } from "../utils/authHelpers";

function AuthenticatedApp() {
  const { isAuthenticated, login, logout } = useAuth();

  // Handle authentication state
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login or show auth UI
    }
  }, [isAuthenticated]);
}
```

## 📱 Responsive Design

### Breakpoints

- Mobile: 375px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1535px
- Large Desktop: 1536px+

### Adaptive Features

- Touch-friendly interactions on mobile
- Condensed layouts for smaller screens
- Progressive disclosure of features
- Optimized spacing and typography

## ♿ Accessibility Features

### Keyboard Navigation

- Tab navigation through all interactive elements
- Arrow key navigation within component groups
- Enter/Space activation for buttons
- Escape key for closing modals and panels

### Screen Reader Support

- Descriptive ARIA labels for all controls
- Live regions for dynamic content updates
- Proper heading hierarchy and landmarks
- Status announcements for user actions

### Visual Accessibility

- High contrast focus indicators
- Color-blind friendly color schemes
- Sufficient color contrast ratios (4.5:1 minimum)
- Scalable text and UI elements

## 🧪 Testing Strategy

### Unit Testing

- Component rendering and prop handling
- User interaction simulations
- State management validation
- Error boundary testing

### Integration Testing

- PlayerContext integration
- Authentication flow testing
- API interaction mocking
- Cross-component communication

### Accessibility Testing

- Automated a11y testing with axe-core
- Keyboard navigation verification
- Screen reader compatibility testing
- Color contrast validation

## 🔄 State Management Patterns

### PlayerContext Integration

```jsx
const { state, dispatch, actions } = usePlayer();

// Playing a track
dispatch({ type: actions.PLAY_SONG, payload: track });

// Managing queue
dispatch({ type: actions.ENQUEUE, payload: { item: track } });
dispatch({ type: actions.REMOVE_AT, payload: index });
```

### Authentication State

```jsx
const { isAuthenticated, tokenManager } = useAuth();

// Making authenticated requests
const response = await authenticatedFetch("/api/user/playlists");

// Handling auth errors
handleAuthError(error, {
  onAuthRequired: () => redirectToLogin(),
  onNetworkError: () => showRetryMessage(),
});
```

## 📊 Performance Metrics

### Target Performance Goals

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1
- Audio playback latency: < 100ms

### Monitoring

- Real User Monitoring (RUM) integration
- Core Web Vitals tracking
- Audio performance analytics
- User interaction metrics

## 🔮 Future Enhancements

### Planned Features

- Voice control integration
- Advanced visualizations
- Collaborative playlist editing
- AI-powered recommendations
- Offline playback support

### Technical Improvements

- WebAssembly audio processing
- Advanced caching strategies
- Progressive Web App features
- Enhanced security measures

## 📝 Contributing

### Development Guidelines

1. Follow existing code patterns and conventions
2. Include comprehensive tests for new features
3. Update Storybook documentation
4. Ensure accessibility compliance
5. Maintain performance standards

### Code Review Checklist

- [ ] Component follows design system patterns
- [ ] Accessibility requirements met
- [ ] Performance impact assessed
- [ ] Tests included and passing
- [ ] Documentation updated

## 📄 License

Built for BeatFlowMedia - Internal use only.

---

For detailed component APIs and examples, visit our [Storybook documentation](http://localhost:6006) or explore the individual `.stories.js` files.

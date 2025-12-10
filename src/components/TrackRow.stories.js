// src/components/TrackRow.stories.js
import React from "react";
import { action } from "@storybook/addon-actions";
import TrackRow from "./TrackRow";
import { PlayerProvider } from "../context/PlayerContext";

// Mock track data
const mockTrack = {
  id: "1",
  title: "Midnight Dreams",
  artist: "Luna Rodriguez",
  album: "Cosmic Journeys",
  duration: 234,
  cover: "https://picsum.photos/300/300?random=1",
  isLiked: false,
  isExplicit: false,
  addedAt: "2024-01-15T10:30:00Z"
};

const mockTrackExplicit = {
  ...mockTrack,
  id: "2",
  title: "Raw Emotions",
  artist: "The Underground",
  isExplicit: true,
  isLiked: true
};

const mockTrackLong = {
  ...mockTrack,
  id: "3",
  title:
    "This is a Really Long Song Title That Should Truncate Properly When Displayed",
  artist: "Artist with a Very Long Name That Also Should Truncate",
  album:
    "An Album with an Extremely Long Name That Demonstrates Text Overflow Handling",
  duration: 3661, // 1 hour, 1 minute, 1 second
};

// Decorator to provide PlayerContext
const withPlayerProvider = (Story) => (
  <PlayerProvider>
    <div className="bg-gray-900 min-h-screen p-8">
      <Story />
    </div>
  </PlayerProvider>
);

export default {
  title: "Molecular/TrackRow",
  component: TrackRow,
  decorators: [withPlayerProvider],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
TrackRow is a comprehensive track listing component designed for music streaming applications.

## Features
- **Play/Pause States**: Visual feedback for current playback state with smooth transitions
- **Track Metadata**: Title, artist, album, and duration display with proper truncation
- **Interactive Elements**: Like/unlike, add to queue, context menu actions
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Adapts to different container sizes and variants
- **Loading States**: Skeleton loading and async action feedback
- **Context Menu**: Right-click actions for playlist management

## Usage
\`\`\`jsx
<TrackRow
  track={track}
  index={0}
  variant="default"
  showAlbum={true}
  onContextMenu={(e, track, index) => showContextMenu(e, track, index)}
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    track: {
      description: "Track object containing metadata",
      control: "object"
    },
    index: {
      description: "Track index in the list",
      control: "number"
    },
    isCurrentTrack: {
      description: "Whether this track is currently playing",
      control: "boolean"
    },
    showAlbum: {
      description: "Show album name in track info",
      control: "boolean"
    },
    showAddedDate: {
      description: "Show date when track was added",
      control: "boolean"
    },
    variant: {
      description: "Visual variant of the track row",
      control: "select",
      options: ["default", "compact", "queue"]
    },
    onContextMenu: {
      description: "Context menu handler",
      action: "contextMenu"
    }
  }
};

// Default story
export const Default = {
  args: {
    track: mockTrack,
    index: 0,
    isCurrentTrack: false,
    showAlbum: true,
    showAddedDate: false,
    variant: "default",
    onContextMenu: action("contextMenu")
  }
};

// Currently playing track
export const CurrentlyPlaying = {
  args: {
    ...Default.args,
    isCurrentTrack: true
  },
  parameters: {
    docs: {
      description: {
        story:
          "Track row showing the currently playing track with green accent color and play/pause button."
      }
    }
  }
};

// Liked track
export const LikedTrack = {
  args: {
    ...Default.args,
    track: { ...mockTrack, isLiked: true }
  },
  parameters: {
    docs: {
      description: {
        story: "Track row with liked state, showing filled heart icon."
      }
    }
  }
};

// Explicit content
export const ExplicitContent = {
  args: {
    ...Default.args,
    track: mockTrackExplicit
  },
  parameters: {
    docs: {
      description: {
        story: 'Track row displaying explicit content with "E" badge.'
      }
    }
  }
};

// Long text content
export const LongTextContent = {
  args: {
    ...Default.args,
    track: mockTrackLong
  },
  parameters: {
    docs: {
      description: {
        story:
          "Track row with very long text content showing proper truncation behavior."
      }
    }
  }
};

// Compact variant
export const CompactVariant = {
  args: {
    ...Default.args,
    variant: "compact"
  },
  parameters: {
    docs: {
      description: {
        story: "Compact variant with reduced padding and smaller elements."
      }
    }
  }
};

// Queue variant
export const QueueVariant = {
  args: {
    ...Default.args,
    variant: "queue"
  },
  parameters: {
    docs: {
      description: {
        story: "Queue variant optimized for queue panel display."
      }
    }
  }
};

// With added date
export const WithAddedDate = {
  args: {
    ...Default.args,
    showAddedDate: true
  },
  parameters: {
    docs: {
      description: {
        story: "Track row showing when the track was added to the playlist."
      }
    }
  }
};

// Without album info
export const WithoutAlbum = {
  args: {
    ...Default.args,
    showAlbum: false
  },
  parameters: {
    docs: {
      description: {
        story: "Track row without album information for simplified display."
      }
    }
  }
};

// Loading state
export const LoadingState = {
  args: {
    track: null
  },
  parameters: {
    docs: {
      description: {
        story: "Loading skeleton state while track data is being fetched."
      }
    }
  }
};

// Interactive showcase
export const InteractiveShowcase = {
  render: () => {
    const tracks = [
      mockTrack,
      { ...mockTrackExplicit, id: "2" },
      { ...mockTrackLong, id: "3" },
      {
        ...mockTrack,
        id: "4",
        title: "Another Song",
        artist: "Different Artist"
      },
      {
        ...mockTrack,
        id: "5",
        title: "Final Track",
        artist: "Last Artist",
        isLiked: true
      },
    ];

    return (
      <div className="space-y-1">
        {tracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            isCurrentTrack={index === 1}
            showAlbum={true}
            onContextMenu={action("contextMenu")}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive showcase with multiple tracks showing different states and interactions."
      }
    }
  }
};

// Responsive showcase
export const ResponsiveShowcase = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-white mb-4">Desktop View</h3>
        <div className="w-full">
          <TrackRow
            track={mockTrack}
            index={0}
            showAlbum={true}
            showAddedDate={true}
            onContextMenu={action("contextMenu")}
          />
        </div>
      </div>

      <div>
        <h3 className="text-white mb-4">Tablet View</h3>
        <div className="w-96">
          <TrackRow
            track={mockTrack}
            index={0}
            showAlbum={true}
            showAddedDate={false}
            onContextMenu={action("contextMenu")}
          />
        </div>
      </div>

      <div>
        <h3 className="text-white mb-4">Mobile View</h3>
        <div className="w-72">
          <TrackRow
            track={mockTrack}
            index={0}
            showAlbum={false}
            showAddedDate={false}
            variant="compact"
            onContextMenu={action("contextMenu")}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Responsive behavior across different screen sizes with adaptive content."
      }
    }
  }
};

// Accessibility showcase
export const AccessibilityShowcase = {
  render: () => (
    <div className="space-y-4">
      <div className="text-white mb-4">
        <h3>Accessibility Features</h3>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Full keyboard navigation (Tab, Enter, Space)</li>
          <li>Screen reader announcements for all actions</li>
          <li>ARIA labels and roles</li>
          <li>Focus indicators</li>
          <li>Keyboard shortcuts (Ctrl+L for like, Ctrl+Q for queue)</li>
        </ul>
      </div>

      <div className="space-y-1">
        <TrackRow
          track={mockTrack}
          index={0}
          showAlbum={true}
          onContextMenu={action("contextMenu")}
        />
        <TrackRow
          track={mockTrackExplicit}
          index={1}
          isCurrentTrack={true}
          showAlbum={true}
          onContextMenu={action("contextMenu")}
        />
      </div>

      <div className="text-xs text-gray-400 mt-4">
        Try navigating with Tab key and using keyboard shortcuts!
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstration of accessibility features including keyboard navigation and screen reader support."
      }
    }
  }
};

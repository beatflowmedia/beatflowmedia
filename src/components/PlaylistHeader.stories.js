// src/components/PlaylistHeader.stories.js
import React from "react";
import { action } from "@storybook/addon-actions";
import PlaylistHeader from "./PlaylistHeader";
import { PlayerProvider } from "../context/PlayerContext";

// Mock data
const mockPlaylist = {
  id: "1",
  title: "Midnight Vibes",
  description:
    "Perfect songs for late night coding sessions and deep focus work.",
  type: "Playlist",
  cover: "https://picsum.photos/400/400?random=1",
  creator: {
    id: "user1",
    name: "Alex Chen",
    avatar: "https://picsum.photos/32/32?random=2"
  },
  isFollowing: false,
  createdAt: "2024-01-15T10:30:00Z"
};

const mockTracks = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Rodriguez",
    album: "Cosmic Journeys",
    duration: 234
  },
  {
    id: "2",
    title: "Digital Sunset",
    artist: "Neo Wave",
    album: "Synthetics",
    duration: 198
  },
  {
    id: "3",
    title: "Code in the Dark",
    artist: "Dev Sounds",
    album: "Programming Beats",
    duration: 267
  },
  {
    id: "4",
    title: "Binary Dreams",
    artist: "Tech Noir",
    album: "Cybernetics",
    duration: 301
  },
  {
    id: "5",
    title: "Async Flow",
    artist: "Parallel Processing",
    album: "Concurrent Melodies",
    duration: 189
  },
];

const mockAlbum = {
  ...mockPlaylist,
  title: "Cosmic Journeys",
  type: "Album",
  description: "A journey through space and time with ethereal soundscapes.",
  creator: {
    id: "artist1",
    name: "Luna Rodriguez",
    avatar: "https://picsum.photos/32/32?random=3"
  }
};

// Decorator to provide PlayerContext
const withPlayerProvider = (Story) => (
  <PlayerProvider>
    <div className="bg-gray-900 min-h-screen">
      <Story />
    </div>
  </PlayerProvider>
);

export default {
  title: "Molecular/PlaylistHeader",
  component: PlaylistHeader,
  decorators: [withPlayerProvider],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
PlaylistHeader is a comprehensive header component for playlists and albums in music streaming applications.

## Features
- **Dynamic Cover Art**: Large album artwork with gradient extraction and overlay effects
- **Rich Metadata**: Title, creator, description, track count, and total duration
- **Playback Controls**: Play all, shuffle, and secondary actions
- **Social Features**: Follow/unfollow, like, share functionality
- **Responsive Design**: Adapts from mobile to desktop layouts
- **Accessibility**: Full keyboard navigation and screen reader support
- **Loading States**: Progressive image loading with fallbacks

## Usage
\`\`\`jsx
<PlaylistHeader
  playlist={playlist}
  tracks={tracks}
  isOwner={false}
  onEdit={(playlist) => editPlaylist(playlist)}
  onDelete={(playlist) => deletePlaylist(playlist)}
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    playlist: {
      description: "Playlist/album object with metadata",
      control: "object"
    },
    tracks: {
      description: "Array of tracks in the playlist",
      control: "object"
    },
    isOwner: {
      description: "Whether current user owns the playlist",
      control: "boolean"
    },
    onEdit: {
      description: "Edit playlist handler",
      action: "edit"
    },
    onDelete: {
      description: "Delete playlist handler",
      action: "delete"
    }
  }
};

// Default story
export const Default = {
  args: {
    playlist: mockPlaylist,
    tracks: mockTracks,
    isOwner: false,
    onEdit: action("edit"),
    onDelete: action("delete")
  }
};

// Album variant
export const Album = {
  args: {
    ...Default.args,
    playlist: mockAlbum
  },
  parameters: {
    docs: {
      description: {
        story:
          "Album header showing artist information instead of playlist creator."
      }
    }
  }
};

// Owner view
export const OwnerView = {
  args: {
    ...Default.args,
    isOwner: true
  },
  parameters: {
    docs: {
      description: {
        story:
          "Playlist header from owner perspective with edit/delete options."
      }
    }
  }
};

// Following playlist
export const FollowingPlaylist = {
  args: {
    ...Default.args,
    playlist: { ...mockPlaylist, isFollowing: true }
  },
  parameters: {
    docs: {
      description: {
        story:
          "Playlist that the user is currently following, showing unfollow option."
      }
    }
  }
};

// Large playlist
export const LargePlaylist = {
  args: {
    ...Default.args,
    playlist: {
      ...mockPlaylist,
      title: "The Ultimate Collection",
      description:
        "A massive collection of the greatest hits from the past decades, carefully curated for every mood and occasion."
    },
    tracks: Array.from({ length: 127 }, (_, i) => ({
      id: `track-${i + 1}`,
      title: `Track ${i + 1}`,
      artist: `Artist ${Math.floor(i / 10) + 1}`,
      album: `Album ${Math.floor(i / 5) + 1}`,
      duration: Math.floor(Math.random() * 240) + 120
    }))
  },
  parameters: {
    docs: {
      description: {
        story:
          "Large playlist with many tracks showing proper duration formatting and statistics."
      }
    }
  }
};

// Empty playlist
export const EmptyPlaylist = {
  args: {
    ...Default.args,
    tracks: []
  },
  parameters: {
    docs: {
      description: {
        story: "Empty playlist showing disabled play button and zero duration."
      }
    }
  }
};

// Long title playlist
export const LongTitlePlaylist = {
  args: {
    ...Default.args,
    playlist: {
      ...mockPlaylist,
      title:
        "This is an Extremely Long Playlist Title That Should Wrap Properly on Multiple Lines",
      description:
        "This is also a very long description that contains multiple sentences and should demonstrate how the component handles lengthy text content. It should wrap nicely and maintain good readability across different screen sizes."
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "Playlist with very long title and description showing text wrapping behavior."
      }
    }
  }
};

// No cover image
export const NoCoverImage = {
  args: {
    ...Default.args,
    playlist: { ...mockPlaylist, cover: null }
  },
  parameters: {
    docs: {
      description: {
        story: "Playlist without cover image showing default placeholder."
      }
    }
  }
};

// Loading state
export const LoadingState = {
  args: {
    playlist: null,
    tracks: []
  },
  parameters: {
    docs: {
      description: {
        story: "Loading skeleton state while playlist data is being fetched."
      }
    }
  }
};

// Mobile responsive
export const MobileView = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: "mobile"
    },
    docs: {
      description: {
        story:
          "Mobile-optimized layout with stacked elements and adjusted spacing."
      }
    }
  }
};

// Interactive showcase
export const InteractiveShowcase = {
  render: () => {
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [playlist, setPlaylist] = React.useState(mockPlaylist);

    const handleFollow = () => {
      setIsFollowing(!isFollowing);
      setPlaylist((prev) => ({ ...prev, isFollowing: !isFollowing }));
    };

    return (
      <PlaylistHeader
        playlist={playlist}
        tracks={mockTracks}
        isOwner={false}
        onEdit={action("edit")}
        onDelete={action("delete")}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive showcase with working follow/unfollow functionality."
      }
    }
  }
};

// Gradient showcase
export const GradientShowcase = {
  render: () => (
    <div className="space-y-8">
      {[
        {
          cover: "https://picsum.photos/400/400?random=1",
          title: "Blue Tones"
        },
        {
          cover: "https://picsum.photos/400/400?random=2",
          title: "Green Vibes"
        },
        {
          cover: "https://picsum.photos/400/400?random=3",
          title: "Warm Colors"
        },
        {
          cover: "https://picsum.photos/400/400?random=4",
          title: "Purple Dreams"
        },
      ].map((item, index) => (
        <PlaylistHeader
          key={index}
          playlist={{
            ...mockPlaylist,
            title: item.title,
            cover: item.cover
          }}
          tracks={mockTracks.slice(0, 3)}
          isOwner={false}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Showcase of dynamic gradient extraction from different album artworks."
      }
    }
  }
};

// Accessibility showcase
export const AccessibilityShowcase = {
  render: () => (
    <div>
      <div className="text-white mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-bold mb-2">Accessibility Features</h3>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Semantic HTML structure with proper headings</li>
          <li>ARIA labels for all interactive elements</li>
          <li>Keyboard navigation support</li>
          <li>Screen reader announcements for actions</li>
          <li>High contrast mode support</li>
          <li>Focus indicators and skip links</li>
        </ul>
      </div>

      <PlaylistHeader
        playlist={mockPlaylist}
        tracks={mockTracks}
        isOwner={true}
        onEdit={action("edit")}
        onDelete={action("delete")}
      />

      <div className="text-xs text-gray-400 mt-4 p-4 bg-gray-800 rounded-lg">
        Try navigating with keyboard: Tab to move between elements, Enter/Space
        to activate buttons
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstration of accessibility features and keyboard navigation."
      }
    }
  }
};

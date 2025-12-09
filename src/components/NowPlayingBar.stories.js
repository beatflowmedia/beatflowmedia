// src/components/NowPlayingBar.stories.js
import React, { useState } from "react";
import { action } from "@storybook/addon-actions";
import NowPlayingBar from "./NowPlayingBar";
import { PlayerProvider } from "../context/PlayerContext";
import { Shuffle } from '@mui/icons-material/Shuffle';
import { Repeat } from '@mui/icons-material/Repeat';

// Mock track data
const mockTrack = {
  id: "1",
  title: "Midnight Dreams",
  artist: "Luna Rodriguez",
  album: "Cosmic Journeys",
  duration: 234,
  cover: "https://picsum.photos/200/200?random=1",
  isLiked: false
};

const mockLongTrack = {
  id: "2",
  title:
    "This is a Very Long Song Title That Should Truncate Properly in the Mini Player",
  artist: "Artist with a Very Long Name That Also Should Truncate",
  album: "Album with an Extremely Long Name",
  duration: 3661,
  cover: "https://picsum.photos/200/200?random=2",
  isLiked: true
};

// Mock PlayerContext with controllable state
const MockPlayerProvider = ({
  children,
  currentTrack = mockTrack,
  isPlaying = false,
  currentTime = 67,
  duration = 234,
  volume = 0.7,
  shuffleOn = false,
  repeatMode = "OFF"
}) => {
  const [mockState, setMockState] = useState({
    queue: currentTrack ? [currentTrack] : [],
    currentIndex: 0,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffleOn,
    repeatMode
  });

  const mockDispatch = (action) => {
    console.log("Mock dispatch:", action);
    switch (action.type) {
      case "TOGGLE_PLAY":
        setMockState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
        break;
      case "SET_VOLUME":
        setMockState((prev) => ({ ...prev, volume: action.payload }));
        break;
      case "TOGGLE_SHUFFLE":
        setMockState((prev) => ({ ...prev, shuffleOn: !prev.shuffleOn }));
        break;
      case "CYCLE_REPEAT":
        const nextMode =
          mockState.repeatMode === "OFF"
            ? "ALL"
            : mockState.repeatMode === "ALL"
              ? "ONE"
              : "OFF";
        setMockState((prev) => ({ ...prev, repeatMode: nextMode }));
        break;
      default:
        break;
    }
  };

  const contextValue = {
    state: mockState,
    dispatch: mockDispatch,
    actions: {
      TOGGLE_PLAY: "TOGGLE_PLAY",
      SKIP_PREVIOUS: "SKIP_PREVIOUS",
      SKIP_NEXT: "SKIP_NEXT",
      TOGGLE_SHUFFLE: "TOGGLE_SHUFFLE",
      CYCLE_REPEAT: "CYCLE_REPEAT",
      SET_VOLUME: "SET_VOLUME"
    }
  };

  return (
    <PlayerProvider value={contextValue}>
      <div id="audio-player" style={{ display: "none" }}></div>
      {children}
    </PlayerProvider>
  );
};

// Decorator to provide PlayerContext
const withPlayerProvider = (Story, context) => {
  const args = context.args;

  return (
    <div className="bg-gray-900 min-h-screen">
      <MockPlayerProvider {...args}>
        <div style={{ paddingBottom: "80px" }}>
          <div className="p-8 text-white">
            <h2>Main Content Area</h2>
            <p>The NowPlayingBar is positioned at the bottom of the screen.</p>
          </div>
        </div>
        <Story />
      </MockPlayerProvider>
    </div>
  );
};

export default {
  title: "Molecular/NowPlayingBar",
  component: NowPlayingBar,
  decorators: [withPlayerProvider],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
NowPlayingBar is a comprehensive mini player component that provides full playback control from anywhere in the application.

## Features
- **Track Information**: Album art, title, and artist display with proper truncation
- **Playback Controls**: Play/pause, skip previous/next, shuffle, repeat
- **Progress Control**: Integrated progress bar with seek functionality
- **Volume Control**: Expandable volume slider with mute functionality
- **Like Functionality**: Heart icon for favoriting tracks
- **Queue Integration**: Toggle queue panel and expand to full player
- **Keyboard Shortcuts**: Space (play/pause), Shift+arrows (skip), Ctrl+L (like), etc.
- **Responsive Design**: Adapts to different screen sizes

## Usage
\`\`\`jsx
<NowPlayingBar
  onQueueToggle={() => setQueueVisible(!queueVisible)}
  onExpand={() => navigateToFullPlayer()}
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    currentTrack: {
      description: "Currently playing track object",
      control: "object"
    },
    isPlaying: {
      description: "Whether track is currently playing",
      control: "boolean"
    },
    volume: {
      description: "Current volume level (0-1)",
      control: { type: "range", min: 0, max: 1, step: 0.01 }
    },
    shuffleOn: {
      description: "Whether shuffle mode is enabled",
      control: "boolean"
    },
    repeatMode: {
      description: "Current repeat mode",
      control: "select",
      options: ["OFF", "ALL", "ONE"]
    },
    onQueueToggle: {
      description: "Queue toggle handler",
      action: "queueToggle"
    },
    onExpand: {
      description: "Expand to full player handler",
      action: "expand"
    }
  }
};

// Default story
export const Default = {
  args: {
    currentTrack: mockTrack,
    isPlaying: false,
    volume: 0.7,
    shuffleOn: false,
    repeatMode: "OFF",
    onQueueToggle: action("queueToggle"),
    onExpand: action("expand")
  }
};

// Playing state
export const Playing = {
  args: {
    ...Default.args,
    isPlaying: true
  },
  parameters: {
    docs: {
      description: {
        story: "Now playing bar in active playing state with pause button."
      }
    }
  }
};

// Liked track
export const LikedTrack = {
  args: {
    ...Default.args,
    currentTrack: { ...mockTrack, isLiked: true }
  },
  parameters: {
    docs: {
      description: {
        story: "Now playing bar with a liked track showing filled heart icon."
      }
    }
  }
};

// Long track info
export const LongTrackInfo = {
  args: {
    ...Default.args,
    currentTrack: mockLongTrack
  },
  parameters: {
    docs: {
      description: {
        story:
          "Now playing bar with very long track title and artist name showing proper truncation."
      }
    }
  }
};

// Shuffle enabled
export const ShuffleEnabled = {
  args: {
    ...Default.args,
    shuffleOn: true
  },
  parameters: {
    docs: {
      description: {
        story: "Now playing bar with shuffle mode enabled."
      }
    }
  }
};

// Repeat all enabled
export const RepeatAllEnabled = {
  args: {
    ...Default.args,
    repeatMode: "ALL"
  },
  parameters: {
    docs: {
      description: {
        story: "Now playing bar with repeat all mode enabled."
      }
    }
  }
};

// Repeat one enabled
export const RepeatOneEnabled = {
  args: {
    ...Default.args,
    repeatMode: "ONE"
  },
  parameters: {
    docs: {
      description: {
        story:
          'Now playing bar with repeat one mode enabled showing "1" indicator.'
      }
    }
  }
};

// High volume
export const HighVolume = {
  args: {
    ...Default.args,
    volume: 0.9
  },
  parameters: {
    docs: {
      description: {
        story: "Now playing bar with high volume showing volume up icon."
      }
    }
  }
};

// Low volume
export const LowVolume = {
  args: {
    ...Default.args,
    volume: 0.3
  },
  parameters: {
    docs: {
      description: {
        story: "Now playing bar with low volume showing volume down icon."
      }
    }
  }
};

// Muted
export const Muted = {
  args: {
    ...Default.args,
    volume: 0
  },
  parameters: {
    docs: {
      description: {
        story: "Now playing bar with volume muted showing mute icon."
      }
    }
  }
};

// No track
export const NoTrack = {
  args: {
    currentTrack: null,
    isPlaying: false,
    volume: 0.7,
    shuffleOn: false,
    repeatMode: "OFF"
  },
  parameters: {
    docs: {
      description: {
        story: "Now playing bar when no track is loaded (hidden state)."
      }
    }
  }
};

// Interactive showcase
export const InteractiveShowcase = {
  render: () => {
    const [currentTrack, setCurrentTrack] = useState(mockTrack);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [shuffleOn, setShuffleOn] = useState(false);
    const [repeatMode, setRepeatMode] = useState("OFF");

    return (
      <div className="bg-gray-900 min-h-screen">
        <div style={{ paddingBottom: "80px" }}>
          <div className="p-8 text-white space-y-4">
            <h2 className="text-2xl font-bold">Interactive Demo</h2>
            <p>
              Use the controls in the now playing bar below to test
              functionality.
            </p>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Current State:</h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>Playing: {isPlaying ? "Yes" : "No"}</li>
                <li>Volume: {Math.round(volume * 100)}%</li>
                <li>Shuffle: {shuffleOn ? "On" : "Off"}</li>
                <li>Repeat: {repeatMode}</li>
                <li>Liked: {currentTrack?.isLiked ? "Yes" : "No"}</li>
              </ul>
            </div>

            <div className="space-x-2">
              <button
                onClick={() =>
                  setCurrentTrack(
                    currentTrack?.id === "1" ? mockLongTrack : mockTrack,
                  )
                }
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm"
              >
                Switch Track
              </button>
              <button
                onClick={() =>
                  setCurrentTrack((prev) => ({
                    ...prev,
                    isLiked: !prev.isLiked
                  }))
                }
                className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
              >
                Toggle Like
              </button>
            </div>
          </div>
        </div>

        <MockPlayerProvider
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          volume={volume}
          shuffleOn={shuffleOn}
          repeatMode={repeatMode}
        >
          <NowPlayingBar
            onQueueToggle={action("queueToggle")}
            onExpand={action("expand")}
          />
        </MockPlayerProvider>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive demonstration with working controls and state management."
      }
    }
  }
};

// Mobile view
export const MobileView = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: "mobile"
    },
    docs: {
      description: {
        story: "Mobile-optimized layout with touch-friendly controls."
      }
    }
  }
};

// States comparison
export const StatesComparison = {
  render: () => (
    <div className="space-y-4">
      {[
        {
          title: "Default State",
          props: { isPlaying: false, shuffleOn: false, repeatMode: "OFF" }
        },
        {
          title: "Playing",
          props: { isPlaying: true, shuffleOn: false, repeatMode: "OFF" }
        },
        {
          title: "Shuffle On",
          props: { isPlaying: false, shuffleOn: true, repeatMode: "OFF" }
        },
        {
          title: "Repeat All",
          props: { isPlaying: false, shuffleOn: false, repeatMode: "ALL" }
        },
        {
          title: "Repeat One",
          props: { isPlaying: false, shuffleOn: false, repeatMode: "ONE" }
        },
        {
          title: "All Active",
          props: { isPlaying: true, shuffleOn: true, repeatMode: "ONE" }
        },
      ].map(({ title, props }, index) => (
        <div key={index} className="relative">
          <h3 className="text-white mb-2 px-4">{title}</h3>
          <MockPlayerProvider currentTrack={mockTrack} {...props}>
            <NowPlayingBar />
          </MockPlayerProvider>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Comparison of different playback states and control combinations."
      }
    }
  }
};

// Accessibility showcase
export const AccessibilityShowcase = {
  render: () => (
    <div className="bg-gray-900 min-h-screen">
      <div style={{ paddingBottom: "80px" }}>
        <div className="p-8 text-white">
          <h2 className="text-xl font-bold mb-4">Accessibility Features</h2>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 mb-6">
            <li>
              <kbd>Space</kbd> - Play/pause toggle
            </li>
            <li>
              <kbd>Shift + ←/→</kbd> - Previous/next track
            </li>
            <li>
              <kbd>Ctrl + L</kbd> - Toggle like
            </li>
            <li>
              <kbd>Ctrl + M</kbd> - Toggle mute
            </li>
            <li>
              <kbd>Ctrl + S</kbd> - Toggle shuffle
            </li>
            <li>
              <kbd>Ctrl + R</kbd> - Cycle repeat mode
            </li>
            <li>
              <kbd>Tab</kbd> - Navigate between controls
            </li>
            <li>
              <kbd>Enter/Space</kbd> - Activate focused control
            </li>
          </ul>
          <p className="text-gray-400 text-sm">
            All controls have proper ARIA labels and keyboard navigation
            support. Try using the keyboard shortcuts and tab navigation!
          </p>
        </div>
      </div>

      <MockPlayerProvider currentTrack={mockTrack} isPlaying={false}>
        <NowPlayingBar
          onQueueToggle={action("queueToggle")}
          onExpand={action("expand")}
        />
      </MockPlayerProvider>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstration of accessibility features and keyboard shortcuts."
      }
    }
  }
};

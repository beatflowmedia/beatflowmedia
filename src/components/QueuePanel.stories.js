// src/components/QueuePanel.stories.js
import { useState } from "react";
import { action } from "@storybook/addon-actions";
import QueuePanel from "./QueuePanel";
import { PlayerProvider } from "../context/PlayerContext";

// Mock track data
const mockTracks = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Rodriguez",
    album: "Cosmic Journeys",
    duration: 234,
    cover: "https://picsum.photos/200/200?random=1"
  },
  {
    id: "2",
    title: "Digital Sunset",
    artist: "Neo Wave",
    album: "Synthetics",
    duration: 198,
    cover: "https://picsum.photos/200/200?random=2"
  },
  {
    id: "3",
    title: "Code in the Dark",
    artist: "Dev Sounds",
    album: "Programming Beats",
    duration: 267,
    cover: "https://picsum.photos/200/200?random=3"
  },
  {
    id: "4",
    title: "Binary Dreams",
    artist: "Tech Noir",
    album: "Cybernetics",
    duration: 301,
    cover: "https://picsum.photos/200/200?random=4"
  },
  {
    id: "5",
    title: "Async Flow",
    artist: "Parallel Processing",
    album: "Concurrent Melodies",
    duration: 189,
    cover: "https://picsum.photos/200/200?random=5"
  },
];

const mockLargeTracks = Array.from({ length: 25 }, (_, i) => ({
  id: `track-${i + 1}`,
  title: `Track ${i + 1}`,
  artist: `Artist ${Math.floor(i / 5) + 1}`,
  album: `Album ${Math.floor(i / 3) + 1}`,
  duration: Math.floor(Math.random() * 240) + 120,
  cover: `https://picsum.photos/200/200?random=${i + 6}`
}));

// Mock PlayerContext with controllable state
const MockPlayerProvider = ({
  children,
  queue = mockTracks,
  currentIndex = 0,
  isPlaying = false
}) => {
  const [mockState, setMockState] = useState({
    queue,
    currentIndex,
    isPlaying,
    currentTime: 67,
    duration: 240,
    volume: 0.7,
    shuffleOn: false,
    repeatMode: "OFF"
  });

  const mockDispatch = (action) => {
    console.log("Mock dispatch:", action);
    switch (action.type) {
      case "TOGGLE_PLAY":
        setMockState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
        break;
      case "PLAY_AT":
        setMockState((prev) => ({
          ...prev,
          currentIndex: action.payload,
          isPlaying: true
        }));
        break;
      case "REMOVE_AT":
        setMockState((prev) => {
          const newQueue = [...prev.queue];
          newQueue.splice(action.payload, 1);
          let newIndex = prev.currentIndex;
          if (action.payload < newIndex) newIndex--;
          else if (action.payload === newIndex && newQueue.length > 0) {
            newIndex = Math.min(action.payload, newQueue.length - 1);
          }
          return { ...prev, queue: newQueue, currentIndex: newIndex };
        });
        break;
      case "REORDER":
        setMockState((prev) => {
          const newQueue = [...prev.queue];
          const [moved] = newQueue.splice(action.payload.from, 1);
          newQueue.splice(action.payload.to, 0, moved);
          return { ...prev, queue: newQueue };
        });
        break;
      case "CLEAR":
        setMockState((prev) => ({
          ...prev,
          queue: [],
          currentIndex: 0,
          isPlaying: false
        }));
        break;
      case "SET_QUEUE":
        setMockState((prev) => ({
          ...prev,
          queue: action.payload.queue,
          currentIndex: action.payload.currentIndex
        }));
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
      PLAY_AT: "PLAY_AT",
      REMOVE_AT: "REMOVE_AT",
      REORDER: "REORDER",
      CLEAR: "CLEAR",
      SET_QUEUE: "SET_QUEUE"
    }
  };

  return <PlayerProvider value={contextValue}>{children}</PlayerProvider>;
};

// Decorator to provide PlayerContext
const withPlayerProvider = (Story, context) => {
  const {
    queue = mockTracks,
    currentIndex = 0,
    isPlaying = false
  } = context.args;

  return (
    <div className="bg-gray-900 min-h-screen relative">
      <MockPlayerProvider
        queue={queue}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
      >
        <div className="p-8 text-white">
          <h2>Main Content Area</h2>
          <p>The Queue Panel slides in from the right when visible.</p>
        </div>
        <Story />
      </MockPlayerProvider>
    </div>
  );
};

export default {
  title: "Molecular/QueuePanel",
  component: QueuePanel,
  decorators: [withPlayerProvider],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
QueuePanel is a comprehensive queue management component for music streaming applications.

## Features
- **Drag & Drop Reordering**: Touch-friendly drag and drop with visual feedback
- **Queue Management**: Add, remove, clear with undo functionality
- **Now Playing Display**: Highlighted current track with large artwork
- **Bulk Actions**: Shuffle queue, save as playlist, clear all
- **Statistics**: Track count and total duration display
- **Responsive Design**: Adapts to mobile and desktop layouts
- **Accessibility**: Full keyboard navigation and screen reader support
- **Animations**: Smooth transitions and drag feedback

## Usage
\`\`\`jsx
<QueuePanel
  visible={queueVisible}
  onClose={() => setQueueVisible(false)}
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    visible: {
      description: "Whether the queue panel is visible",
      control: "boolean"
    },
    queue: {
      description: "Array of tracks in the queue",
      control: "object"
    },
    currentIndex: {
      description: "Index of currently playing track",
      control: "number"
    },
    isPlaying: {
      description: "Whether audio is currently playing",
      control: "boolean"
    },
    onClose: {
      description: "Close panel handler",
      action: "close"
    }
  }
};

// Default story
export const Default = {
  args: {
    visible: true,
    queue: mockTracks,
    currentIndex: 0,
    isPlaying: false,
    onClose: action("close")
  }
};

// Hidden state
export const Hidden = {
  args: {
    ...Default.args,
    visible: false
  },
  parameters: {
    docs: {
      description: {
        story: "Queue panel in hidden state (not visible)."
      }
    }
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
        story: "Queue panel with currently playing track showing pause button."
      }
    }
  }
};

// Different current track
export const DifferentCurrentTrack = {
  args: {
    ...Default.args,
    currentIndex: 2,
    isPlaying: true
  },
  parameters: {
    docs: {
      description: {
        story:
          "Queue panel with a different track as the current playing track."
      }
    }
  }
};

// Empty queue
export const EmptyQueue = {
  args: {
    ...Default.args,
    queue: [],
    currentIndex: 0
  },
  parameters: {
    docs: {
      description: {
        story: "Queue panel with empty queue showing empty state message."
      }
    }
  }
};

// Single track
export const SingleTrack = {
  args: {
    ...Default.args,
    queue: [mockTracks[0]],
    currentIndex: 0,
    isPlaying: true
  },
  parameters: {
    docs: {
      description: {
        story: "Queue panel with only one track (no up next section)."
      }
    }
  }
};

// Large queue
export const LargeQueue = {
  args: {
    ...Default.args,
    queue: mockLargeTracks,
    currentIndex: 5,
    isPlaying: true
  },
  parameters: {
    docs: {
      description: {
        story:
          "Queue panel with many tracks showing scrollable list and statistics."
      }
    }
  }
};

// Interactive showcase
export const InteractiveShowcase = {
  render: () => {
    const [visible, setVisible] = useState(true);
    const [queue, setQueue] = useState(mockTracks);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    return (
      <div className="bg-gray-900 min-h-screen relative">
        <div className="p-8 text-white space-y-4">
          <h2 className="text-2xl font-bold">Interactive Queue Demo</h2>

          <div className="space-x-2">
            <button
              onClick={() => setVisible(!visible)}
              className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm"
            >
              {visible ? "Hide" : "Show"} Queue
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % queue.length)
              }
              className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
              disabled={queue.length === 0}
            >
              Next Track
            </button>
          </div>

          <div className="text-sm text-gray-300">
            <p>Queue: {queue.length} tracks</p>
            <p>Current: {queue[currentIndex]?.title || "None"}</p>
            <p>Status: {isPlaying ? "Playing" : "Paused"}</p>
          </div>

          <div className="text-xs text-gray-400">
            Try dragging tracks to reorder, removing tracks, or using the action
            buttons!
          </div>
        </div>

        <MockPlayerProvider
          queue={queue}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
        >
          <QueuePanel visible={visible} onClose={() => setVisible(false)} />
        </MockPlayerProvider>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive demonstration with working drag & drop, queue management, and state updates."
      }
    }
  }
};

// Drag and drop showcase
export const DragAndDropShowcase = {
  args: {
    ...Default.args,
    queue: mockTracks.slice(0, 6), // Smaller set for better demo
  },
  parameters: {
    docs: {
      description: {
        story:
          "Queue panel optimized for demonstrating drag and drop functionality."
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
        story: "Mobile-optimized queue panel with touch-friendly interactions."
      }
    }
  }
};

// Actions showcase
export const ActionsShowcase = {
  render: () => {
    const [queue, setQueue] = useState(mockTracks);
    const [actionLog, setActionLog] = useState([]);

    const logAction = (action) => {
      setActionLog((prev) => [
        ...prev.slice(-4),
        `${new Date().toLocaleTimeString()}: ${action}`,
      ]);
    };

    return (
      <div className="bg-gray-900 min-h-screen relative">
        <div className="p-8 text-white space-y-4">
          <h2 className="text-2xl font-bold">Queue Actions Demo</h2>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Action Log:</h3>
            <div className="text-sm text-gray-300 font-mono space-y-1">
              {actionLog.length === 0 ? (
                <p>Perform actions in the queue to see logs here...</p>
              ) : (
                actionLog.map((log, index) => <div key={index}>{log}</div>)
              )}
            </div>
          </div>

          <div className="text-sm text-gray-400">
            Try the action buttons in the queue: Clear, or remove
            individual tracks.
          </div>
        </div>

        <MockPlayerProvider queue={queue} currentIndex={0} isPlaying={false}>
          <QueuePanel
            visible={true}
            onClose={() => logAction("Queue closed")}
          />
        </MockPlayerProvider>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstration of queue management actions with visual feedback."
      }
    }
  }
};

// Accessibility showcase
export const AccessibilityShowcase = {
  render: () => (
    <div className="bg-gray-900 min-h-screen relative">
      <div className="p-8 text-white space-y-4">
        <h2 className="text-xl font-bold">Accessibility Features</h2>

        <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 space-y-2">
          <h3 className="font-semibold">Keyboard Navigation:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <kbd>Tab</kbd> - Navigate between elements
            </li>
            <li>
              <kbd>Enter/Space</kbd> - Activate buttons and play tracks
            </li>
            <li>
              <kbd>Escape</kbd> - Close queue panel
            </li>
            <li>
              <kbd>Arrow keys</kbd> - Navigate track list
            </li>
          </ul>

          <h3 className="font-semibold mt-4">Screen Reader Support:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Proper ARIA labels for all interactive elements</li>
            <li>Live regions for dynamic content updates</li>
            <li>Semantic structure with headings and lists</li>
            <li>Descriptive text for drag and drop actions</li>
          </ul>

          <h3 className="font-semibold mt-4">Visual Accessibility:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>High contrast focus indicators</li>
            <li>Clear visual hierarchy</li>
            <li>Sufficient color contrast ratios</li>
            <li>Reduced motion respect</li>
          </ul>
        </div>

        <div className="text-xs text-gray-400">
          Try using Tab key to navigate and screen reader to hear announcements!
        </div>
      </div>

      <MockPlayerProvider queue={mockTracks} currentIndex={1} isPlaying={true}>
        <QueuePanel visible={true} onClose={action("close")} />
      </MockPlayerProvider>
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

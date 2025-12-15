// src/components/PlayerProgress.stories.js
import { useState, useEffect } from "react";
import { action } from "@storybook/addon-actions";
import PlayerProgress from "./PlayerProgress";
import { PlayerProvider } from "../context/PlayerContext";

// Mock PlayerContext with controllable state
const MockPlayerProvider = ({
  children,
  currentTime = 0,
  duration = 240,
  isPlaying = false
}) => {
  const [mockState, setMockState] = useState({
    currentTime,
    duration,
    isPlaying,
    queue: [{ id: "1", title: "Mock Song", artist: "Mock Artist" }],
    currentIndex: 0
  });

  useEffect(() => {
    if (isPlaying && duration > 0) {
      const interval = setInterval(() => {
        setMockState((prev) => ({
          ...prev,
          currentTime: Math.min(prev.currentTime + 1, duration)
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  const mockDispatch = (action) => {
    if (action.type === "SET_CURRENT_TIME") {
      setMockState((prev) => ({ ...prev, currentTime: action.payload }));
    }
  };

  const contextValue = {
    state: mockState,
    dispatch: mockDispatch,
    actions: { SET_CURRENT_TIME: "SET_CURRENT_TIME" }
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
  const { currentTime = 0, duration = 240, isPlaying = false } = context.args;

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <MockPlayerProvider
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
      >
        <Story />
      </MockPlayerProvider>
    </div>
  );
};

export default {
  title: "Molecular/PlayerProgress",
  component: PlayerProgress,
  decorators: [withPlayerProvider],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
PlayerProgress is a comprehensive progress bar component for music playback with seek functionality.

## Features
- **Interactive Seek Bar**: Click and drag to seek to any position
- **Buffer Visualization**: Shows buffered content ranges
- **Time Display**: Current time and total duration formatting
- **Hover Preview**: Time tooltip on hover
- **Touch Support**: Mobile-friendly touch interactions
- **Keyboard Navigation**: Arrow keys for seeking, Home/End for jump
- **Accessibility**: Full screen reader support and ARIA labels
- **Multiple Variants**: Default, mini, and full size options

## Usage
\`\`\`jsx
<PlayerProgress
  variant="default"
  showTimes={true}
  showBuffer={true}
  className="w-full"
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    variant: {
      description: "Visual variant of the progress bar",
      control: "select",
      options: ["default", "mini", "full"]
    },
    showTimes: {
      description: "Show current time and duration",
      control: "boolean"
    },
    showBuffer: {
      description: "Show buffer indicators",
      control: "boolean"
    },
    currentTime: {
      description: "Current playback time in seconds",
      control: { type: "range", min: 0, max: 300 }
    },
    duration: {
      description: "Total duration in seconds",
      control: { type: "range", min: 0, max: 300 }
    },
    isPlaying: {
      description: "Whether audio is currently playing",
      control: "boolean"
    }
  }
};

// Default story
export const Default = {
  args: {
    variant: "default",
    showTimes: true,
    showBuffer: true,
    currentTime: 67,
    duration: 240,
    isPlaying: false
  }
};

// Mini variant
export const MiniVariant = {
  args: {
    ...Default.args,
    variant: "mini",
    showTimes: false
  },
  parameters: {
    docs: {
      description: {
        story:
          "Compact mini variant suitable for now playing bars and small spaces."
      }
    }
  }
};

// Full variant
export const FullVariant = {
  args: {
    ...Default.args,
    variant: "full"
  },
  parameters: {
    docs: {
      description: {
        story:
          "Full-size variant with larger interactive area for main player views."
      }
    }
  }
};

// Without times
export const WithoutTimes = {
  args: {
    ...Default.args,
    showTimes: false
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar without time displays for minimal layouts."
      }
    }
  }
};

// Without buffer
export const WithoutBuffer = {
  args: {
    ...Default.args,
    showBuffer: false
  },
  parameters: {
    docs: {
      description: {
        story:
          "Progress bar without buffer visualization for simplified appearance."
      }
    }
  }
};

// Empty state
export const EmptyState = {
  args: {
    ...Default.args,
    currentTime: 0,
    duration: 0
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no track is loaded or duration is unknown."
      }
    }
  }
};

// Long duration
export const LongDuration = {
  args: {
    ...Default.args,
    currentTime: 1847, // 30:47
    duration: 3661, // 1:01:01
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar with long duration showing hour formatting."
      }
    }
  }
};

// Near end
export const NearEnd = {
  args: {
    ...Default.args,
    currentTime: 235,
    duration: 240
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar near the end of playback."
      }
    }
  }
};

// Just started
export const JustStarted = {
  args: {
    ...Default.args,
    currentTime: 3,
    duration: 240
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar at the beginning of playback."
      }
    }
  }
};

// Playing state
export const PlayingState = {
  args: {
    ...Default.args,
    isPlaying: true,
    currentTime: 45
  },
  parameters: {
    docs: {
      description: {
        story:
          "Progress bar in playing state with visual feedback and auto-advancement."
      }
    }
  }
};

// Interactive showcase
export const InteractiveShowcase = {
  render: () => {
    const [currentTime, setCurrentTime] = useState(67);
    const [isPlaying, setIsPlaying] = useState(false);
    const duration = 240;

    useEffect(() => {
      if (isPlaying) {
        const interval = setInterval(() => {
          setCurrentTime((prev) => Math.min(prev + 1, duration));
        }, 1000);

        return () => clearInterval(interval);
      }
    }, [isPlaying, duration]);

    return (
      <div className="space-y-8">
        <div className="text-white">
          <h3 className="text-lg font-bold mb-4">Interactive Progress Bar</h3>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded mb-4"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>

        <MockPlayerProvider
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
        >
          <PlayerProgress
            variant="default"
            showTimes={true}
            showBuffer={true}
          />
        </MockPlayerProvider>

        <div className="text-gray-400 text-sm">
          Click anywhere on the progress bar to seek, or use the play button to
          see auto-advancement.
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive demonstration with working seek functionality and play/pause."
      }
    }
  }
};

// Variant comparison
export const VariantComparison = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-white mb-4">Full Variant</h3>
        <MockPlayerProvider currentTime={67} duration={240}>
          <PlayerProgress variant="full" showTimes={true} showBuffer={true} />
        </MockPlayerProvider>
      </div>

      <div>
        <h3 className="text-white mb-4">Default Variant</h3>
        <MockPlayerProvider currentTime={67} duration={240}>
          <PlayerProgress
            variant="default"
            showTimes={true}
            showBuffer={true}
          />
        </MockPlayerProvider>
      </div>

      <div>
        <h3 className="text-white mb-4">Mini Variant</h3>
        <MockPlayerProvider currentTime={67} duration={240}>
          <PlayerProgress variant="mini" showTimes={true} showBuffer={true} />
        </MockPlayerProvider>
      </div>

      <div>
        <h3 className="text-white mb-4">Mini Without Times</h3>
        <MockPlayerProvider currentTime={67} duration={240}>
          <PlayerProgress variant="mini" showTimes={false} showBuffer={true} />
        </MockPlayerProvider>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Comparison of all available variants and configuration options."
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
        story: "Mobile-optimized touch interactions and responsive design."
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
          <li>
            Keyboard navigation: Left/Right arrows (±5s), Home/End (start/end)
          </li>
          <li>ARIA slider role with proper min/max/current values</li>
          <li>Screen reader announcements for time changes</li>
          <li>Focus indicators for keyboard users</li>
          <li>Touch-friendly target sizes for mobile</li>
          <li>High contrast mode support</li>
        </ul>
      </div>

      <MockPlayerProvider currentTime={67} duration={240}>
        <PlayerProgress variant="default" showTimes={true} showBuffer={true} />
      </MockPlayerProvider>

      <div className="text-xs text-gray-400 mt-4 p-4 bg-gray-800 rounded-lg">
        Try keyboard navigation: Focus the progress bar and use arrow keys,
        Home, or End
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

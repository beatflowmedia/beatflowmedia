# Web Player Agent

## Overview
Implements browser playback using MSE and WebAudio APIs, supporting gapless/crossfade and tokenized playback.

## Key Files
- `PlayerEngine.js`: Core MSE player for HLS/DASH playback.
- `AudioGraph.js`: WebAudio crossfade/gapless logic.
- `manifestFetcher.js`: Fetches manifests with playback token.

## Flow
1. Request playback token from backend.
2. Fetch manifest with token.
3. Initialize MSE, append segments.
4. Use AudioGraph for crossfade/gapless transitions.

## Monitoring
- Track playback errors, buffer underruns, and adaptive bitrate switches.
- Emit analytics events for playback lifecycle.

## Testing
- E2E: play, seek, crossfade, adaptive bitrate.

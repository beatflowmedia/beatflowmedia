# Analytics Agent

## Overview
Captures and processes playback and product analytics events for monitoring and reporting.

## Key Files
- `collector.js`: Collects and logs events.
- `api/collector/events.js`: API endpoint for event ingestion.

## Event Shape
```
{
  "event": "playback_start",
  "user_id": "user:123",
  "asset_id": "track:abc123",
  "ts": 1695043200,
  "session_id": "uuid",
  "playback_token_jti": "jwtid",
  "meta": { "bitrate": "256", "device": "Chrome" }
}
```

## Monitoring
- Track event throughput, error rates, and collector latency.
- Alert on event ingestion failures or spikes.

## Testing
- Simulate high event rates, validate collector throughput.

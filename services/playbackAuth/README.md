# Playback Authorization Agent

## Overview
Handles issuance of short-lived JWT playback tokens and audit logging for secure, tokenized playback.

## Key Files
- `tokenService.js`: Issues playback tokens, builds manifest URLs.
- `auditService.js`: Logs token issuance for compliance.
- `middleware/entitlementCheck.js`: Validates user entitlement before token issuance.

## API Contract
- `POST /api/playback/token`: Issues playback token for requested asset.

## JWT Claims Example
```
{
  "iss": "beatflow-auth",
  "sub": "user:<userId>",
  "aud": "beatflow-playback",
  "asset_id": "track:abc123",
  "scopes": ["play"],
  "territory": "US",
  "exp": 1695043200,
  "nonce": "random-uuid"
}
```

## Monitoring
- Log token issuance and failures.
- Alert on high token failure rates.

## Testing
- Unit: entitlement check, JWT claims.
- Integration: token issuance, manifest access.

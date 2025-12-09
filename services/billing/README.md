# Entitlement & Billing Agent

## Overview
Checks user entitlements and records play events for royalty/accounting.

## Key Files
- `entitlementService.js`: Validates user entitlement for playback.
- `ledgerService.js`: Records play events for audit/royalty.
- `api/billing/entitlementCheck.js`: API endpoint for entitlement validation.

## Monitoring
- Track entitlement check failures and ledger entry rates.
- Alert on entitlement errors or suspicious activity.

## Testing
- Unit: entitlement logic, ledger entry creation.
- Integration: entitlement check API, ledger recording.

#!/usr/bin/env bash
#
# Set the LIVE Stripe account's business profile and statement descriptor.
#
# These were all unset, which matters most for the descriptor: it is the text that
# appears on a cardholder's bank statement, and an unrecognised descriptor is a leading
# cause of "I didn't authorise this" disputes. support_email and support_url are what
# Stripe surfaces on receipts and in dispute handling.
#
# Run it yourself:
#     bash scripts/stripe-business-profile.sh
#
# It writes to the LIVE account on purpose -- a descriptor set only in test mode changes
# nothing a customer ever sees. It is idempotent: running it twice sets the same values.
set -euo pipefail

# Git Bash rewrites /v1/... into a Windows path and Stripe replies with an error that
# reads like a bad endpoint. Harmless elsewhere.
export MSYS_NO_PATHCONV=1

# The canonical account, asserted against the dashboard on 2026-10-06.
ACCOUNT="acct_1Bn3cBAEum2hO0KZ"

# Max 22 characters, must contain a letter, and no < > \ " ' characters.
# BEATFLOWMEDIAGROUP is 18 and matches the domain, so a cardholder can recognise it.
DESCRIPTOR="BEATFLOWMEDIAGROUP"
URL="https://beatflowmediagroup.com"
SUPPORT_EMAIL="support@beatflowmediagroup.com"
SUPPORT_URL="https://beatflowmediagroup.com/support"   # this route exists in AppRoutes.js

# --- refuse to write to the wrong account -----------------------------------------
# The CLI has been pointed at the wrong account before (it was on "NewDevBuild" until
# 2026-10-06). Asserting beats assuming: a key that works proves only that SOME account
# accepted it.
echo "Checking which account the CLI is pointed at..."
ACTUAL=$(stripe get /v1/account --live 2>/dev/null | sed -n 's/.*"id": "\(acct_[A-Za-z0-9]*\)".*/\1/p' | head -1)

if [ -z "$ACTUAL" ]; then
  echo "REFUSING: could not read the live account. Run 'stripe login' first." >&2
  exit 1
fi

if [ "$ACTUAL" != "$ACCOUNT" ]; then
  echo "REFUSING: CLI is on $ACTUAL, expected $ACCOUNT (BeatFlowMediaGroup)." >&2
  exit 1
fi

echo "On $ACTUAL. Applying business profile..."

stripe post "/v1/accounts/${ACCOUNT}" \
  -d "business_profile[url]=${URL}" \
  -d "business_profile[support_email]=${SUPPORT_EMAIL}" \
  -d "business_profile[support_url]=${SUPPORT_URL}" \
  -d "settings[payments][statement_descriptor]=${DESCRIPTOR}" \
  --live > /dev/null

# --- read it back ------------------------------------------------------------------
# Verify writes you cannot see the result of. A 200 from the API is not proof the values
# landed the way they were meant to -- Stripe normalises the descriptor, for one.
echo ""
echo "Read-back:"
stripe get /v1/account --live 2>/dev/null | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  const o=JSON.parse(s);
  console.log('  statement_descriptor :', o.settings?.payments?.statement_descriptor || '(unset)');
  console.log('  support_email        :', o.business_profile?.support_email || '(unset)');
  console.log('  support_url          :', o.business_profile?.support_url || '(unset)');
  console.log('  url                  :', o.business_profile?.url || '(unset)');
});"

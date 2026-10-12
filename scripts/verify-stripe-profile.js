// scripts/verify-stripe-profile.js
//
// Reports which public-facing settings are missing on the LIVE Stripe account, and says
// where to set them. It does not write, because it CANNOT write.
//
// This file replaces scripts/stripe-business-profile.sh, which tried to PATCH the account
// over the API and silently failed. Stripe's answer is unambiguous:
//
//   "You cannot use this method on your own account: you may only use it on connected
//    accounts."
//
// POST /v1/accounts/{id} is for Connect connected accounts. A platform's own account is
// edited in the Dashboard and nowhere else. The old script asserted the account, applied
// nothing, and printed a read-back showing everything still unset -- which at least made
// the failure visible, but a script named "set the business profile" that cannot set the
// business profile is worse than no script.
//
//   npm run verify:stripe-profile
//
// Why it matters, in order of what it costs:
//
//   statement_descriptor  the text on a cardholder's bank statement. Unset means the
//                         charge appears as something they do not recognise, and an
//                         unrecognised charge is a leading cause of disputes. A dispute
//                         costs the fee plus the amount, and a rising dispute rate
//                         threatens the account itself
//   support_email/url     what Stripe shows on receipts and during a dispute. A buyer
//                         who can find you asks you first instead of their bank
//   business url          same, and it is what a reviewer looks at
const { execFileSync } = require('child_process');

const ACCOUNT = 'acct_1Bn3cBAEum2hO0KZ';
process.env.MSYS_NO_PATHCONV = '1';

function live(resource) {
  try {
    return JSON.parse(execFileSync('stripe', ['get', resource, '--live'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
    }));
  } catch (err) {
    const text = (err.stdout || '') + (err.stderr || err.message || '');
    if (/not configured API keys|stripe login/i.test(text)) {
      console.error('The Stripe CLI is not authenticated for live mode. Run `stripe login`.');
      process.exit(2);
    }
    console.error('stripe CLI call failed: ' + text.split('\n')[0].slice(0, 160));
    process.exit(2);
  }
}

const account = live('/v1/account');
if (account.error) {
  console.error('Could not read the account: ' + account.error.message);
  process.exit(2);
}
if (account.id !== ACCOUNT) {
  console.error('WRONG ACCOUNT: CLI is on ' + account.id + ', expected ' + ACCOUNT + '.');
  process.exit(1);
}

const want = [
  ['statement_descriptor', account.settings?.payments?.statement_descriptor, 'BEATFLOWMEDIAGROUP',
    'Settings -> Payments (what shows on a bank statement)'],
  ['business_profile.url', account.business_profile?.url, 'https://beatflowmediagroup.com',
    'Settings -> Business'],
  ['business_profile.support_email', account.business_profile?.support_email, 'support@beatflowmediagroup.com',
    'Settings -> Business'],
  ['business_profile.support_url', account.business_profile?.support_url, 'https://beatflowmediagroup.com/support',
    'Settings -> Business']
];

console.log('account : ' + account.id + '  (BeatFlowMediaGroup, live)');
console.log('');

const missing = want.filter(([, actual]) => !actual);
want.forEach(([name, actual, suggested]) => {
  console.log('  ' + (actual ? 'SET    ' : 'MISSING') + '  ' + name.padEnd(32) + (actual || '-> suggest: ' + suggested));
});

if (!missing.length) {
  console.log('');
  console.log('All public-facing settings are present.');
  process.exit(0);
}

console.log('');
console.log(missing.length + ' setting(s) missing. These CANNOT be set over the API -- Stripe allows');
console.log('POST /v1/accounts only on connected accounts, not your own. Set them here:');
console.log('');
[...new Set(missing.map(([, , , where]) => where))].forEach((w) => console.log('  ' + w));
console.log('');
console.log('Then re-run this to confirm.');
process.exit(1);

// functions/billingKillswitch.js
//
// The only hard stop on Blaze spend.
//
// A Cloud Billing budget is an ALERT. It emails when you cross a threshold and it
// does not stop anything -- Firestore, Storage and Functions keep billing while the
// mail sits unread. The only mechanism that actually halts spend is detaching the
// billing account from the project, and the only way to automate that is this:
//
//     Budget  ->  Pub/Sub topic  ->  this function  ->  updateBillingInfo({billingAccountName: ''})
//
// WHAT THIS DOES WHEN IT FIRES
// It takes the whole project offline. Firestore stops serving, Storage stops
// serving, functions stop running, the site's data layer dies. That is the point --
// it is a fuse, not a throttle -- but it means an over-eager trigger is its own
// outage. Hence two deliberate safeguards:
//
//   1. It is DISARMED unless BILLING_KILLSWITCH_ARMED === 'true'. Deploying this
//      file does not arm it. You opt in once you have watched it log a few cycles
//      and trust the numbers.
//   2. It only fires when actual cost has met or passed the FULL budget, not at the
//      50%/90% forecast thresholds a budget also publishes. Forecasts are guesses;
//      detaching billing on a guess is unacceptable.
//
// Uses google-auth-library, which firebase-admin already depends on, rather than
// @google-cloud/billing -- two REST calls do not justify another SDK on a cold
// start. It is declared explicitly in package.json so it is not a hidden
// transitive dependency.

const {onMessagePublished} = require('firebase-functions/v2/pubsub');
const {GoogleAuth} = require('google-auth-library');

const BILLING_SCOPE = 'https://www.googleapis.com/auth/cloud-billing';
const BILLING_API = 'https://cloudbilling.googleapis.com/v1';

// Must match the topic the budget publishes to (Cloud Billing > Budgets > Manage
// notifications). Overridable so a staging project can use a different name.
const TOPIC = process.env.BILLING_BUDGET_TOPIC || 'billing-alerts';

function projectId() {
  return process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'beatflowmedia';
}

async function billingClient() {
  const auth = new GoogleAuth({scopes: [BILLING_SCOPE]});
  return auth.getClient();
}

/** Returns the billing account currently attached, or '' if already detached. */
async function currentBillingAccount(client, project) {
  const res = await client.request({
    url: `${BILLING_API}/projects/${project}/billingInfo`,
    method: 'GET'
  });
  return (res.data && res.data.billingAccountName) || '';
}

async function detachBilling(client, project) {
  await client.request({
    url: `${BILLING_API}/projects/${project}/billingInfo`,
    method: 'PUT',
    data: {billingAccountName: ''}
  });
}

exports.billingKillswitch = onMessagePublished(TOPIC, async (event) => {
  let notification;
  try {
    notification = event.data.message.json;
  } catch (error) {
    console.error('[killswitch] budget message was not JSON, ignoring:', error.message);
    return;
  }

  const cost = Number(notification.costAmount);
  const budget = Number(notification.budgetAmount);
  const currency = notification.currencyCode || 'USD';

  if (!Number.isFinite(cost) || !Number.isFinite(budget)) {
    console.error('[killswitch] missing costAmount/budgetAmount, ignoring', notification);
    return;
  }

  // Log every cycle, armed or not. This is how you learn what normal looks like
  // before trusting the thing to pull the plug.
  console.log(
    `[killswitch] budget cycle: ${currency} ${cost.toFixed(2)} of ${budget.toFixed(2)} ` +
    `(${budget ? Math.round((cost / budget) * 100) : 0}%)`
  );

  if (cost < budget) return;

  if (process.env.BILLING_KILLSWITCH_ARMED !== 'true') {
    console.warn(
      `[killswitch] BUDGET EXCEEDED (${currency} ${cost.toFixed(2)} >= ${budget.toFixed(2)}) ` +
      'but the killswitch is DISARMED, so billing is untouched. ' +
      'Set BILLING_KILLSWITCH_ARMED=true to make this stop spend.'
    );
    return;
  }

  const project = projectId();
  try {
    const client = await billingClient();
    const attached = await currentBillingAccount(client, project);

    if (!attached) {
      console.log('[killswitch] billing already detached, nothing to do');
      return;
    }

    await detachBilling(client, project);
    console.error(
      `[killswitch] BILLING DETACHED from ${project}. The project is now offline. ` +
      `Triggered at ${currency} ${cost.toFixed(2)} against a ${budget.toFixed(2)} budget. ` +
      'Re-attach in the Cloud console once the cause is understood.'
    );
  } catch (error) {
    // A failure here means spend continues. Loud, and never swallowed.
    console.error('[killswitch] FAILED to detach billing, spend continues:', error.message);
    throw error;
  }
});

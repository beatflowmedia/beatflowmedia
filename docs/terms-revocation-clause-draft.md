# Draft clause: refunds and chargebacks terminate a license

**Status: DRAFT. Not published. Needs review by a lawyer admitted in New Jersey before it goes near the live Terms.**

**Written for:** a lawyer reviewing BeatFlow Media Group's download license terms. It assumes no familiarity with the codebase, so the behaviour the clause describes is set out in full below.

---

## Why this is needed

The published Terms at `/terms` already say a license terminates on breach:

> A download license terminates automatically and immediately if you breach any restriction above. On termination you must stop using the recording and delete all copies in your possession. Termination for breach does not entitle you to a refund and does not limit any other remedy available to us.

The trigger is **breach of a usage restriction** — using the recording outside the granted scope. Requesting a refund, or disputing the charge with a card issuer, is not a usage breach. So under the current text, **a buyer who reverses their payment keeps a valid license.**

The platform now revokes that license automatically. The Terms need to say so, or the software is doing something the contract does not describe.

## What the software actually does

This is the behaviour the clause must match. It is deliberately narrower than "any money back ends the license".

| Event | License outcome |
|---|---|
| Full refund of the purchase | **Terminated** |
| Partial refund (e.g. $2 back on a $12 album) | **Unaffected** — treated as a price adjustment |
| Refund issued with an internal "keep license" flag | **Unaffected** — a deliberate goodwill refund |
| Chargeback / payment dispute raised with the card issuer | **Terminated** |
| A refund that is later escalated to a chargeback | Terminated, recorded as a chargeback |

On termination the platform stops serving the recording to that account. Every revocation is recorded with a reason, a timestamp, and the fact that it was automatic.

**What it cannot do, and the clause must not imply otherwise:** the downloaded file is not recoverable. Files are delivered without DRM. Termination ends the *right to use* the recording; it does not and cannot delete the copy the buyer already has. Any drafting that suggests we retrieve or disable delivered files would be inaccurate.

## Proposed text

To be added to the **Termination of a License** section, after the existing paragraph.

> **Termination on reversal of payment.** A download license is granted in exchange for payment. If the payment for a recording is reversed — whether by a full refund, or by a chargeback or payment dispute raised with your card issuer or payment provider — the license granted by that purchase terminates automatically and immediately on the reversal. On termination you must stop using the recording and delete all copies in your possession, and we may decline to supply the recording to you again.
>
> A partial refund does not terminate a license. Where we issue a refund and tell you in writing that your license continues, it continues.
>
> Because recordings are delivered as files, we cannot recover a file you have already downloaded. Termination ends your right to use the recording; any use of it after termination is unlicensed.

## Points for the reviewer

1. **Statutory rights.** The existing Refunds section says all sales are final, with a carve-out for our failure to deliver, and closes with a note that nothing limits non-waivable statutory rights. Does the reversal clause need its own equivalent saving? Consumer withdrawal rights for digital content differ by jurisdiction, and the platform sells internationally.

2. **Chargeback versus refund.** Terminating on a chargeback is a response to a payment reversal we did not choose. Terminating on a refund we granted is different in character. The draft treats them identically. Is that defensible, given a buyer may request a refund in good faith over a genuine problem?

3. **Interaction with the clickwrap.** At checkout, buyers accept a versioned license summary (currently `download-license@2026-09-19`). The accepted version is recorded against the purchase. If this clause is added, the summary and its version will need to change too, and the two must say the same thing. Buyers who purchased under the old version accepted terms that did not contain it.

4. **Disclosure timing.** This should be visible before payment, not only in the Terms. The clickwrap is the natural place.

5. **"Delete all copies".** Already in the existing termination paragraph. Worth confirming it is enforceable and worth keeping, given we cannot verify compliance.

## Not legal advice

I drafted this to describe the platform's real behaviour accurately. I am not a lawyer and this is not legal advice. Whether these terms are enforceable, whether they comply with New Jersey and federal consumer protection law, and whether they survive contact with EU or UK consumers, are all questions for counsel.

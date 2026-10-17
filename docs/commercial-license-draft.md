# Draft: one-off commercial licence

**Status: PUBLISHED AS `commercial-license@2026-10-17` and in force. Not reviewed by a lawyer.**

**Written for:** a lawyer reviewing BeatFlow Media Group's one-off commercial licence. It assumes no familiarity with the platform, so the behaviour the clauses describe is set out in full. Read `sync-license-draft.md` alongside it — several questions there apply here and are not repeated.

This is the **third** licence BFMG sells under, and it exists because neither of the other two fits the production library. Reusing one would have been the cheaper path and the wrong one:

- The **download licence** (`download-license@2026-10-15`) expressly forbids synchronisation. Recording it against a $319 collection purchase would produce evidence that the buyer agreed *not* to do the thing they paid to do.
- The **subscription sync licence** (`sync-license@2026-10-16`) is worded throughout as "while your subscription is active". Recording it against a one-off sale would describe a grant that ends, when what was sold does not.

---

## What is being sold

A permanent, worldwide, non-exclusive commercial licence over named recordings, for a single payment. Three things can be bought this way:

| Purchase | Price | Basis |
|---|---|---|
| A single track from the production library | $29 | `COMMERCIAL_TRACK_PRICE` |
| A single released song | $79 | `COMMERCIAL_RELEASE_TRACK_PRICE` — a production cue is background; a released single carries the scene |
| A collection (10–56 tracks) | $179–$319 | A volume curve, `baseRate × n^0.6`, rounded to a trailing 9 |

The curve is monotonic by construction, so buying more tracks never costs less. Largest real example: 56 tracks for $319, about $5.70 a track against $29 bought singly.

## The permitted uses

Video (YouTube, TikTok, Instagram, Facebook, client films, course content), podcasts, apps, games, presentations, installations, and work delivered to the licensee's own clients under their own name. Monetised content is permitted, worldwide, with no view or download cap.

## The two durations problem does *not* arise here

This is the main drafting difference from the subscription licence, and it simplifies rather than complicates. The subscription grant is time-bound while the clearance of each published work is perpetual — two durations in one document, and the question of *when* something was published becomes load-bearing.

Here there is one duration: perpetual. No renewal date, no clock, nothing to prove about publication timing. The licence either exists or it does not, and `/verify/<id>` answers that.

**The exception, and it needs a reviewer's eye.** Two things still end a perpetual licence, and both are already implemented (`netlify/functions/lib/payment-reversal.js`):

1. breach of the terms
2. the payment being reversed — a full refund or a chargeback

So "permanent" in the marketing copy means "no expiry date", not "unconditional". The point-of-sale summary says so in those words. Whether that is clear enough to a buyer who read "permanent" first is question 1 below.

## Client work — the clause with the most exposure

The licence permits work delivered to the licensee's own clients. That is not a courtesy; a video editor who cannot hand a finished film to the client who commissioned it has nothing to buy. But it means a recording reaches a party who never accepted these terms, and the chain of title runs through the licensee.

What the published text does: it licenses the *licensee* to include the recordings in work they deliver. It does not grant the end client a separate licence, and it does not permit the client to extract the music and reuse it. BFMG's recourse if they do is against the licensee.

**This is the part a reviewer should push hardest on.** It is also where the per-seat / per-entity question lives: an "Agency" buying one $319 collection and using it across forty client projects is the intended use; forty agencies sharing one purchase is not, and the text relies on non-transferability to say so.

## Exclusions

Broadcast television and radio, cinema release, paid advertising campaigns (TV, radio, cinema or paid social spend), resale or sublicensing of the music on its own, AI/ML training, and registering the recordings with a rights or royalty collection service.

The last one is easy to overlook and is the most practically damaging if it happens: a licensee who registers a BFMG recording with a collection society or a Content ID partner can cause claims against *other* licensees and against BFMG itself.

## What the platform can actually deliver

| Claim | Basis |
|---|---|
| We will not claim or mute a licensee's video | BFMG has never purchased DistroKid's Social Media Pack for any release, so no recording is enrolled in YouTube Content ID or Meta Rights Manager. Enrolment is opt-in and paid. |
| Worldwide, non-exclusive | BFMG controls the masters; nothing is licensed exclusively to anyone. |
| Monetised content permitted | Nothing prevents it once the above holds. |
| A verifiable, dated record | Every licence carries a certificate and a public `/verify/<id>` page. |

**Stated as a risk rather than hidden:** AI-generated music can occasionally trigger a false match from an unrelated rights holder whose catalogue it resembles. Outside BFMG's control. The terms say "we do not claim" — not "no claim can occur."

## What the software actually records

So a reviewer can see that the text is not wider than the system:

| Field | Value for this product | Where |
|---|---|---|
| `licenseScope` | `commercial` | `licenses` collection |
| `licenseTerm` | `perpetual` | `licenses` collection |
| `licenseGrant` | `sync` | `licenses` collection |
| `acceptedAgreement` | `commercial-license@2026-10-17` | `purchases` and `licenses` |
| `acceptedAt` | server-stamped ISO timestamp | `purchases` and `licenses` |

The acceptance identifier is demanded by the server, not merely accepted from the client: `create-checkout` derives which agreement governs the sale from the product and refuses anything else, including a *valid* acceptance of the wrong agreement.

## Statutory cancellation rights

Captured the same way as the download licence, and the reasoning is the same: a one-off commercial licence is digital content supplied without a physical medium, so UK CCR 2013 reg.37 and EU CRD art.16(m) reach it identically. The buyer ticks two statements — express consent to immediate supply, and acknowledgement that this loses the 14-day cancellation right — before paying.

Without both, reg.37(4) means the consumer bears no cost for digital content supplied in the cancellation window.

This is *not* affected by CJEU C-234/25 (2026), which concerns subscriptions as digital *services*. A one-off purchase is content, not a service.

## Questions for the reviewer

1. **"Permanent" versus revocable.** Marketing says permanent; two conditions end the licence (breach, payment reversal). Is the point-of-sale wording — "It ends only if you breach these terms, or if the payment is later reversed" — sufficient, or does "permanent" need qualifying wherever it appears?

2. **Client work and chain of title.** The licence permits delivering work to the licensee's own clients but does not licence the client directly. Does that construction hold, and does it need an express statement that the end client acquires no separate right?

3. **Non-transferability as the only limit on scale.** There are no seats and no project cap. Is "non-exclusive and non-transferable" enough to distinguish one agency using a collection across many projects (intended) from many agencies sharing one purchase (not)?

4. **The collection-scope limit.** The licence covers "the recordings named on your licence". A collection is identified by a slug, and its membership is a Firestore query that could in principle change after purchase. Should the licence enumerate the recordings at the moment of sale, rather than reference the collection?

5. **AI provenance.** The recordings are AI-assisted or AI-generated, and copyright in AI material is unsettled. A commercial licensee's exposure is larger than a listener's and larger again than a subscriber's, because the work is permanent and may be client-facing. The download terms say rights here are contractual rather than asserted as copyright. Does this licence need its own, stronger version of that — and does it need a limitation of liability sized to a $319 purchase?

6. **The excluded registration clause.** Prohibiting a licensee from registering the recordings with a collection society or Content ID partner protects every other licensee. Is a contractual prohibition the right instrument, and is there a remedy worth naming if it is breached?

7. **Jurisdiction.** The Terms specify New Jersey law and AAA arbitration. A commercial licensee may be anywhere, and unlike a $1.99 download the sums here could justify litigation. Is that enforceable against an international licensee?

## Not legal advice

Drafted to describe the platform's real behaviour accurately, which is the part that can be verified. Whether any of it is enforceable has not been assessed by anyone qualified.

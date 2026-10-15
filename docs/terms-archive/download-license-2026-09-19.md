# Download License Terms — version `download-license@2026-09-19`

**Superseded on 2026-10-15 by `download-license@2026-10-15`. Kept because it is still in force for the buyers who accepted it.**

As of 2026-10-15, **2 purchases** are governed by this version (`npm run verify:terms --who` lists them). Publishing a newer version does not retroactively change their deal. That is the whole reason a version string is recorded against each purchase, and the reason this file exists: `npm run verify:terms` says plainly that *"the old version must stay readable, not be overwritten"*, and the 2026-10-15 edit overwrote it on the live page.

The full page as it stood is in git at commit `0408e44` (`git show 0408e44:src/pages/Terms.js`). The parts that changed are reproduced below verbatim.

---

## License summary shown at checkout

> **A personal download licence, kept for good.**
>
> You are licensing a personal download: you may keep the recording permanently and it does not expire. It does not cover putting the music in a video, film, game or advert, playing it to an audience, broadcasting it, remixing or editing it, including it in a compilation, resharing the file, or using it to train an AI model. Anything beyond personal listening needs a separate licence.

## Termination of a License

> A download license terminates automatically and immediately if you breach any restriction above. On termination you must stop using the recording and delete all copies in your possession. Termination for breach does not entitle you to a refund and does not limit any other remedy available to us.

## What the buyer affirmed at checkout

> I have read and agree to the Download License Terms, including that this license does not cover public performance, DJ use, remixes or redistribution.

---

## What changed in `download-license@2026-10-15`

Recorded so the difference between the two deals is legible without diffing two commits.

| | `@2026-09-19` (this version) | `@2026-10-15` |
|---|---|---|
| Termination triggers | Breach of a usage restriction only | Breach **or** reversal of payment (full refund / chargeback) |
| Stated permanence | "kept for good", "does not expire" | "no time limit", plus the two ways it can end |
| Immediate-supply consent | Not captured | Captured — buyer requests immediate delivery |
| Cancellation-right acknowledgement | Not captured | Captured — buyer accepts losing the right to cancel |
| Cancellation rights section | None | Added, disclosing the waiver before purchase |

**The two captures are the material difference.** UK Consumer Contracts Regulations 2013 reg.37 and EU Consumer Rights Directive art.16(m) allow the 14-day cancellation right to be excluded for a download only where the buyer both expressly consents to immediate supply and acknowledges losing that right. Buyers on **this** version gave neither, because they were never asked.

So for the purchases still governed by `@2026-09-19`, the statutory cancellation right was **not** validly excluded. If one of those buyers is a UK or EU consumer and is still within any applicable period, treat their cancellation right as live. Their records must not be rewritten to suggest otherwise — the acceptance record is evidence, and its value is that it says what actually happened.

**Not legal advice.** This file records what each version said and when. Whether either is enforceable in a given jurisdiction has not been reviewed by anyone qualified.

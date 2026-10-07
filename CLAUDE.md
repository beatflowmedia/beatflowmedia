# BeatFlow Media — music-license-app

Instantiates the global DOSI / mobile-first / PHAST standards in `~/.claude/CLAUDE.md`.
This file records only what has been **verified against the tree**. Unverified sections are
marked `NEEDS OWNER` rather than guessed — an invented canonical origin is worse than a
missing one.

## Stack

React 18 + CRA-via-CRACO + MUI, Firebase (Firestore/Storage/Auth), Netlify Functions,
Stripe. Dev server on `:3005` (`npm run dev`).

## Upstream rights: everything here depends on Suno's terms

The catalogue is AI-generated. Read 2026-09-19 at https://suno.com/terms. This is
UPSTREAM of pricing, pools, guards and storefronts: none of it matters if the
rights to grant are not there.

**Confirm the tier first.** Pro/Premier: *"Suno hereby assigns to you all of its
right, title and interest in and to any Output"*, and those rights are
*"perpetual and are not affected by ... the expiry, cancellation, downgrade or
suspension of your subscription"*. Free/Basic: *"lawful, personal and
non-commercial purposes"* only — nothing is sellable.

Three clauses that hit this product specifically:

1. **No copyright warranty.** *"Suno makes no representation or warranty to you
   that any copyright will vest in any Output."* Assigns whatever it owns, while
   saying it may own nothing. Licenses may still be sellable; **exclusivity may not
   be promisable**, and enforcement against a third party using the same recording
   is doubtful. Consistent with the PRO rejection noted at PRD line 451.

2. **Remix.** *"Nothing in this paragraph permits commercial use of any Remix."*
   Probably means Suno's own Remix feature rather than a third party's DJ edit —
   but it is the exact word the DJ product turns on.

3. **Watermark.** *"You agree not to remove, alter, obscure or circumvent any
   fingerprint, watermark or metadata Suno appends to an Output."* The plan to cut
   a separate promo/DJ master to avoid Content ID auto-claims is sound, but the
   process must not strip that fingerprint. Note the station's
   `normalize.js --art` already strips embedded metadata from these same files.

**THE UNRESOLVED QUESTION, and it is the business:** an assignment says you own it
and owners may license; the commercial-use section reads as *personal* commercial
exploitation, and no clause grants the user a right to sublicense. Selling sync,
DJ and download licenses IS sublicensing to third parties. Those two readings
differ. Not a question to settle by reading harder — it needs a lawyer, before
anything is sold.

Also required before selling downloads: commercial use applies only to a
*"permitted download"* obtained *"through an approved channel"* — stream-ripped or
otherwise-obtained copies are excluded.

## What this platform sells

Three product lines. Getting these confused cost real time, twice, so they are
written down rather than inferred from whichever price a page happens to show.

| Line | What the buyer gets | Who buys it | Priced |
|---|---|---|---|
| **Single** | one track | listener / creator | `SONG_PRICE` = $1.99 |
| **Album** | n tracks | listener / creator | trackCount x single, no discount |
| **Sync license** | the RIGHT to use music in a project | content creators, restaurants, spas, businesses | **NOT PRICED YET** |

Mood tracks and soundscapes are a further catalogue on the same platform, not a
separate product line.

**Single and album are the same right at two quantities. A sync license is a
different right.** That distinction is the one that keeps getting lost: an album at
`n x $1.99` and a business sync license are not points on one scale, and pricing
them as if they were is how "License for $217.50" appeared on an album page. That
number was never a decision -- it was `10 x $29.00 x 0.75` from a superseded
formula, read afterwards as an annual license.

**Sync is deliberately unpriced here.** `src/components/PurchaseOptionsDialog.js`
has the structure for a third option and does not invent one.

### Not to be confused with the PRD's numbers

`c:/BeatFlowMedia/docs/PRD.md` prices **sub-brand #1 (somatic)** at $69/track,
$199/collection, $49/mo or $449/yr practitioner. Those are a DIFFERENT CATALOGUE on
a different surface, locked 2026-04-21. They do not govern this app, and reading
them as universal is how a 35x gap looked like a contradiction.

The PRD also puts sync licensing in **sub-brand #2, on its own frontend
(`sync.bfmg`), launching after #1 validates** (PRD §4.2, §290), and lists the
existing `SyncLicensing` page under scope creep / half-built (§47). Auth is shared
across surfaces by design — "Shared backend, independent surfaces" (§84) — so sync
needs its own storefront, NOT its own login.

## Single Source — concern → canonical origin

| Concern | Canonical origin | Reconciler |
|---|---|---|
| Artwork URL for any entity | `src/utils/artwork.js` (`artworkUrl`) | `npx jest src/utils/artwork.test.js` |
| Placeholder / fallback imagery | `src/utils/placeholders.js` (`getPlaceholderImage`, `PLACEHOLDER_IMAGE`) | `npm run verify:assets` |
| Local image assets | `public/` | `npm run verify:assets` |
| Album cover field name | **NEEDS OWNER** — `cover` and `coverUrl` both in use | none yet |
| Song / album pricing | `src/utils/pricing.js` (**CommonJS**, so the station can `require` it) | `npx jest src/utils/pricing.test.js` |
| Which catalogue a record belongs to | `src/utils/assetPools.js` (`assetPoolOf`) | none — classification is a stored decision |
| Content Security Policy | `config/csp.js` | `npm run verify:csp` |
| Master object key + delivery contract | `netlify/functions/lib/masters.js` | `npm run test:functions` |
| "may this user have this item" | `netlify/functions/lib/entitlement.js` | - |
| Catalogue records (albums/songs) | **`C:/Users/percy/RadioStation/radio/releases.json`** — the station seeds BFMG one-way over ISRC; see its `catalog.js` | `node catalog.js diff` |
| Stripe pricing | `netlify/functions/create-checkout.js` (server-side price lookup) | e2e coverage |
| Which agreement a person accepted, and its version | `src/utils/agreements.js` (**CommonJS**, `create-checkout` requires it) | `npx jest src/utils/agreements.test.js` |
| What a stored catalogue price *should* be | `src/utils/catalogPricePlan.js` (`planCatalogPrices`) | `npx jest src/utils/catalogPricePlan.test.js` |
| Whether a record may be sold (`previewOnly`) | `netlify/functions/lib/master-availability.js` — derived from the master in R2 | `npm run verify:masters` |
| Statutory mechanical owed on a download (§115) | `src/utils/mechanicalRoyalty.js` | `npx jest src/utils/complianceModules.test.js` |
| AI provenance + what may be registered | `src/utils/aiDisclosure.js` | `npx jest src/utils/complianceModules.test.js` |
| DMCA §512(c) safe-harbour conditions | `src/utils/dmcaSafeHarbor.js` | `npx jest src/utils/complianceModules.test.js` |
| What "net sales revenue" means | `src/utils/revenueSplit.js` (`netDefinition`) | `npx jest src/utils/revenueSplit.test.js` |
| Where a record's master lives | `masterPath` + `masterBackend` on the song; written by `npm run link:masters` | `npm run link:masters` (idempotent) |
| Whether a license is withdrawn | `src/utils/licenseRevocation.js` (`isRevoked`) | `npx jest src/utils/licenseRevocation.test.js` |
| Who is on superseded terms | derived from `acceptedAgreement` vs `agreements.js` | `npm run verify:terms` |
| Admin-script boilerplate (env, credentials, batching) | `scripts/lib/admin.js` | every `npm run` script exercises it |
| Everything else | **NEEDS OWNER** | — |

## Domain landmines — the things that fail *silently*

1. **A fallback image that 404s renders the `alt` text, not a placeholder.** The whole album
   grid looked "populated but broken" for this reason. Placeholders must be the data URI from
   `src/utils/placeholders.js`, which cannot fail. Never a `/default-*.jpg` path.
2. **`<picture>` fallback is content-type negotiation, not error recovery.** If a `<source>`
   URL 404s the browser does **not** fall through to the `<img>` — it renders broken. See
   `src/components/OptimizedImage.js`.
3. **The catalogue seeder writes no artwork field at all.** `catalog.js albumDoc()` in the
   RadioStation repo writes 14 fields — `title`, `artist`, `upc`, `trackCount`, `price` … and
   no `coverUrl`, no `cover`. Its own source, `releases.json`, has no artwork key either
   (`album, albumArtist, upc, uploaded, released, tracks, storeUrl`). Every seeded album
   arrives cover-less and nothing anywhere reports an error.
4. **`cover` vs `coverUrl`.** `src/services/ingestionService.js:56` writes `cover` (and writes a
   *local filename*, not a Storage URL); readers expect `coverUrl`. A real defect, but **not**
   the cause of the blank album grid — the seeded records carry neither field.
5. **The WebP probe never fires on Firebase URLs.** `/\.(jpg|jpeg|png)$/i` is anchored to
   end-of-string; Storage URLs end in `?alt=media&token=…`. The optimization silently no-ops.

## PHAST pillars

**NEEDS OWNER** — not yet assessed. Auth isolation and render stability look applicable;
tenant isolation likely does not (single-tenant hub). Do not build a pillar the product lacks.

## Paid delivery — two buckets, one key

The station's R2 bucket is **public by requirement**, not by oversight: an `<audio>`
element cannot refresh a signed URL mid-record, so the streaming copy can never be
gated. Verified 2026-09-17 — `GET` on any master returns `200` with the full
`Content-Length` and no credential. **Anything in that bucket is published.**

So paid delivery uses a second, private bucket:

| Bucket | Contents | Access | Job |
|---|---|---|---|
| public R2 (`pub-…r2.dev`) | 320k MP3s | public, immutable, ranged | station + storefront previews |
| **private R2** | lossless WAV masters | none public; presigned GET only | post-purchase delivery |

Key is `masters/<ISRC>.wav`, defined once in `netlify/functions/lib/masters.js`.
ISRC because it is the only identifier assigned by a standards body rather than by
either platform — `catalog.js` already joins on it, so the two systems share ONE key
rather than two that drift. A filename would not survive a re-cut, since objects are
immutable and a re-cut needs a new name.

Env required by `download-master`: `R2_MASTERS_ENDPOINT`, `R2_MASTERS_BUCKET`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. The token needs **GetObject only** —
BFMG reads masters, it never writes them. Absent config returns 503 rather than
presigning with `undefined` and yielding a 403 the buyer meets after paying.

## App Check — registered, NOT enforced

reCAPTCHA Enterprise ("Fraud Defense"), score-based, registered 2026-09-17.
Verified issuing real tokens: `exchangeRecaptchaEnterpriseToken` returns 200, on
localhost, so **no debug token is needed**.

`CreateAssessment Requests per day` is capped at **300** in Cloud quotas. That is a
HARD cap — requests past it are refused — unlike a billing budget, which only
alerts. 10,000 free assessments/month ÷ 30 ≈ 333/day, so 300 is arithmetically
inside the free tier rather than probably inside it.

**Enforcement is OFF and must stay off until the station moves.** The station reads
this catalogue over unauthenticated REST by design — its `catalog.js` says "diff and
pull work from anywhere with no secret on disk". Enforcement rejects tokenless
requests, so it breaks the station's reads while leaving its service-account push
working: a partial failure, which is the most confusing shape available. Sequence:
register (done) → run unenforced and read the verified/unverified split → station
switches to authenticated reads → enforce per service.

Cap at 300 must be resized before enforcing. Today a refused assessment is harmless
because nothing is enforced; after enforcement it means a real visitor is blocked.

## Billing — Blaze, as of 2026-09-17

The project is on **Blaze (pay-as-you-go)**. Every Firestore read, Storage byte and function
invocation past the free tier is billed, and there is no ceiling by default.

**A Cloud Billing budget is an *alert*, not a cap.** Setting a $50 budget does not stop
anything at $50 — it emails you. The only hard stop is Budget → Pub/Sub → a function that
calls `projects.updateBillingInfo` to detach the billing account. Until that exists, assume
spend is unbounded.

Current exposure, verified 2026-09-17:

| Guard | State |
|---|---|
| App Check | **not configured** anywhere in `src/` or `functions/` |
| `maxInstances` / `setGlobalOptions` on functions | **not set** — functions scale to the platform default |
| `songs` / `albums` Firestore rules | `allow read: if true; allow list: if true` — public and listable |
| Hard billing stop | none |

`firestore.rules:12-14` and `:88-90` make the whole catalogue listable with no credential and
no attestation. At ~134 `songs` documents and $0.06 per 100k reads, a scripted 10 req/s against
that list is 864,000 requests/day × 134 docs = 115.8M reads ≈ **$69/day**. Nothing in the stack
currently prevents it.

Before any traffic: turn on App Check with enforcement, set `maxInstances`, and build the
budget → Pub/Sub → disable-billing killswitch.

## The station / BFMG boundary

**The station never sells music.** It may sell advertising space, and even that may
end up transacted through BFMG. Confirmed by Percy 2026-09-18.

| | Owns |
|---|---|
| **RadioStation** | broadcast, programming, the clock, what plays when, the ISRC-keyed record of what exists |
| **BFMG (here)** | the catalogue as a PRODUCT — price, license terms, checkout, delivery, entitlement |

The join is the **ISRC**, because it is the only identifier assigned by a standards
body rather than by either platform.

**Consequence: the station should not write `price`.** It currently does, in
`songDoc()`, `albumDoc()` and its `REPAIRABLE` list, purely as a side effect of
seeding. That side effect put $29.00 on 138 records and kept it there after the
decision had moved to $1.99 — the catalogue disagreeing with the checkout, which
`catalog.js`'s own comment at line 663 already warns about: *"a price the station
prints from a constant of its own is a price that silently stops matching."*

It READS `song.price` back for its own surfaces, and that is correct — BFMG as the
authority, the station as a consumer. Reading is fine; writing is the inversion.

BFMG is ready for this: `create-checkout` now derives a per-type fallback from
`src/utils/pricing.js` (songs SONG_PRICE, albums calculateAlbumPrice(trackCount)),
and every UI reader already falls back. A record arriving with no `price` prices
correctly.

## Concurrent work — the RadioStation repo writes into this project

`C:/Users/percy/RadioStation/radio` is worked on **in parallel** (session `radiostation-dc`) and
is not a passive upstream: `catalog.js` writes to this project's Firestore `songs`/`albums` and,
as of the in-flight change, to its Cloud Storage bucket. Treat anything it owns as **live and
moving** — re-read before relying on it, never edit it from this side.

Facts this file's findings rest on, fingerprinted 2026-09-17 (re-check before trusting them):

| File | sha256[0:16] | mtime |
|---|---|---|
| `releases.json` | `7460ab0dd15f759c` | 2026-09-16 18:03 |
| `catalog.js` | `5968f497d81d09bd` | 2026-09-17 03:03 |
| `normalize.js` | `02e30efd4e539db7` | 2026-09-14 09:44 |

`catalog.js` moved *during* this session's audit. It carried 92 uncommitted insertions at the
time of writing; `albumDoc()` still emits no cover field.

### Open cross-repo hazard — previews landing in `audioUrl`

The in-flight `catalog.js previews` command writes 30-second previews to Cloud Storage and puts
the resulting URL on `songs.audioUrl`. Its reasoning is sound and verified from this side:
`functions/index.js:108` resolves audio with `audioUrl.match(//o/([^?]+)/)`, so a preview plays
through the existing player with no change here.

But two consequences land on **this** side, and nothing warns about either:

1. `src/pages/HomeStorefront.js:63` **skips any track with no `audioUrl`**. The moment previews
   are applied, ~134 records appear in the licensing storefront that were invisible before.
2. Those records carry `price`, `status: "published"`, `approved: true`, `isVisible: true` from
   `songDoc()` — so they are **purchasable**, while the only audio behind them is a 30-second
   preview. RadioStation deliberately does not write the master's location (correctly — `songs`
   is world-readable, and a `downloadUrl` there would publish the product). Resolving the master
   server-side for post-purchase download is **BFMG platform work that does not yet exist.**

Do not run `catalog.js previews --apply` against production until the storefront either excludes
preview-only records or the master-resolution path is built.

## DOSI ledger

### 2026-09-17 — image/cover subsystem audit

**Findings (verified):**
- **S** — 18 of 20 root-relative image paths referenced in rendering code do not exist in
  `public/`. The app's entire fallback layer was 404s. `/images/default-cover.jpg` alone is
  referenced 11 times and is absent.
- **S** — five competing names for one concept (`cover` 45, `coverUrl` 10, plus `imageUrl`,
  `artwork`, `image`); `src/components/admin/ContentManagement.js:522` hand-reconciles with
  `album.coverUrl || album.cover || ''`.
- **D** — `OptimizedImage` imported by 3 files; 55 raw `<img>` tags across 30 files with 59
  hand-rolled `onError` handlers. Well past rule-of-three: adopting the existing primitive is
  correct, and this is adoption, not extraction.
- **I** — `src/components/LazyImage.js` has **zero** importers. Deletion candidate, not a
  rename candidate. Same for `/images/TeddySwims.jpg` and `/artistImages/LalahHathaway.jpg`
  (demo scaffolding that outlived the demo, 5 refs, both missing).
- **O** — the WebP probe in `OptimizedImage` appears to be dead weight. **Not claimed as an
  optimization**: derived by reading, not measured. Needs a network trace before any change.

**Changed:**
- Added `scripts/verify-assets.js` + `npm run verify:assets` — reconciles every root-relative
  image literal in rendering code against `public/`, exits non-zero on the first miss.

**Deliberately left alone, and why:**
- The 18 missing-asset call sites. The tree has 243 uncommitted entries and several target
  files are already dirty; folding a 20-file refactor into that makes it un-reviewable and
  un-revertable. Gated on a clean baseline.
- `src/pages/Home.js` vs `src/pages/HomeStorefront.js`. The working tree replaces the
  Spotify-esque Home with a licensing storefront. Which page survives is a product call, not
  a DOSI call.
- Test and story fixtures (`/broken-image.jpg` et al). They are *meant* to 404; asserting they
  resolve would be coverage that tests nothing. Excluded in `verify-assets.js` by design.

### 2026-09-17 — root cause traced upstream

The blank album grid is not a BFMG rendering bug at origin. Chain, verified end to end:

1. `releases.json` (RadioStation) has no artwork key for any of its 12 releases.
2. Only 2 of 178 files under `_originals/audio` carry an embedded `attached_pic`, and both are
   station imaging (`This is BeatFlow.mp3`, `LiteraryGemShopJingle1.mp3`). **No music track has
   cover art anywhere in the station pipeline.**
3. `catalog.js albumDoc()` consequently writes no cover field.
4. BFMG's home reads `album.coverUrl` → `undefined`.
5. `OptimizedImage` substitutes `fallback="/default-album.jpg"`, which does not exist.
6. The 404 renders the `alt` text — the album title in a grey box.

Steps 1–3 are upstream and need source artwork that does not currently exist on disk.
Steps 4–6 are BFMG's and are fixable here regardless: with a data-URI placeholder the grid
degrades to honest "no artwork" tiles instead of looking broken.

### 2026-09-17 — one artwork resolver

Spotted from a screenshot: the play bar showed a cover, the page below it showed
"No Image". That instance was stale data, but the instinct was right and the bug
behind it was worse.

**Four different precedences for one concept**, and twelve components with none:

| Reader | Precedence |
|---|---|
| `NowPlayingBar` | `coverUrl` -> `cover` |
| `SongPage` | `cover` -> `coverUrl` (reverse) |
| `HomeStorefront` | `coverUrl` -> `cover` -> `albumCover` |
| `TrendingSongs`, `CuratedForYou`, `SongRow`, +9 more | `cover` **only** |

No song document has a `cover` field — all 138 carry `coverUrl` — so that last row
rendered a placeholder for **every track, permanently**. It looked like missing
artwork rather than a missing fallback, which is why it survived.

`src/utils/artwork.js` is now the one answer. **Why `coverUrl` wins is the load-bearing
part:** `cover` is not reliably a URL —`src/services/ingestionService.js:56` writes
`cover: coverFile.name`, a bare local filename. So the resolver also *validates*:
a value is only used if it is an absolute URL, a root-relative path or a data URI.
A bare filename is skipped, not returned, because resolving it against the current
route 404s. Preferring `coverUrl` is not taste; it is preferring the field whose
contents are a URL.

Migrated 9 files. Verified headless afterwards: home and a song page render
**imgs=2/3, remote=2/3, placeholder=0, broken=0**.

`placeholders.js` and `artwork.js` are CommonJS like `pricing.js`, so the utils are
testable with plain jest. Webpack resolves named imports from CJS, so every existing
`import { ... }` in components is unchanged. **Ratchet: 16 utils assertions.**

### 2026-09-17 — purchase options dialog

A track row shows ONE price (the single) and opens the alternatives on tap:
`src/components/PurchaseOptionsDialog.js`, reached from `PurchaseButton`.

- Every price displayed is the price the server will charge. `create-checkout`
  resolves from Firestore and ignores the client, so the dialog shows the stored
  `price` and only falls back to `calculateAlbumPrice()` when there is none.
- Checkout stays in ONE place (`startCheckout` in `PurchaseButton`); the dialog
  emits a selection rather than calling Stripe itself.
- `previewOnly` records get an explanation instead of buy buttons — offering a
  button that `create-checkout` will refuse is worse than offering no button.
  **Every track visible in the album view today is previewOnly**, so every $29.00
  button currently leads to a checkout the guard rejects.
- Mobile-first: dialog is `fullScreen` below `sm`; option rows are 72px; the
  compact price button gained `minHeight: 44` — MUI `size="small"` renders ~30px,
  which is fine with a mouse and misses on a phone.
- A signed-out visitor can now open the chooser (seeing the price is the reason to
  sign in); sign-in is prompted on selection, not on the button.

**Ratchet:** interactive elements under 44px in the purchase path — **0**.

### 2026-09-17 — pricing made requireable, and its own docs were wrong

`src/utils/pricing.js` is now CommonJS. The station was regex-scraping `SONG_PRICE`
and `ALBUM_DISCOUNT` out of it and reimplementing the formula, which dropped the
`.99` rule and priced all 12 albums a few cents under. It can now `require` the file,
so there is one implementation rather than two that agree by luck.

Safe because all 14 importers use **named** imports and webpack resolves those from a
CommonJS module. The file must stay inside `src/`: CRA's ModuleScopePlugin forbids
importing from outside it and `craco.config.js` does not disable it.

**Two of the four JSDoc examples were wrong** — documentation that had drifted from
the code it documented:

| example | doc said | actually returns |
|---|---|---|
| `calculateAlbumPrice(1)` | 2900 | **2199** |
| `calculateAlbumPrice(12)` | 26099 | **26199** |

The `n=12` case is the interesting one: the discounted base is exactly $261.00, and
the rule prices **up** to $261.99 rather than shaving to $260.99. That is a pricing
decision — changing it reprices every album — so it is now asserted in a test rather
than described in a comment that can rot. Examples fixed to match the code, and
`src/utils/pricing.test.js` pins all four plus the boundary. **Ratchet: 8 assertions.**

### Known: the two systems disagree on album price

`src/utils/pricing.js calculateAlbumPrice()` rounds up to `.99`; the station's
`catalog.js` computes `Math.round(n * song * discount)`. They differ on every album:

| tracks | `calculateAlbumPrice` | `catalog.js` (what is in Firestore) |
|---|---|---|
| 9 | 19599 | 19575 |
| 10 | 21799 | 21750 |
| 12 | 26199 | 26100 |
| 19 | 41399 | 41325 |

Not live today — every album doc carries a `price`, and both the UI and
`create-checkout` prefer the stored value. It becomes a **displayed price that is
not the charged price** the moment an album exists without one, since the UI would
fall back to the canonical function while the server used the stored field.
`catalog.js` already reads `SONG_PRICE` and `ALBUM_DISCOUNT` out of `pricing.js`;
it should call the exported function rather than reimplement the formula.

### 2026-09-17 — cover art resolved at source

The station recovered artwork from Deezer by ISRC, cross-checked against iTunes by
UPC, and wrote `coverUrl` (the field the readers want) pointing at
`songs/covers/{UPC}.jpg`. Verified from this side: **12/12 albums and 138/138 songs**
carry `coverUrl`, and the URLs return `200 image/jpeg`.

So the blank grid is fixed where it was actually broken — in the data, not in the
fallback. The placeholder work stays regardless: it is what makes the *next* missing
image degrade to an honest empty tile instead of alt text.

### 2026-09-17 — ten records can never offer a download

All of **The Best Nights Of Our Lives** (album `zI7t151bq6NFsUgHynxM`, 10 tracks,
priced **$217.50**). MP3-only in the station's `_originals`, no name variants, no
lossless master on disk. Verified from this side: the ten ISRCs resolve to exactly
one `albumId`, and all ten are still `previewOnly`.

**124 of 134 can offer a lossless download; 10 cannot.**

This is the case `masterObjectKey()` cannot catch — the ISRCs are perfectly valid, so
nothing throws, and the buyer would meet a 404 after paying. `download-master` now
**HEADs the object before releasing a URL** and returns 409 if it is absent. One HEAD
is cheap next to a refund.

**Standing hazard:** when the station clears `previewOnly` after the master push, it
must clear it for the 124 **only**. Clearing all 134 makes that album sellable at
$217.50 with nothing behind it. The delivery probe would still refuse the download —
but the charge would already have happened.

**Open product decision (Percy's):** those ten either ship as 320k MP3 — which means
deciding a paid license may deliver lossy — or the album is not sold, or the WAVs are
found off-machine.

### 2026-09-17 — paid master delivery

**Built:**
- `netlify/functions/lib/masters.js` — the cross-repo key contract (above).
- `netlify/functions/lib/r2-presign.js` — SigV4 presigned GET, hand-rolled on node
  `crypto`. No `@aws-sdk` on a cold-start path to produce a string; presigning is
  pure arithmetic with no service call. Correctness pinned to AWS's published test
  vector.
- `netlify/functions/lib/entitlement.js` — one reader for "may this user have this".
- `netlify/functions/download-master.js` — strict-auth endpoint. Verified ID token
  only, deliberately unlike `create-checkout.js`, which falls back to a body
  `userId`. Acceptable to start a payment; a file release would let anyone download
  anything by typing another uid.
- `netlify/functions/lib/master-delivery.test.js` — 9 assertions, all passing.

**Fixed:** `functions/index.js checkSongPurchase()` queried
`purchases.where('songId','==',…)`; nothing has ever written `songId` — every writer
in `stripe-webhook.js` writes `itemId`. It could only return false. Invisible because
its one caller uses the result for a log line and grants streaming regardless.

**Left alone, and why:** `stripe-webhook.js` also writes a `licenses` collection keyed
by `trackId` alongside `purchases` keyed by `itemId` — two stores for one concept.
Collapsing them changes purchase fulfilment, which is a bigger blast radius than this
task; `entitlement.js` reads `purchases` because every path writes it.

**Open, needs the station:** the private bucket does not exist yet and no WAV has been
pushed. `_originals` holds **126** WAVs against **134** ISRC-bearing songs, so 8
records have no lossless master and cannot offer a download at any price.

### 2026-09-17 — four copies of the CSP, one of them winning silently

App Check initialised correctly and then did nothing at all: the browser refused
`https://www.google.com/recaptcha/enterprise.js`, so no attestation ever ran.

The policy existed in **four** unreferenced copies — `public/_headers`, the
`<meta>` in `public/index.html`, `craco.config.js` devServer headers, and a dead
`src/config/securityConfig.js`. A browser enforces the **intersection** of every
policy present, so patching two of three changed nothing observable: the served
HTML demonstrably allowed reCAPTCHA while craco's header quietly cancelled it.

That is what makes this the worst duplication in the repo. A wrong copy of most
things fails loudly. A wrong copy of a CSP fails **closed and silent** — the
request simply never happens.

`config/csp.js` is now the single source; craco requires it; the two static copies
reconcile via `npm run verify:csp`, which reports per-directive drift. Generated
from the live policy rather than retyping 1,900 characters of security header.

The reconciler immediately earned itself: the meta tag had drifted on five
directives, carrying `*.stripe.com` and `accounts.google.com` that no other copy
had (so never actually permitted) while omitting `child-src`, youtube, vimeo and
`data:` fonts that `_headers` intended (so silently cancelled).

**Deletion candidate:** `src/config/securityConfig.js` — 564 lines, 13 sections,
**zero importers**, containing a fourth CSP. It reads as authoritative and is not.

**Ratchet:** function-delivery assertions — **baseline 10**. Up only.

**Ratchet:** missing referenced assets in rendering code — **baseline 18**. Never raise it.

---

## Clickwrap license acceptance — 2026-09-19

**The gap:** grepping `acceptedTerms|termsAccepted|agreedTo|consent` across
`create-checkout.js`, `stripe-webhook.js` and the purchase dialog returned nothing.
Every sale minted a `licenseId` — proof a transaction happened — with no record of
what the buyer agreed to. A footer link to `/terms` is **browsewrap**, which courts
routinely refuse to enforce because nobody can show the buyer saw it.

**Why contract and not copyright.** Whether copyright subsists in AI-assisted output
is unsettled. A contract does not care: it binds the buyer to the restrictions they
accepted regardless of who owns what. For this catalogue the acceptance record is the
*primary* enforcement mechanism, not a formality.

**What landed**

- `src/utils/agreements.js` — canonical registry, dated versions
  (`download-license@2026-09-19`). Holds `CONTRIBUTOR_UPLOAD` and `SYNC_LICENSE` with
  **null versions on purpose**: null means *cannot be accepted*, so the upload path
  cannot claim an acceptance no text backs.
- `src/components/LicenseAcceptance.js` — the one checkbox, unchecked by default,
  terms summary above it. Used by both dialogs; a second copy would drift, and the
  drift would be one route selling without a record.
- `PurchaseOptionsDialog` — flow changed from *tap to buy* to
  **choose → read → tick → pay**. The terms summary used to sit *below* the button
  that had already been pressed, which made it decorative.
- `src/components/LicenseAcceptanceDialog.js` + `src/hooks/useLicensedCheckout.js` —
  the gate for every other route.
- `create-checkout.js` — refuses song/album checkout unless `acceptedAgreement` is
  the **current** version (409, not 400: the client should reload, not retry). Stamps
  `acceptedAt` from the **server** clock — a client timestamp is a value the buyer
  controls, and surviving the buyer's dispute is the point.
- `stripe-webhook.js` — `licenseAcceptanceFields(session)` writes
  `{acceptedAgreement, acceptedAt}` at all **three** purchase-write sites.

**Six ungated routes to Stripe existed, not one.** `Search`, `Home`, `Playlist`,
`ArtistSimple` and `TrackRow` each carried their own copy of "sign in, check owned,
checkout"; `PurchaseButton`'s album branch was a sixth. Patching call sites would
have left a seventh to be written next month, so the gate lives in
`useLicensedCheckout` — a page cannot start a checkout without rendering the dialog
that collects assent, because both come from the same call.

**Nulls are written explicitly, not omitted.** Firestore excludes a document from any
query mentioning a field it lacks, so an omitted field would hide unaccepted
purchases from exactly the query that looks for them.

**Deleted:** `Album.js` `handlePurchaseTrack` — eslint-flagged dead code that called
`createSongCheckout` *without* acceptance. Worse than ordinary dead code: re-wiring it
would have reintroduced an ungated path that now 409s in a way the buyer cannot act on.

**Ratchet:** routes to Stripe that do not capture acceptance — **baseline 0.**
Verify with:
```sh
grep -rn "await stripeService.create\(Song\|Album\)Checkout" src/ --include=*.js   | grep -v acceptedAgreement
```
Must print nothing. It matches on `await stripeService.` so prose mentioning the
function name does not register as a gap — the first version of this check flagged
its own explanatory comment.

**Not legal advice.** This makes acceptance *provable*. Whether the clauses hold up in
New Jersey is a lawyer's question, and `/terms` still does not contain the
performance / remix / sublicensing text this control says the buyer accepted — that
gap is now the highest-value legal item open.

### Open, found while doing this

- **`Album.js` "Purchase Now" button has no `onClick`.** The album context menu and
  the outlined Purchase button both open a dialog whose confirm button is inert, and
  it shows a hardcoded `'14.99'` fallback that contradicts `pricing.js`. Albums are
  only actually buyable via the `PurchaseButton` at the top of the page.
- **The `.env` Firebase service account is rejected by Firestore** (`16
  UNAUTHENTICATED`) though project and client-email agree. `verifyIdToken` may still
  work (it verifies against Google's public certs), but **`stripe-webhook`'s Firestore
  writes would not** — a purchase could be taken and never recorded. Unknown whether
  Netlify holds the same values; check before trusting a deploy.

---

## Album pricing — floor, cap, and the copies that had to go — 2026-09-19

**Percy's call:** `album = clamp(trackCount x $1.99, $4.99, $11.99)`.

**Why a cap and not a percentage.** Under the old rule an album cost *exactly* its
tracks, so the saving for buying the album was always **$0** and a buyer had no
reason to ever pick it — `PurchaseOptionsDialog`'s "Save $X vs buying separately"
note was unreachable code, since it only renders when `albumSaving > 0`. A percentage
would have fixed a 10-track album and still left the 19-track release at $22.69,
about twice the market. A cap fixes both ends and makes the saving *grow* with the
release: $5.92 at 9 tracks, $25.82 at 19.

- `ALBUM_PRICE_FLOOR = 499` — **chart eligibility**, from the DSP PRD, not margin.
  Below it a sale still succeeds and simply never reaches Luminate. Binds nothing
  today (all 12 releases are 9–19 tracks); it exists for the first short release.
- `ALBUM_PRICE_CAP = 1199` — the iTunes/Bandcamp band.

**Accepted consequence:** at 1–2 tracks the floor makes the "album" cost *more* than
its tracks ($4.99 vs $1.99/$3.98). Not fixed, because a 1–2 track release is a single
or an EP and the honest fix is classification, not price. Pinned by a test so it
cannot widen unnoticed.

**Production library is NOT governed by this.** `calculateBundlePrice(n, discount)`
prices the `PRODUCTION_MUSIC` pool: floor, **no cap**. The cap is a *consumer*
ceiling — what a listener pays for an album they will listen to — and a library pack
is a commercial-use license whose ceiling is set by Epidemic and Artlist. Capping one
at $11.99 would underprice it *silently*, since every sale still succeeds. The
discount is a **required argument with no default**: a default would be a pricing
decision made by whoever wrote the call.

**Three independent copies of album pricing were found and removed**

1. **`RadioStation/radio/catalog.js`** — regex-**scraped** `SONG_PRICE` and
   `ALBUM_DISCOUNT` and recomputed `Math.round(n * song * discount)`. A scrape can
   only recover *constants*, and the rule is now a **clamp**, which no regex can see.
   Left alone it would have seeded $37.81 for the 19-track album while this repo said
   $11.99 — and since `create-checkout` charges the **stored** price, the catalogue
   would have won, silently. Now `require`s `calculateAlbumPrice`; the scrape
   survives only as a fallback and now clamps too.
2. **`netlify/functions/approve-submission.js`** — `Math.round(trackCount * 199 * 0.75)`,
   the only place in the system applying a 25% discount, with a hardcoded single
   price and neither floor nor cap. This prices **approved artist submissions**, so
   it is the path that matters most once artists upload their own releases.
   Its song branch hardcoded `199` as well. Both now derive.
3. **`src/pages/Album.js`** — the purchase dialog fell back to the literal
   `'14.99'` and formatted cents by hand. That number matched no album in the
   catalogue, so the dialog quoted a price the checkout would never charge.

**Also fixed:** `Album.js`'s "Purchase Now" button had **no `onClick` at all**. The
album context menu and the outlined Purchase button both dead-ended there, so albums
were only genuinely buyable from the `PurchaseButton` at the top of the page. It now
goes through `useLicensedCheckout`, the same license gate as every other route.

### Repairing the stored prices

`create-checkout` reads `item.price` from Firestore and only falls back to the
constant when absent, so **nothing changes for buyers until the catalogue is
repaired**. All 12 albums are affected; every change is a price **reduction**
($266.66 → $143.88 across the catalogue), so the repair cannot overcharge anyone.

Two runners, **one decision**. `src/utils/catalogPricePlan.js` holds
`planCatalogPrices()`; the runners are I/O around it. A second copy of the repair
rule, inside the tool built to fix four copies of the pricing rule, would have been
the same mistake with better intentions.

| runner | needs | verifies writes |
|---|---|---|
| `npm run fix:prices` (`scripts/fix-catalog-prices.js`) | a service account | **yes** — re-reads every document |
| `fixCatalogPrices()` in the browser console | a signed-in platform admin | no |

```sh
npm run fix:prices                          # dry run, writes nothing
npm run fix:prices -- --apply               # write it
npm run fix:prices -- --only=albums         # songs | albums | both
npm run fix:prices -- --project=beatflowmedia --apply   # assert the target first
```

Guardrails, because this writes the numbers customers are charged: dry run by
default, the whole plan prints before any write, `--project` **asserts** the target
(a key that works proves only that *some* project accepted it), writes are batched
at 400 and then **read back**, and it exits non-zero on any failure so CI cannot
call a partial repair green.

**It is currently blocked**, and not by the code: the `.env` service account returns
`16 UNAUTHENTICATED` although the project and client email agree, which means the key
was deleted or disabled in the console. The script says so explicitly instead of
printing a stack trace. Issue a new key and replace `FIREBASE_PRIVATE_KEY` and
`FIREBASE_CLIENT_EMAIL` **together** — they are a set. The same credentials are what
`stripe-webhook` writes purchase records with, so this is worth fixing regardless of
pricing.

**Ratchet:** independent album-price arithmetic outside `pricing.js` — **baseline 0.**
```sh
grep -rnE "trackCount \* 199|\* 199 \*|\* SONG_PRICE" src/ netlify/ --include=*.js   | grep -v "utils/pricing"
```
Must print nothing but comments. The station is *not* covered by this grep — it lives
in another repo, and `node catalog.js diff` is what catches a regression there.

---

## `previewOnly` — an inventory flag, not a permission — 2026-09-19

Percy, on an authorised admin account, saw every track on an album badged
**Preview only**. The account had nothing to do with it.

**What the flag means.** `previewOnly` says *we cannot deliver this*, not *you may
not buy this*. An admin hits it exactly as an anonymous visitor does. It exists
because BFMG's purchase path resolves audio as
`downloadUrl || fullTrackUrl || audioUrl`, and the station deliberately writes the
master's location **nowhere** — `songs` is world-readable, so a `downloadUrl` field
holding the R2 address would publish the product for free. Without it, a completed
checkout hands the buyer the 30-second preview sitting in `audioUrl`. It is
load-bearing.

**Why the page looks self-contradictory.** It shows `3:08` next to *Preview only*
because the two fields come from different sources and are both true: `duration` is
measured off the station's full stream via `playlist.json`; `audioUrl` points at
`songs/previews/<isrc>.mp3`, a **30-second** clip (`SECONDS = 30` in the station's
`preview.js`). The recording is 3:08. What is *reachable* is 30 seconds of it.

**Why it is now stale.** `catalog.js:289` sets `previewOnly: true`
**unconditionally** on every seeded song — never derived per record. Its own comment:
*"Clearing this flag is the last step of building master resolution, not a tidy-up."*
Master resolution now exists (`lib/masters.js`, `lib/r2-presign.js`,
`download-master.js`), so the blanket assertion has outlived its condition.

**`npm run verify:masters`** derives the flag instead of asserting it.

- **It probes, it does not list.** `ListObjectsV2` is the obvious implementation and
  the wrong one: the masters token is **GetObject-only**, so a list would be denied
   — and a denied list looks exactly like an empty bucket, which would block the
  entire catalogue. One presigned **HEAD** per key needs precisely the permission the
  delivery path already has.
- **Unknown is not absent.** Only an explicit 404/403 counts as missing; a timeout or
  5xx is recorded as undetermined and reported. Verified against live endpoints:
  200 → `true`, 404 → `false`, unreachable → `null`. It also refuses to run if
  *every* probe is undetermined, because that is connectivity, not an empty bucket.
- **Both directions.** The urgent one is not the locked catalogue, it is
  **sellable-but-undeliverable**: a record with no master and no block would take
  money and deliver 30 seconds. A one-directional "unlock the catalogue" script would
  never look for it. Blocks are written *before* unlocks, so a half-finished run
  leaves the catalogue over-cautious rather than over-selling.

**Blocked on R2 credentials only.** `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_MASTERS_ENDPOINT`, `R2_MASTERS_BUCKET` are unset; the script says so and refuses
to guess rather than reporting an empty bucket as "no masters exist".

### PRD collision: the 30-second preview makes chart reporting impossible

PRD 3.2 logs a stream *"only when continuous playback exceeds 30 seconds."* Every
`audioUrl` is **exactly 30 seconds**, so nothing can ever exceed it: **zero plays
would be chart-eligible**, forever, and the daily Luminate SFTP file would generate
successfully containing no qualifying events. Same failure class as the album price
floor — everything succeeds, nothing counts. The "0 plays" on every row of the
album page is the same fact from the other end.

Consequence: **download and streaming need different assets.** The 30-second clip can
stay as the discovery preview, but chart-eligible interactive streaming needs
full-length authenticated playback — a third asset path alongside the preview and the
WAV master. Not yet designed.

---

## Statutory obligations, in code — 2026-09-19

Four external legal sources were internalized as canonical modules, on the same
pattern as `pricing.js`: one origin per concern, tests that pin the numbers, and a
refusal to assert anything the platform cannot actually evidence.

### `mechanicalRoyalty.js` — 17 U.S.C. §115

Selling a download is a "digital phonorecord delivery" and owes a **compulsory**
royalty on the **composition**. The platform had no representation of this at all, so
the true cost of a sale was not knowable from the code.

- Rates held **by year** (2023–2026), because a sale is governed by the rate in force
  on its date. 2026 = **13.1¢** per work, **2.52¢** per minute over five minutes,
  whichever is greater, counting a part minute as whole.
- Arithmetic in **hundredths of a cent as integers** (1310, 252). The rates are
  fractional cents; floating-point on money owed to a songwriter is how 0.1 + 0.2
  becomes a royalty dispute.
- Albums sum **before** rounding — rounding per track then adding misstates a
  19-track album by real money, which is what a royalty audit looks for.
- **Refuses to price interactive streaming.** The CRB uses a percentage-of-revenue
  formula there; extending a per-copy penny rate to a stream is wrong by orders of
  magnitude.
- A year past the table is flagged `stale` rather than silently billed.

### `aiDisclosure.js` — Copyright Office AI authorship guidance + Circular 56A

The PRD requires a track-level AI tag for **chart reporting**; the Copyright Office
requires disclosure and disclaimer for **registration**. Same fact, two duties, one
module — storing it twice would let a record be reported to Luminate as one thing and
registered as another, and the second is a false federal filing.

- **Two copyrights, never collapsed.** Human lyrics over AI performance =
  registrable composition, unregistrable master. `registrationClaim()` answers for
  each separately, and a performance claimed on a composition application is rejected
  as the category error it is.
- An undisclosed record returns **null, never "synthetic"**. Guessing provenance
  writes a fabricated fact into a field that feeds a federal application.
- `compilationClaim()` — human selection and sequencing is protectable authorship, so
  an album of otherwise unregistrable synthetic tracks still carries a **thin**
  compilation copyright. For this catalogue that may be the only copyright there is.

### `dmcaSafeHarbor.js` — 17 U.S.C. §512(c)

- `DESIGNATED_AGENT` is **all nulls**, and `safeHarborStatus()` reports **not
  eligible** because of it. Registration is **$6** at dmca.copyright.gov/osp and
  must be done *before* uploads open, not after the first notice.
- Repeat-infringer strikes **age out** of a rolling window — a policy that never
  forgets is a permanent record, not a repeat-infringer policy. Courts have stripped
  the harbour from providers whose written policy was never actually implemented.
- The gap is reported as `urgent` only once `acceptsUserUploads` is true.

### `revenueSplit.js` — the word that was already shipped

`Terms.js` publishes *"70% of net sales revenue"* and **does not define net**. That
is a **4× swing** in platform margin on a $1.99 single — 45¢ if net means after
costs, 11¢ if it means gross. The definition now lives where the arithmetic does:

> net = charged − payment processing − statutory mechanical − refunds/chargebacks

Pennies balance by assigning the remainder to the platform share, so a month of sales
reconciles. **`Terms.js` still needs amending to state this** — until then the code
and the contract agree only by luck.

**Consequence worth knowing, surfaced by wiring these together:** mechanicals scale
per track while the album price is capped, so **a longer album pays the artist less**
per sale ($6.20 on 19 tracks vs $6.84 on 12). Pinned by a test.

**Ratchets:** 109 tests across 8 suites. `DESIGNATED_AGENT.registeredWithCopyrightOffice`
is `null` — when that changes, the test asserting it changes deliberately, which is
the point.

**None of this is legal advice.** It encodes published rules so the platform can be
honest about what it owes and what it may claim. The live questions — whether a work
with disclaimed AI authorship is a "musical work" for §115, and whether owning the
compositions removes the need for a blanket license — are for a lawyer.

---

## Selling what already existed, and a DOSI audit — 2026-09-25

**4 sellable tracks became 93, and 0 albums became 5.** Nothing was bought or
uploaded; the audio was already there. 3.8 GB in Firebase Storage and 1.3 GB in R2,
and not one song record said WHERE. `previewOnly` is an inventory flag, and the
inventory was unfindable.

`npm run link:masters` reads **both** stores and ranks across them with one rule --
lossless, then largest, then newest -- so a Firebase WAV beats an R2 MP3 for the same
track. 32 matched WAVs, 57 matched MP3s, 49 matched nothing and stay blocked.
Matching is by normalised title because the stores name files differently
(`BrightCorners.mp3` vs `1771182059552_Bright Corners.wav`); every rejected candidate
prints, so the pick is checkable rather than trusted.

**It stores a path, never a URL.** `songs` is world-readable; a URL would publish the
product. A path is inert *because* `storage.rules` restricts the folders -- which
required fixing `artist-uploads`, where `allow read: if request.auth != null` meant a
free account could take a full master once a path was published. Both the audio rule
and the catch-all had to change: **Storage rules OR their allow statements across
every matching path**, so tightening one while the other grants blanket read achieves
nothing. Deployed.

**License revocation** now backs the termination clause in `/terms`. Revocation is a
separate axis from payment: `status` describes money, `licenseRevoked` describes the
license, and they move independently (paid+revoked is abuse; refunded+revoked is a
chargeback). Overloading `status` would also have silently broken entitlement, which
tests for exactly `'completed'`. An album revocation cascades to its tracks, beats an
active subscription, and returns **410 Gone** rather than 403 -- telling a paying
customer they never bought something is how a policy decision becomes an accusation.

It stops future downloads only. The files are DRM-free; nothing here is a kill
switch. What it buys is that continued use becomes a breach, evidenced by the license
id and the acceptance record.

### DOSI audit of this session's own work

Two real failures, found by checking rather than assuming, and both fixed:

**D — rule-of-three blown three times over.** `unescapePem` had **6** copies,
`loadEnv` and `initAdmin` **5** each. Each copy carried a comment pointing at another
copy, which is duplication with a note admitting it. Extracted to
`scripts/lib/admin.js`. This mattered beyond tidiness: `unescapePem` is the function
already written wrong once here -- `download-master.js` shipped
`.replace(/
/g, '
')`, a no-op, and every download 502'd for as long as it
existed. Six hand-written copies of a one-character failure mode is six chances to
repeat it. (`download-master.js` keeps its own copy: a Netlify function cannot reach
`scripts/`.)

**I — invented vocabulary the product does not use.** The domain says `license` 201
times; this session introduced `licence` 46 times *including Firestore field names*,
so a purchase would have carried `licenseId` and `licenceRevoked` in one document.
Renamed across 27 files while nothing had yet been written with those fields. The
caveat is explicit: a name matching the UI, the DB column and how the team talks
beats a more elegant one matching nothing.

**Regression caught by running, not by syntax-checking:** de-duplicating broke
`link:masters`, whose old local `initAdmin` passed `storageBucket` that the shared
one takes as an argument. `node --check` passed on all five scripts; executing them
found it. Syntax is not behaviour.

**Ratchets:** 123 tests across 9 suites. `licence` spelling in identifiers: **0**.
Hand-written copies of `loadEnv`/`initAdmin` outside `scripts/lib/`: **0**.

---

## What was NOT built, and why — 2026-09-25

Percy asked whether the platform should carry a user-facing version, the way Suno
announces a new model generation with an upgrade prompt.

**Declined.** Suno versions the thing being sold — a user on v5 versus v6 gets
different music out, so the version is the product and is worth announcing. A version
of this storefront changes nothing a buyer receives. Announcing it asks them to care
about our plumbing.

**Also declined: a "what's new" announcement modal.** Checked before building:

```
published terms versions : 1      -> nobody is on an old one
purchases on stale terms : 0      -> nobody to notify
songs added in 90 days   : 138    -> the seeding, not a release cadence
```

A notifier with nothing to notify is decoration that reads as capability, and the next
person maintains it believing it works. That is the **I caveat** — do not invent
structure the content cannot support — and the PHAST rule applied to features: no
pillar for a capability the product lacks.

**And declined: a hand-maintained semver.** `package.json` has said `0.1.0` for **309
commits**, which is the argument made for us. A version nobody increments is a second
source of truth that lies. Git is the origin; the useful addition would be stamping
the deploy's `COMMIT_REF` onto purchase records so a sale can be traced to the code
that served it — offered, not yet built.

### What WAS built: `npm run verify:terms`

`agreements.js` forbids editing a published version in place, which creates an
obligation nobody was tracking: the moment a new version ships, every existing buyer
is on a superseded one, and a contract changed without telling the other side is a
weak contract. That obligation existed only as a comment.

This turns it into a number. Detection only — it does not notify, because what to
send and whether continued use implies acceptance are decisions for a person and
probably a lawyer, and building the sending half first would bake in an answer nobody
chose.

**Unit is the purchase, not the user.** Acceptance is recorded per purchase because
that is what makes it evidence: this buyer, this text, this moment, this item. A user
who bought twice under two versions is two agreements, and merging them loses the
distinction that would matter in a dispute.

Exits non-zero when anyone is on superseded terms, so it can gate a release.
Pre-clickwrap purchases are reported but are **not** an error — they are historical
and cannot be retrofitted, only noted.

**Verified by simulation, not by assumption:** bumping the version to a future date
made it report 1 superseded buyer with the email, then reverting returned it to 0. A
detector that has never detected anything is untested.

**Ratchet:** buyers on superseded terms — **0**. It stays 0 until a version is
published, and the first non-zero is the notification obligation appearing.

---

## DOSI pass — 2026-09-25 (second)

**D — an abstraction extracted but not adopted.** `scripts/lib/admin.js` was created
earlier the same day and only the newest script used its `args()` and
`assertProject()`. Five others still rolled their own argv parsing and inline project
check: the helper existed, the duplication stayed, and the next script would have
copied a neighbour. Half an abstraction is worse than none — it reads as done.
All five converted; hand-rolled argv parsers now **0**.

**Regression caught by running, again.** The conversion dropped `ROOT` from the
import while four scripts still used it. `node --check` passed on all five; executing
them failed instantly with `ROOT is not defined`. Second time in one day that syntax
passed and behaviour did not, which is the argument for running every script after
touching shared code, not sampling one.

**I — deleted two files that were worse than dead.**
`src/utils/fixSongPricesClient.js` and root `fix-song-prices.js`: zero importers,
and both hardcode **2900 / $29.00** while the canonical price is **199**. Not merely
stale — *actively dangerous*, because running `fix-song-prices.js` would have written
$29.00 back across the catalogue and undone the repair done hours earlier. It also
wants a `serviceAccountKey.json` on disk, which is the file pattern that leaked a
live key from this repo before. A name that no longer matches the domain is a
deletion candidate; one that contradicts the canonical value and can destroy data is
a deletion.

**S — `assetPools.js` was canonical for a concern the table did not list.** Added.
If a concern is not in the table, that is the finding.

**O — nothing.** No profile, no query log, no bundle delta, so no optimisation. If
the metric cannot be stated, it is not optimisation.

**Ratchets:** hand-written copies of `loadEnv`/`initAdmin`/argv parsing outside
`scripts/lib/` — **0**. Canonical modules absent from the Single Source table —
**0**. Files contradicting `pricing.js` — **0**. Tests **123** across **9** suites.

---

## The front page was never separated — 2026-09-30

Pool separation was built into `HomeStorefront` and the browse routes, and `/` renders
`Home.js`, which had no `assetPool` filter at all. So every surface *except the front
door* was fixed. Found only because Percy screenshotted the chip row and asked whether
it was wired.

**The lesson worth keeping: "the storefront" was two components, and the work was done
to the one that was easier to find.** Grep for the concern (`assetPool`), not for the
component you remember touching.

### S — one flag for what has not launched

`src/config/comingSoon.js` is now canonical for content types the platform intends to
sell but has not built. Measured against the live database:

| collection | documents | writers in repo |
|---|---|---|
| `podcast_episodes` | 0 | none |
| `audiobooks` | 0 | none |

`purgeFirebase.js` already carried `// Not implemented` against both. So a cleanup
script and a storefront disagreed about whether the product existed, and the storefront
was the one customers could see. `/audiobooks` quoted **$12.99/month** against zero
inventory — a price on a page is an offer.

**These are hidden, NOT deleted, and that is the point.** The I caveat says a name that
no longer matches the domain is a deletion candidate. These names match a domain we have
not reached yet, so they are gated instead. Launching one = delete its entry; the chips,
the route and the Firestore listeners all read the same flag, so there is no second list.

The listeners are gated too: both opened a billed connection on every front-page visit
to fetch nothing, forever, and the error handler made that indistinguishable from an
empty collection.

### D — two chips, one answer

`All` and `Music` both resolved to `trendingSongs`. Clicking either changed the
highlight and nothing else, which a reader cannot tell apart from a broken control.
`Music` removed rather than given a distinct meaning: the page *is* the music catalogue,
so a chip narrowing it to "music" names a distinction the product does not have.

### I — a badge that numbered an arbitrary list

The `#1 #2 #3` trending badge ranked by `playCount`, which is **0 on all 923 records**.
Firestore was falling back to document id, so the badge stamped a confident ranking onto
an arbitrary order. Removed until there is play data to rank by.

**This is not fixed by this session's work and must not be reported as fixed.** Filtering
by pool makes the shelf arbitrary *within the right catalogue*. That is an improvement
and is not the same as the shelf being correct.

### Indexes — and a flap that nearly got reported as success

Added `songs(assetPool, playCount DESC)` and `songs(assetPool, releaseDate DESC)`.
A `where` and an `orderBy` on different fields cannot be served without one, and
Firestore **fails the query outright** rather than degrading.

Both listeners had **no error handler**, so that failure would have rendered as an empty
shelf — the exact signature of an empty catalogue. Handlers added; `failed-precondition`
is surfaced by name because it means "the index is still building".

**The flap:** immediately after deploy, one poll returned `trending=20 newReleases=15`
and the very next query failed with *"that index is currently building"*. A single
success is not proof during an index build. Re-verified with **three consecutive
passes** before calling it done. Ratchet: index readiness is never claimed from one
green query.

### Open — the platform tabs promise inventory that does not exist

`/browse/tiktok`, `/instagram`, `/youtube` are `soft: true` and filter on
`song.platforms`, present on **0 of 562** library tracks — so all three return the
identical set as `/browse/library`. The All/Music fault, three times over.

Tagging will not fix it. Duration across the production library:

```
< 15s      2      1-3 min   193
15-30s    11      3-5 min   318
30-60s     9      5+ min     29        loopable=true: 0
```

**511 of 562 are 1-5 minutes.** The library is beds and cues, not short-form hooks, and
"platform" here is a property of the *cut*, not of the track — which duration and
loopable already describe, from data that exists. `/browse/youtube` is also headed
*"Tracks licensed for YouTube monetization"*, a licence claim over an unfiltered list.

**Resolved: all three removed**, and the route to that answer is the part worth keeping.
The first pass kept YouTube -- a 3-minute bed genuinely is YouTube music -- and Percy
rejected it. He was right: the argument for cutting the other two was that platform is
not a property of a track, and a YouTube page with no `match` then differs from
/browse/library only by its heading, which is the fault it was meant to escape. **An
argument that only applies to two of three cases was not the real argument.**

Renaming to "Social Media" was raised and rejected on the same ground: the same
unfiltered 562 under a vaguer promise, or 22 tracks if filtered honestly on duration. The
I caveat decides it -- a name that no longer matches the domain is a deletion candidate,
not a rename candidate. All three 301 to /browse/library.

The honest control already existed: the duration facet in BrowseFilters, derived from
data that is present. `PLATFORM_OPTIONS` is KEPT for the uploader and admin editor --
the tags describe what a track suits, and are worth recording before the edits exist --
but the comment promising every option is a /browse/:slug route is gone. That promise is
what created three pages for a field nothing populated.

### Licensing, as it actually stands

There is **no per-platform licence**. `pricingPlans.js` sells "License for all major
social platforms" as one grant, and a licence record carries `userId`, `trackId` and
`licenseType` — no platform field. `platform` appears once, in
`registerPublishedProject`, derived from a URL the customer supplies: it records where
they *did* use a track, not where they *may*. That is self-reported usage for locking in
perpetual rights, not enforcement.

### Ratchets

Storefront components without a pool filter — **0** (was 1 of 2).
Chips resolving to the same content as another chip — **0**.
Firestore listeners on the front page without an error handler — **0**.
Collections subscribed with zero writers in the repo — **0**.
Unlaunched surfaces gated outside `config/comingSoon.js` — **0**.
`playCount > 0` across the catalogue — **0**. Until this moves, no shelf may claim rank.

## Concepts covered

| Concept | Decision that surfaced it | Call |
|---|---|---|
| **Scope of grant** — a licence is cut along media/platform, territory, term and exclusivity; price is a function of width | Whether to sell per-platform licences | Keep the bundle; price *use type* and *term*, the axes already modelled. Grant wording is a lawyer question, not settled here |
| **Composite index as a hard precondition** | Adding `where` + `orderBy` on different fields | Firestore fails the query rather than degrading — so the index ships with the query, and the listener needs an error handler or the failure looks like an empty catalogue |

### The collection survived the import — and is a string nothing joins on

Percy's observation, and it is load-bearing: the production library was imported **by
folder**, and the folders were already collections. They survived — stored as
`album`/`albumTitle`, **24 distinct values across 754 tracks, zero missing**:

```
56 Jazz-Infused Neo-Soul Instrumentals   26 Piano Trio Cocktail Music For Relaxation
48 Relaxing Chill Music                  24 Ambient Sitar for Calm & Sleep
48 After Midnight Vibes                  24 Deep Sleep / Sleep Transition
48 8d Music - Dragon Burial              24 Deep Focus Mind Lab / Work Flow / Deep Work
43 Sunset Chill Vibes                    21 Best of House
35 Balearic                              16 Party songs
```

These are not genres, they are **situations** — a venue programming grid that already
exists. Piano Trio Cocktail is a restaurant, Ambient Sitar is a spa, Balearic and Best
of House are a gym, Deep Focus x4 is a coworking floor.

**A correction this forced.** The advice given earlier that day was "do not sell 25
tracks, sell the pool", on the grounds that policing an arbitrary subset is a support
burden that earns nothing. That is right about a subset the customer assembles and wrong
about these: a named, curated collection is not a list to police, it is a product with a
name. **The channels are the product; the pool is the inventory.**

**The gap:** `library tracks with albumId: 0 of 754`. No `collections/` document, no
join. The ingest script's own comment names the risk it then walked into — *"six loose
tracks with a shared string in a field nothing joins on"* — it applied that reasoning to
the 4 release folders and left the 24 collections as text. So a collection cannot today
be linked to, priced, put in a cart, or granted.

**Semantic call: `collection`.** Percy says collection; the ingest script says collection
(`item.collection`, `byCollection`, "scope to one collection"); only the database field
says `album`. Two of three already agree and the odd one out is the wrong one.

- **Not `channel`**, though that is the industry word for the venue product. A collection
  is what the thing *is*; a channel is what it is *sold as* in one product. Naming the
  entity after a tier that does not exist yet would bake one product's vocabulary into
  something that must also serve browse, licensing and the library UI.
- **Not a rename of `album`**, which keeps meaning *release* — what it already means for
  the 16 albums and the 4 release folders. Do not rename an established concept because
  a better word exists.

Planned: `collections/` docs, `collectionId` + `collectionTitle` per track, `album` and
`albumId` reserved for releases. **Clearing `album` on the 754 library tracks is the
honest end state but needs a consumer audit first** — something may be reading it, and a
write that breaks a surface is worse than a field with a stale meaning.

### Licensing — the three-axis model, and why nothing fits the venue case

A restaurant wanting background music has nowhere to go, and `Terms.js` already says so:
public performance in "restaurants, cafés, gyms, retail premises, salons" is in the **not
granted** list, requiring "a separate license from us" **which does not exist**. The legal
position is correct and the product is missing.

The tangle is that there are THREE answers to "what does a plan grant", and none is on
the licence:

| Where | Says | Live |
|---|---|---|
| `data/pricingPlans.js` | student/creator/pro/agency — licensing | yes |
| `services/entitlementService.js` | Free / Premium $9.99 / Family $14.99 / Artist Pro — **streaming** | no — reachable only via a middleware nothing imports |
| `licenses/{id}` | `licenseType` + a tier name | yes, and says nothing about permitted use |

`LICENSING_TYPES` in entitlementService already defines `SYNC`, `PERFORMANCE`,
`MECHANICAL` and `TERRITORIES`. The vocabulary exists and nothing uses it.

**The model: three orthogonal axes.**

1. **Delivery** — `download` (a file they keep) | `stream` (playback from us)
2. **Grant** — `sync` | `performance` | `broadcast` | `mechanical`
3. **Scope** — term, territory, and for venues **locations**

| Product | Delivery | Grant | Scope |
|---|---|---|---|
| Creator tiers (existing 4) | download | sync | while subscribed + published-perpetual |
| One-off track licence | download | sync | perpetual |
| Venue (not built) | **stream only** | performance | per location, while subscribed |

**Delivery follows from use, and that is the enforcement.** A creator needs the file
because they are editing it into a timeline; a venue needs playback because it is
performing it. A venue holding 25 masters cannot be stopped by cancelling a subscription
and cannot be audited — with a stream, cancellation stops the music. **Leverage lives in
the delivery mechanism, not the contract; a term you cannot observe or revoke is a wish.**
This is why Soundtrack Your Brand and Cloud Cover ship an app, not files.

Open wrinkle: **hold music** usually needs a file, because phone systems take an upload.
That needs a narrow download bound to the on-hold grant, or a stream URL if the PBX
supports one. Not solved, not pretended to be.

**The landmine on "PRO-free".** Controlling both the recording and the composition would
let BFMG licence a venue directly and let it skip ASCAP/BMI — which is the entire pitch
of the competitors above, at $27-70 per location per month. It holds only with 100% of
the writer share on every track in the package. Measured: of 754 library tracks, **zero**
carry any writer, publisher, PRO, split or ISWC field. Nothing in the data supports the
claim yet, and this is the one item on the list that needs a lawyer before it is sold.

**Consumer streaming was considered and declined.** The Individual/Duo/Family/Student
ladder already existed and was already 301'd to /explore-premium, and no playback in the
app is subscription-gated. In streaming the product is catalogue breadth — 169
commercial-release tracks against Spotify's ~100M is not a comparison with a winning
price. In licensing the product is permission and curation, where 754 tracks is plenty.

### Concepts covered (continued)

| Concept | Decision that surfaced it | Call |
|---|---|---|
| **Public performance right** — playing a recording in a commercial space is a use legally separate from copying or syncing it | A restaurant wanting 25 tracks for business hours | Needs its own product; `Terms.js` already reserves it. Direct licensing could bypass PROs, but only with 100% writer share — unevidenced today |
| **Delivery vs grant** — what you receive is separable from what you may do | Whether venue subscriptions include downloads | Creator yes, venue no. Stream-only is what makes cancellation mean anything |
| **Catalogue breadth vs curation** — streaming sells breadth, licensing sells permission | Whether the four tiers should become streaming plans | Keep them as licensing; 169 tracks cannot win a breadth comparison |

## 134 records were taking money for a 30-second preview — 2026-09-30

Found by walking Downloads/Music recursively after Percy asked whether the folders
needed recursing. They did: the first audit read one level, the real tree holds **1007
audio files** (697 wav / 300 mp3 / 10 m4a), 5 of them nested two deep.

**`npm run verify:masters` already existed and already reported this. Nobody had run
it.** 134 of the 169 commercial releases were `previewOnly: false` with no master
behind them, so the purchase path fell through to `audioUrl` -- the preview. Live, on
the deployed site, because production reads the same database.

**The lesson is not that the check was missing. It is that a check nobody runs is a
check that does not exist.** A `verify:*` script earns its keep only when something
makes it run; until then it is a comment that happens to be executable.

Applied: 134 blocked, re-read and verified. Sellable commercial releases 169 -> 35.

### What the recursion changed

A disk-vs-database audit keyed on FOLDER NAME reported 35 tracks missing. Recursing and
checking each against the catalogue cut that to 23, and caught a landmine:

**"I Should of Shown up For You" is already catalogued as the album "Should of Shown
Up"** -- all 12 tracks, title for title. The dry run planned to ingest them, and would
NOT have attached them to that album: `albumIdByTitle` matches normalised titles, and
"ishouldofshownupforyou" is not "shouldofshownup". The folder is not in `ALBUM_FOLDERS`
either, so all 12 would have landed as PRODUCTION-MUSIC cues -- a commercial release
duplicated into the library, at library prices, under a second name. Added to
`SKIP_FOLDERS` with the reason.

### Recovered: 14 tracks, and why they had been lost

`ingest-production-library.js` grouped by `slug(collection) + '|' + normTitle(title)`
-- correctly, since "two tracks called First Light in two collections are two products"
-- and then checked the catalogue with a GLOBAL title set, undoing it. Fixed to a
per-collection map.

  10  Party songs          blocked by titles in Percy's own albums -- "Control Room" by
                           Maps & Moments, "Stay Soft" by Unseen, "What Just Happened"
                           by the album of that name
   4  Sunset Chill Vibes   blocked by the "testing" junk album

The 4 junk records (album "testing", created 2026-07-16, no masterPath, **0 purchases
referencing them**) were backed up and deleted. Four real tracks had been unsellable for
months because four test records held their titles.

Catalogue: 919 -> **933 songs**, 576 production / 165 commercial / 192 functional.
Collections reconciled: `verify:collections` FAILED on the 14 new records with no
`collectionId` -- the guard doing exactly its job one day after being written -- then
passed at 768/768 after the backfill re-ran.

### Still broken, and only Percy can fix it

**Memphis Love: all 10 `.m4a` files are corrupt.** `ffprobe` returns `moov atom not
found` on every one -- truncated downloads, not a codec problem. Worse than the 6
previously recorded. Only "First Light" is catalogued, because it alone also has a good
mp3 and wav, so a released album stands at 1 of 10 tracks. Re-download from Suno.

**Arabic Deep House #1 is missing track 23 at source.** 26 files on disk, 26 in the
database -- the ingest is faithful, the download is incomplete. Percy spotted this from
the track count on the collection page.

### Open

`What She Said` holds 19 records against 18 files. The extra, "Like It's A Game To You",
carries an **HTML entity inside its storage path** -- `Like It&apos;s A Game To You.mp3`
-- and no file exists at either the escaped or the unescaped path. It is one of the 134
now blocked, so it cannot be sold, but whatever wrote `&apos;` into a storage key has
not been traced.

### Ratchets

Records sellable without a deliverable master — **0** (was 134).
Songs with album "testing" — **0**.
Library songs without a `collectionId` — **0** of 768.
Tracks lost to a cross-collection title collision — **0**.
Audio files in Downloads/Music outside a collection folder — **0** of 1007.

## One store for masters, and the file that was doing two jobs — 2026-10-01

906 masters now live in **beatflow-masters**, private, keyed `masters/<ISRC>.<ext>` or
`masters/id/<docId>.<ext>`. Firebase Storage is out of the delivery path. 834 streamed
out of GCS, 72 copied across from `beatflow-assets`, ~6.2GB, zero failures.

**R2 over Firebase**, decided while there are no clients, because the cost of the
decision only rises: zero egress against ~$0.12/GB under tiers that promise "unlimited
downloads while active"; and keys that a quoting bug cannot touch.

### The near-miss worth keeping

After migrating, the obvious tidy-up was to delete `audio/` from `beatflow-assets` —
the objects were verified byte-identical in the new bucket, so it looked provably safe.
Percy asked whether it would affect the station. It would have taken it off the air:

```
our migrated keys (audio/...)      : 72
referenced by the radio playlist   : 72 of 72
```

**The same object was a paid master AND a radio broadcast source** — one contract
requiring privacy, the other requiring public access. That is why a master was fetchable
at `pub-….r2.dev/audio/What We Don't Say.mp3`, 200, 7.6MB, no credentials. Not a
misconfigured bucket: one file serving two incompatible contracts.

The migration fixed it by making them independent copies. `audio/` stays, forever, until
the radio stops pointing at it.

**The verification was true and the conclusion was wrong.** "These files exist elsewhere"
is not "nothing else uses these files". Before deleting shared storage, ask who READS it,
not only whether the bytes are safe. The listing also held `LiteraryGemShopJingle1.mp3`
and two 100MB+ DJ mixes — a third business and the station's own content in the same
prefix.

### Duplication, three more times

- **`resolveMasterSource()`** — `download-master.js` knew two backends, `verify-masters.js`
  knew one, and the verifier WRITES: it blocked 120 deliverable records and turned whole
  albums into "Preview only". A guard that models the system differently from the code it
  guards does not merely miss faults, it invents them.
- **`r2Config()`** existed three times, and writing the migration was about to make a
  fourth — with `R2_ENDPOINT` where the variable is `R2_MASTERS_ENDPOINT`. Now in
  `lib/r2-presign.js`. The env var names are the contract, so the contract gets one home.
- **`.env` held two `R2_ACCESS_KEY_ID` lines**, the new pair appended rather than
  substituted. Which duplicate wins is a parser detail, not a decision. It also meant the
  old read-only credentials were still present, which is how the cross-bucket copy ran
  without a new token.

### Things that failed open

- `initAdmin({storageBucket: process.env.FIREBASE_PROJECT_ID + '...'})` evaluates its
  argument BEFORE initAdmin loads .env, so the bucket resolved to `.firebasestorage.app`
  and every existence probe was meaningless. Read lazily now, and the run prints which
  bucket it used.
- `args().value` only accepted `--name=value`, so `--limit 1 --apply` meant "no limit"
  and began migrating all 834. **A safety parameter that silently does nothing when
  mistyped reads as a seatbelt and is not fastened.** Both forms now.
- `verify:masters` printed "master found at masters/<ISRC>.wav" for files in Firebase
  that 404 in R2 — right verdict, invented reason. A correct tool reporting a false
  reason is how it loses the reader.

### 14 masters that were never lost

`audio/What We Don&apos;t Say.mp3` — an HTML entity in a storage key, pointing at
nothing, while the object sat there under its real name. All 14 recovered. The verifier
now warns on any entity it finds. **Whatever wrote them is still upstream and unfound.**

### Secrets

`netlify env:list --json` printed live values into the transcript — `STRIPE_SECRET_KEY`,
`SMTP_PASSWORD`, `STRIPE_WEBHOOK_SECRET`, `NETLIFY_PRERENDER_AUTH_TOKEN`. My error, and
against the standing rule to read back names, lengths and prefixes only. **Never
`--json` on an env listing; filter to names, or format to prefix and length.** Rotation
outstanding; the R2 key among them was deleted rather than rotated.

### Ratchets

Delivery backends — **1** (was 2).
Implementations of "where is this master" — **1** (was 2).
Copies of `r2Config()` — **1** (was 3).
Duplicate variable definitions in `.env` — **0** (was 1 pair).
Masters fetchable without credentials — **0** (was 72).
Live tokens nothing uses — **0**.

## Node 22, and what a load-sweep found — 2026-10-05

Firebase stops accepting `nodejs20` deploys on **2026-10-30**. Done 25 days early,
because the failure mode is a REFUSED DEPLOY, which arrives while you are trying to ship
something else rather than when you have time for it.

A pin change, not a port: local node was already v22, `firebase-functions ^7.0.5` and
`firebase-admin ^13.6.0` both support it. **Five pins, one outside the repo** —
firebase.json, functions/package.json, netlify.toml, .nvmrc, and `NODE_VERSION` in the
Netlify environment. Verified from Firebase afterwards: **19 of 19 functions report
nodejs22**, read back rather than taken from the deploy log.

**Editing firebase.json does not move the live runtime.** `firebase deploy --only
functions` does. On this machine it needs `$env:FUNCTIONS_DISCOVERY_TIMEOUT=120` in
PowerShell — the default 10s cannot load 19 functions, and it fails as "User code failed
to load", which reads like a code fault and is a clock.

### Loading every function is a different test from pinning a version

All 21 Netlify functions and all 19 Firebase exports were required under v22 before
deploying. The first sweep reported 15 failures — **all of them missing credentials in a
bare `require`, not incompatibilities.** Re-run with `.env` loaded, every one passed.
A probe that reports failure has to be read before it is believed; this one would have
sent the whole migration back for no reason.

### Two dead files it surfaced

**`netlify/functions/updateMonthlyListeners.js`** parsed
`JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)` at module load. That variable is not
set in Netlify — the environment carries `FIREBASE_PROJECT_ID`, `CLIENT_EMAIL` and
`PRIVATE_KEY`. It has thrown on **every invocation since it was written**, on Node 20,
and nobody noticed because nothing calls it and nothing schedules it. A function that
cannot start, that nothing invokes, is indistinguishable from one that works.

**`src/data/artistData.js`** was a fixture for *Lalah Hathaway* — a real recording
artist unconnected to BFMG — carrying her biography, credits naming other real people,
and `monthlyListeners: 5501001`.

**I nearly reported that as live and was wrong.** `grep -l artistData` matched a
parameter name in metaTagsHelper.js and a state variable in RightPanel.js, and I read
those as imports. Checking for actual `import` statements found none, the name appears
in no other file, and it is absent from the build output. **A filename-shaped grep is
not an import check**, and the gap between them was the difference between "dead
fixture" and "fabricated statistic about a real person on a live site".

### Ratchets

Functions on a decommissioned runtime — **0** of 19.
Node version pins disagreeing with each other — **0** of 5.
Netlify functions that cannot load under the pinned runtime — **0** of 21.

---

## Full DOSI review — 2026-10-05

Percy asked for a full review producing something concrete rather than another rolling
list. Every number below was measured by a script, not asserted. Each finding carries an
explicit **fix / delete / leave** — including the leaves, because an unexplained absence
gets "fixed" by the next person.

Ranked by what can take money or publish content, not by line count.

### 1. Nine write endpoints took identity from the caller — S, critically

**Three were deleted outright** (unreferenced, unauthenticated, Firestore writes):

| Endpoint | What it did |
|---|---|
| `migrate-song-prices.js` | `where('price','==',299)` then `batch.update({price: 99})` |
| `migrate-license-ids.js` | rewrote purchase + download licence ids |
| `migrate-release-dates.js` | two unbounded `doc.ref.update()` passes |

Public POST, no auth, nothing in `src/` called them. `migrate-song-prices` would hit 0
docs today because all 906 songs sit at 199 — that is luck, not safety.

**Six more are deployed, live, and verify nothing:**

| Function | Caller | Takes from body | Effect |
|---|---|---|---|
| `request-payout.js` | `StripeConnectOnboarding.js` | `artistId`, `requestedAmount` | Stripe transfer |
| `create-connect-account.js` | `StripeConnectOnboarding.js` | `userId`, `email` | creates Connect acct |
| `update-subscription.js` | `SubscriptionManager.js` | `userId`, `newPriceId` | changes a plan |
| `approve-submission.js` | `contentIngestionService.js` | `submissionId` | publishes to catalogue |
| `reject-submission.js` | `contentIngestionService.js` | `submissionId` | rejects a submission |
| `process-revenue-split.js` | `stripe-webhook.js`, over HTTP | `purchaseId`, `amount` | credits artist balances |

Grepped for `verifyIdToken`, `Authorization`, `Bearer`, `stripe-signature`,
`constructEvent`, `requireAdmin`, `customClaims`. **Not one match in any of the six.**
They parse `event.body` and act on whatever id arrives. They use `firebase-admin`, so
Firestore security rules do not apply — the admin SDK bypasses them by design.

Measured exposure: **10 `artistBalances` docs totalling $217.12** and **48
`artistSubmissions`**. Small, but not hypothetical.

**Two corrections to the above, found while fixing it.** Both were mine, both came from
grepping too narrow a tree, and they are left visible rather than quietly edited:

1. **`process-revenue-split` was not uncalled.** `stripe-webhook.js:645` POSTed to it
   over HTTP. The caller column said "none" because the grep covered only `src/`. A
   server-to-server caller does not show up in a client-side search.
2. **`securityMiddleware` is not "already proven".** It is unusable as written:
   - It is curried through an `async` function, so `securityMiddleware(o)(handler)`
     evaluates to a **Promise**. Netlify calls `exports.handler(event, context)`, and a
     Promise is not callable — anything wired to it 500s on the first request. Verified
     by requiring it and checking the type, not by reading it.
   - Its only two users live in `netlify/functions/api/admin/`, which Netlify does not
     pick up as functions at all (a nested directory needs a `dir/dir.js` entry file).
     `netlify functions:list` does not show them. It has never run in production.
   - It requires `jsonwebtoken`, which is in neither `dependencies` nor
     `devDependencies` — it resolves only because firebase-admin pulls it in.

   So it is not half an abstraction that merely went unapplied; it is an abstraction
   that has never executed. Wiring money paths to 600 lines of never-run middleware
   that also brings its own rate limiting, CORS and request sanitisation is a large
   blast radius for a fix that needs twelve lines.

**What was done instead.** `netlify/functions/lib/require-auth.js` extracts the
verify-the-bearer-token pattern that *is* deployed and working in `create-checkout.js`
and `download-master.js`, and exposes the two halves separately:

| Helper | Proves | Used by |
|---|---|---|
| `requireUser(event)` | who is calling | base for the other two |
| `requireSelf(event, claimedId)` | caller owns the record | `request-payout`, `create-connect-account`, `update-subscription` |
| `requireAdmin(event)` | caller is a platform admin | `approve-submission`, `reject-submission` |

`requireSelf` is the half that actually closes the IDOR; authentication alone does not
stop one signed-in artist posting another's `artistId`. A platform admin may act for
another account, which is not a loosening invented here — `firestore.rules` already lets
`isPlatformAdmin()` update and delete records it does not own — and it is logged.

**`process-revenue-split.js` was deleted, not guarded.** It could not take a user token,
because its caller is a webhook. The logic moved to `lib/revenue-split.js` and
`stripe-webhook.js` now calls it in-process, which:

- removes the endpoint, so there is nothing to authenticate and no new secret to set,
  rotate or get wrong;
- removes the trust problem — `amount` now comes only from the verified Stripe session,
  where before a caller could POST `{itemId: <any real song>, amount: 100000}` and add
  $70,000 to that artist's `availableBalance`, which `request-payout` turns into a real
  transfer. **That was the most severe of the nine: an open endpoint on the money path.**
- makes it idempotent. The allocation doc id is now the purchase id and the balance is
  incremented in the same transaction, so a Stripe webhook retry — which happens by
  design — can no longer credit the artist twice. The old code used `.add()` plus a bare
  `increment()`.
- stops it lying. `fetch` does not reject on 4xx/5xx, so the old call logged
  `✅ Revenue split triggered successfully` even when the call had failed. The single
  signal that an artist had not been credited was a success message. Failures now land
  in `failedTransfers`.

**`approve-submission` and `reject-submission` needed no client change.**
`contentIngestionService.js` was already sending `Authorization: Bearer …` on both. The
server discarded it. Credentials were being presented and ignored.

### 2. 42 red suites, 2 real failures — the rest never compiled

```
Test Suites: 42 failed, 12 passed, 54 total
Tests:        2 failed, 127 passed, 129 total
```

40 suites fail to *load*; they never run an assertion. That looked like babel debt. It is
not. The cause:

```jsx
render(<TrackRow track={} onPlay={} onAddToPlaylist={} />);   // TrackRow.test.js
```

`track={}` is an empty JSX expression container — **invalid syntax**. These tests have
never compiled, not once. And the components they test are generated stubs:

```jsx
export default function TrackRow({ track, onPlay, onAddToPlaylist }) {
  return <div>{/* TODO: Implement TrackRow */}</div>;   // 7 lines
}
```

Each has a real implementation sitting beside it that the stub shadows by basename:

| Stub (tested) | Real (untested) |
|---|---|
| `components/TrackRow/TrackRow.js` — 7 lines | `components/TrackRow.js` — 461 lines |
| `components/NowPlayingBar/NowPlayingBar.js` — 12 | `components/NowPlayingBar.js` — 470 |
| `components/QueuePanel/QueuePanel.js` — 7 | `components/QueuePanel.js` — 509 |
| `components/PlayerProgress/PlayerProgress.js` — 7 | `components/PlayerProgress.js` — 405 |

The tests were written against the copy that is not shipped. Root cause, found by
grepping `TODO: Implement`: `src/agent/MolecularComponentAgent.js` and
`src/agent/PageComponentAgent.js` — generators that emitted stub components *and* invalid
tests. Nothing imports either generator.

- **Delete:** the 5 stub/test pairs, the 2 generators. Fixing babel here would buy
  coverage of code that does not ship — coverage that reads as coverage, which is exactly
  the I caveat.
- **Leave:** the babel/TS config. Once the generated files are gone, re-measure before
  touching it; the remaining `.test.ts` failures may be a real gap or may be more of the
  same, and I have not separated them yet.

Of 39 test files: **19 cover at least one live module, 16 cover only unreachable modules,
4 import no local module at all** (`Button.test.tsx`, `Input.test.tsx`, `Search.test.js`,
`penetration.test.js` — a penetration suite asserting against nothing is the worst of the
four, because its name claims the most).

### 3. 186 of 386 modules under `src/` are unreachable — 48%

Walked `import`/`require`/`import()` from `src/index.js`, `src/App.js`,
`src/AppRoutes.js`. 200 reachable, 186 not. 20 duplicate basenames, including
`AdminDashboard` three times (`analytics/AdminDashboard.js`, `.tsx`, `pages/`) and
`SecurityDashboard` twice.

- **Delete:** the subset proven dead in §2.
- **Leave, deliberately:** the other ~170. A reachability walk misses dynamic `require`,
  string-built paths and anything a build plugin pulls in. I nearly reported
  `src/data/artistData.js` as live this week off a filename-shaped grep, and nearly
  deleted radio's 72 audio files off "these exist elsewhere". **A bulk delete on a crude
  signal is how that goes wrong at scale.** Recorded as a ratchet instead: the number may
  fall, never rise.

### 4. `formatPrice` renders the same price two ways — D

```js
// src/utils/pricing.js:172        -> "$24.00"     (18 importers)
return `$${(priceInCents / 100).toFixed(2)}`;

// src/data/pricingPlans.js:401    -> "$24"        (4 importers)
return `$${amount.toFixed(2).replace('.00', '')}`;
```

Honest scope: **cosmetic, not a money bug.** Both divide by 100 correctly; they disagree
on trailing zeros. But price presentation is a licensing-product surface, and two
renderers will drift further.

- **Fix:** `utils/pricing.js` is canonical on weight (18 vs 4) and on being the module the
  checkout path already trusts. Delete the `pricingPlans` copy; if the compact form is
  wanted for plan cards, it is an option on the one function.

### 5. Seven domain rules defined more than once in live code

Filtered 126 raw repeated definitions down to rules (not event wiring) that repeat in
*reachable* modules — duplication inside dead code is a deletion question, not a DRY one.

| Rule | Live copies | Call |
|---|---|---|
| `formatDuration` | 4 — `TrackRowCard`, `HomeStorefront`, `Playlist`, `SongPage` | **fix** |
| `formatDate` | 3 — `StudioInquiriesManager`, `Album`, `Playlist` | **fix** |
| `formatTime` | 3 — `MiniPlayer`, `MusicPlayer`, `VideoClipGenerator` | **fix** |
| `formatPrice` | 2, diverging | **fix** (section 4) |
| `formatFileSize` | 2 — `ContentHub`, `ContentUploadInterface` | **leave** |
| `slugify` | 2 | **leave** |
| `slug` | 2 | **leave** |

- **Fix:** the three at 3+ copies into `src/utils/format.js`. `formatDuration` and
  `formatTime` are the same rule under two names — collapse to one.
- **Leave:** the three at exactly two copies. Rule-of-three: extract on the third repeat,
  not the second. `formatFileSize` in an upload UI and a content hub may well drift apart,
  and two blocks drifting apart are two blocks.

### What this review did not cover

Said plainly so it does not read as a clean bill of health: 371 Dependabot advisories (9
critical) were not triaged; `playCount` is 0 on all 906 songs, so trending is unsorted
rather than wrong; the venue/public-performance product still has an enquiry path and no
product; `genreSlug` ownership with radio is unsettled and is a decision, not a build.

### Concepts covered (continued)

- **IDOR (Insecure Direct Object Reference)** — taking an id from the caller and acting on
  it without checking the caller owns it. `request-payout` reading `artistId` from the body
  is the textbook case: a signed-in artist could pass someone else's id. The fix has two
  halves people routinely conflate — *authentication* proves who is calling,
  *authorization* proves they may touch this record. The middleware gives the first;
  comparing `token.uid` to the body's id gives the second. Surfaced when deciding whether
  wrapping six functions in the existing middleware was sufficient. On its own, it is not.
- **Admin SDK bypasses security rules** — Firestore rules guard client SDK traffic.
  `firebase-admin` is privileged by design, so a Netlify function's writes are never
  rule-checked. Any function using it is the *only* thing standing between a request and
  the database. Surfaced when assessing whether rules mitigated the six endpoints. They
  do not.

### Found while fixing section 1: 25 rules that grant access to nobody

`npm run verify:admins` (new) reconciles the admin list in `firestore.rules` against
`src/utils/platformAdmins.js`. The lists agree. The third check does not pass:

**25 lines of `firestore.rules` require `request.auth.token.admin == true`, and
`setCustomUserClaims` is called nowhere in this repo.** That claim is never true for
anybody, so those rules do not grant narrow access — they grant none. Lines 173, 188,
234 and 291–335 are the pure ones (`allow read: if request.auth.token.admin == true`),
so any client-side admin UI reading those collections is denied today. The rest are
`uid == owner || token.admin`, which still work for the owner and never for an admin.

This is why `approve-submission.js` existed as a function at all: the rules locked
submission writes to a claim nobody holds, so the admin SDK was the only way in — and
it checked nothing. Fixing the function closes the hole; it does not fix the rules.

- **Not fixed here, deliberately.** The repair is either granting the claim to the two
  canonical admins or changing 25 rule lines to `isPlatformAdmin()`, and both are a
  Firestore rules deployment that wants testing on its own. Bundling a rules deploy into
  an auth fix is how one of them gets blamed for the other.
- **Blocked on credentials either way:** granting the claim needs the service account,
  which still returns `16 UNAUTHENTICATED`.
- `verify:admins` is deliberately **not** in `verify:all` while it is red. A known-red
  check inside an aggregate makes the aggregate ignorable.

Separately, `verify:all` ran 2 of 11 verifiers. It now runs the 8 static ones.
`verify:masters`, `verify:terms` and `verify:collections` stay out because they need
Firestore credentials and would fail on a machine that has none, which trains people to
ignore the result.

### Ratchets

| Measure | Today | Direction |
|---|---|---|
| Unauthenticated write endpoints | **0** (was 9) | hold at 0 |
| `firestore.rules` lines needing an ungranted claim | 25 | to 0 |
| Verifiers run by `verify:all` | 8 of 12 | may rise, never fall |
| Unreachable modules under `src/` | 186 / 386 | may fall, never rise |
| Duplicate basenames in `src/` | 20 | may fall, never rise |
| Test suites failing to load | 40 | to 0 |
| Suites covering only unreachable code | 16 | to 0 |
| Domain rules with 3+ live copies | 3 | to 0 |
| Files containing `TODO: Implement` | 14 | may fall, never rise |

### Verified, not assumed

- `require-auth.test.js` — 18 assertions, and the suite was **seen to fail**: planting a
  `return auth` that skips the ownership check failed 4 tests including the IDOR one.
  A green suite that has never been observed red is not evidence.
- `npm run verify:all` — 8/8 pass, including `verify:radio`
  ("RADIO PARSER OK — catalogue sync unaffected"). Nothing here touched
  `src/firebaseConfig.js`, which is what radio's `catalog.js` parses by shape.
- `npx react-scripts build` — exit 0, no new warnings.
- Full suite: **145 passing, up from 127** (+18 new), with the same 2 pre-existing
  failures and no new ones. The 42 load failures are unchanged and are section 2.
- `verify:admins` itself passed on the first run and was **wrong to** — it contains the
  string `setCustomUserClaims` in its own source, so the scan found itself. Fixed by
  excluding the file and requiring a call, not a mention. Third time this class of bug
  has appeared in a verifier here, after `verify-links` and `verify-domains`.

### Scope: artist join is deferred — 2026-10-05

Percy parked the artist-join side of the platform (artist signup, submissions, Stripe
Connect onboarding, payouts) until BFMG is established on its own catalogue sales.
**Deferred, not cancelled** — the `config/comingSoon.js` doctrine applies: hidden, so
launching it is one edit rather than archaeology.

No coming-soon flag was added, because there is no entry point to gate. The artist-side
UI is already dark: `StripeConnectOnboarding`, `ContentIngestionDashboard` and
`ContentUpload` are imported nowhere. They are part of the 186 unreachable modules.

That is the uncomfortable part, and it is the lesson worth keeping: those four functions
were **deployed and addressable with no UI pointing at them**. An endpoint nobody can
reach through the product is not an endpoint nobody can reach — and it is the one nobody
is watching. Deployment decides reachability; hiding a feature never closes an endpoint.

- **Buyer-side subscriptions are NOT deferred.** `SubscriptionManager` is live via
  `/profile`, so `update-subscription` and the student/creator/pro/agency tiers stay.
- **The four artist endpoints stay deployed**, now behind `requireSelf`/`requireAdmin`.
  Netlify has no per-function exclude, so suppressing them means moving files out of the
  functions directory — churn now and archaeology later, for a surface that is already
  authenticated and tested.
- **Weight correction on the exposure figure.** `artistBalances` holds $217.12 across 10
  docs, but `revenueAllocations` and `payouts` are **empty** and `totalPaidOut` is 0
  everywhere. Nothing has ever paid out. That is dormant seed data, not money owed to
  real artists. The hole was real — `request-payout` would have transferred against
  those balances — but it was not $217 of obligation, and the earlier framing implied
  more than the data supports.
- **De-prioritised by this:** the 25 `firestore.rules` lines needing an ungranted
  `token.admin` claim guard mostly artist-side collections, as does the rejected service
  account that blocks granting it. Neither gates catalogue sales.

### Stripe: the canonical account, asserted — 2026-10-06

| | |
|---|---|
| Account | **BeatFlowMediaGroup** |
| Account id | `acct_1Bn3cBAEum2hO0KZ` |
| Asserted by | `MSYS_NO_PATHCONV=1 stripe get /v1/account` (and `--live`), confirmed against the dashboard |

The id is the same in test and live mode — one account, two data sets — so a mode is
proved by the key in use, never by the account id.

**The CLI was on the wrong account.** Before `stripe login` ran on 2026-10-06 it resolved
to `acct_1U4GfpQ56HLchPg8`, display name **"NewDevBuild"**. Anything previously derived
from the CLI — a webhook signing secret, a `stripe listen` session, a triggered fixture —
belonged to that account, not to BFMG, and would have failed by doing nothing visible.
That is the documented failure mode: the CLI is a second source of truth and nothing warns
you when it drifts.

**Assert, do not infer.** `stripe get /v1/account` before any CLI work that matters, and
check the id against the table above.

**Git Bash mangles the path.** `stripe get /v1/account` becomes
`GET /v1/C:/Program%20Files/Git/v1/account` under MSYS path conversion, and the error
reads like a bad endpoint rather than a shell problem. Prefix `MSYS_NO_PATHCONV=1`.

**A probe created a live Connect account.** `acct_1UNSkGA5zLGnrJnj`, created
2026-10-06T07:25:05Z with email `a@b.c`, from POSTing create-connect-account against
production before the auth fix was published. Nothing onboarded, no charges, no payouts.
The lesson is the ordering, not the account: **prove a deploy is live before probing an
endpoint that creates resources, and probe read-only paths first.** The published deploy
was still 18ddbcb1 from 2026-10-01 because production was `locked: true`, so the probe hit
the old unauthenticated code.

### Local Stripe webhook testing — 2026-10-06

Proven end to end against the sandbox on `acct_1Bn3cBAEum2hO0KZ`:

```
--> checkout.session.completed [evt_1UNTwOAEum2hO0KZpu543Dwi]
<-- [500] POST http://localhost:8899/.netlify/functions/stripe-webhook
    handler reached, stopped at stripe-webhook.js:181 "Missing required metadata"
```

**`netlify dev` does not work on this machine.** It dies installing the `prerender`
extension -- a tar extraction failure under `.netlify/plugins`
(`TAR_ENTRY_ERROR UNKNOWN ... @shikijs/langs/README.md`). Nothing to do with the app.
Use `netlify functions:serve --port 8899`, which skips the extension pipeline and loads
all 17 functions.

**Restricted-key permissions for the CLI.** Discovered one 403 at a time, so the whole
set is written down here:

| Permission | Needed by |
|---|---|
| **Debugging Tools — Write** (`stripecli_session_write`) | `stripe listen`. Not a resource permission; easy to miss |
| **Payment Methods — Write** | `stripe trigger checkout.session.completed` fixture chain |
| Checkout Sessions, Customers, PaymentIntents, Products, Prices — Write | the rest of the fixture chain |
| Events — Read | receiving forwarded events |

Deliberately left OFF: Connect, Transfers, Payouts, Balance, and everything live-mode.
The webhook credits artist balances, so a key that cannot reach transfers or payouts
means a mistake cannot move money.

**The signing secret is stable, not per-session.** `stripe listen` re-minted exactly the
value already in `.env`, so the local secret was never the problem. Worth knowing before
"re-derive the webhook secret" is reached for as a fix.

**The local functions write to PRODUCTION Firestore.** `FIREBASE_PROJECT_ID` is
`beatflowmedia`. A `checkout.session.completed` carrying real metadata would put live
`purchases`, `licenses` and `users` records in. The generic Stripe fixture carries
`metadata: {}`, so the handler throws before any write -- which is what makes it safe to
fire, and is why it stays the default way to test delivery here. Verified by checking
`purchases`, `licenses`, `downloads` and `revenueAllocations` for writes in the window:
none. **Exercising the real purchase path locally needs a separate Firebase project
first.**

**Signature verification was tested both ways.** A correctly signed payload is accepted
and routed; one with a bad signature is refused 400. A pass only means something next to
a fail -- the first probe "failed" because the HMAC key had its `whsec_` prefix stripped,
and the endpoint's complaint ("No signatures found matching...") reads like a raw-body
problem rather than a key one. **The whole secret, prefix included, is the key.**

**Open question, not a finding yet:** the handler returns **500** on an event it can never
process. Stripe treats non-2xx as a failed delivery and retries, and metadata will not
appear on a retry, so a malformed session produces repeated failures and error noise
rather than one refusal. Worth deciding what an unprocessable-by-design event should
return.

---

## DOSI review: Stripe — 2026-10-06

Measured, not asserted. Ranked by what takes money or loses evidence.

### 1. The webhook being maintained is not the webhook Stripe calls — S

Live webhook endpoints on `acct_1Bn3cBAEum2hO0KZ`:

| Endpoint | Events | Registered |
|---|---|---|
| `beatflowmediagroup.com/.netlify/functions/**webhook**` | checkout.session.completed, 9 more | 2025-05-05 |
| `us-central1-**sunoplaylistdownloader**.cloudfunctions.net/handleStripeWebhook` | checkout.session.completed, charge.refunded | 2026-02-16 |
| `us-central1-beatflowmedia.cloudfunctions.net/stripeWebhook` | 5 subscription/invoice events | — |

**`/.netlify/functions/stripe-webhook` is not registered at all.** That is the 1128-line
handler this project has been maintaining: licence ids, the clickwrap acceptance stamp,
`licenseFields`, and the in-process revenue split wired in earlier today. In production it
receives nothing. The registered Netlify endpoint is `webhook.js`, 582 lines, from
2025-05-05.

What the live handler does *not* write, measured by grep:

| | `webhook.js` (live) | `stripe-webhook.js` (not registered) |
|---|---|---|
| `collection('licenses')` writes | **0** | 5 |
| `licenseId` on the purchase | **no** | yes |
| `agreementVersion` / `acceptedAt` | **no** | yes |
| duplicate-purchase guard | yes (queries `purchases` first) | yes (idempotent by purchase id) |

So `create-checkout` collects a clickwrap acceptance, stamps the version and timestamp
into session metadata, and the endpoint that actually receives the event **drops them**.
The evidence that a buyer accepted a specific licence version is gathered and discarded.
That is the part to care about: it is not a missing feature, it is a missing record of
something the product asserts happened. See [[project-clickwrap-acceptance]].

**A second project is on the live account.** `sunoplaylistdownloader` has received BFMG's
live `checkout.session.completed` and `charge.refunded` since 2026-02-16. Whatever it does
with them, every BFMG sale is being delivered to a codebase that is not this one.

Small mercy on blast radius: `purchases` holds **2** documents. Both carry a `licenseId`,
which the live endpoint does not write — so they did not come from it. Conclusions from
two records are weak; the configuration finding stands on its own and does not need them.

- **Decide, do not guess:** which endpoint is canonical. If it is `stripe-webhook`,
  register it and retire `webhook.js`. If it is `webhook.js`, then this session's
  hardening went into the wrong file and should be moved.
- **Then:** confirm whether `sunoplaylistdownloader` should still be receiving BFMG events.

### 2. Two checkout paths, one of them unauthenticated — S / I

Both deployed, both called from `StripeButton.js` and `pages/Advertising.js`:

| | `create-checkout.js` (449 lines) | `create-checkout-session.js` (121) |
|---|---|---|
| Purpose | one-off licence sales | subscriptions + sponsorships |
| Identity | verified ID token (`verifyIdToken`) | **`userId`, `userEmail` from the request body** |
| Auth refs in file | several | **0** |
| Price source | server-side, from `utils/pricing.js` | Stripe `priceId` |
| Licence acceptance | **required**, current version enforced | none |

**Not simple duplication** — they genuinely serve different products, so collapsing them
would be the wrong call. The finding is narrower and real: one path verifies who is buying
and records what they agreed to, the other does neither. `priceId` means amounts still come
from Stripe, so this is **not** the arbitrary-amount bug that was fixed previously.

### 3. Three revenue-split implementations — D

`webhook.js` splits inline and writes `artistBalances` directly; `lib/revenue-split.js` is
the extracted, idempotent, transactional one; `src/utils/revenueSplit.js` is a third. The
live endpoint uses its own inline copy, so the idempotent one added today is not the one
running. The Stripe client is constructed **12** times across the codebase.

### 4. `netlify/functions/api/stripe/*` is not deployed — I

`onboard.js`, `payouts.js`, `requestPayout.js` sit in a nested directory, which Netlify
does not pick up as functions (a nested dir needs a `dir/dir.js` entry file). Same trap as
`api/admin/`. They are not endpoints; they are files that look like endpoints.

### Stripe compliance — what was checked, and the line

**This names requirements and shows where the implementation falls short. It does not
certify compliance.** Payments, consumer disclosure and money transmission are exactly
where that distinction matters; get this reviewed by someone qualified for the
jurisdiction.

Verified clean:

- **No raw card data anywhere.** No `cardNumber`, `cvc` or `card[number]` in `src/` or
  `netlify/functions`. Card details stay with Stripe, which is what keeps PCI scope small.

Gaps found on the live account:

| Setting | State | Why it matters |
|---|---|---|
| `statement_descriptor` | **not set** | What the cardholder sees on their statement. Unrecognised descriptors are a leading cause of disputes |
| `business_profile.support_email` | not set | Stripe surfaces it on receipts and in disputes |
| `business_profile.support_url` | not set | same |
| `business_profile.url` | not set | same |

Gaps found on the site:

- **No auto-renewal disclosure.** Searched the legal pages for "auto-renew" and
  "automatically renew": **0 hits**, while the product sells four monthly subscription
  tiers. Recurring-billing disclosure is both a card-network expectation and a common
  consumer-protection requirement.
- "refund" appears on 1 legal page, "cancel" on 2. Present, but not verified as adequate.

Other:

- **The sandbox has 0 enabled webhook endpoints**, so nothing there exercises a webhook
  without a local `stripe listen`.
- **Account default API version is 2017-12-14**, which governs the payload shape delivered
  to every endpoint above.

### Correction: the Suno endpoint is load-bearing — 2026-10-06

Percy: the Suno Playlist Downloader is **not associated with BFMG** as a business. That is
true commercially and **does not make its webhook endpoint safe to remove**, which is what
the review above implied.

`stripe get /v1/prices --live` lists, among 13 active live products:

```
Suno Playlist Downloader Pro - Bulk Download MP3/WAV with Lyrics Formatter
```

**Suno sells through BFMG's Stripe account.** That endpoint is how its customers get
fulfilled, so deleting it breaks a live revenue-generating product belonging to a
different business. Same lesson as the radio audio files: *"this isn't ours" is not
"nothing uses this"*. **Do not delete it.**

The real finding is one level up: **two unrelated businesses share one Stripe account.**
That is commingling, and it is a business decision rather than a code one:

- One balance and one payout schedule for two businesses, so revenue has to be
  disentangled after the fact for bookkeeping.
- Disputes and chargebacks from either product affect the standing of the shared account.
- **Both webhook endpoints are subscribed to `checkout.session.completed`**, so BFMG's
  endpoint receives Suno's sales and Suno's endpoint receives BFMG's. Each will meet
  metadata it cannot interpret. BFMG's handler throws `Missing required metadata` on a
  session it does not recognise, which returns non-2xx and makes Stripe retry.

Separating them means a second Stripe account and re-creating Suno's product, price and
webhook there -- ids do not transfer between accounts. Worth costing before committing.

**Live activity, measured:** 4 events in Stripe's retention window, all
`checkout.session.expired`, newest 2026-09-28. No completed live sales. So the webhook
rewiring below can be done without disturbing live traffic -- and 4 abandoned checkouts
with 0 completions is its own thing worth looking at.

### Decision: `webhook.js` is canonical — 2026-10-06

Percy's call: the endpoint registered in production is the correct one. So
`netlify/functions/webhook.js` stays, and the licence-recording this session built into
`stripe-webhook.js` has to move into it rather than the other way round. Specifically,
what `webhook.js` is missing and must gain:

- `licenseId` on the purchase record, and the `licenses` collection write (currently 0)
- `agreementVersion` / `acceptedAt` from session metadata -- the clickwrap evidence that
  `create-checkout` already collects and the live endpoint currently discards
- the idempotent, transactional revenue split in `lib/revenue-split.js`, in place of its
  own inline `artistBalances` increments

`stripe-webhook.js` retires once that is done, so there is one handler rather than two.

### Runbook: giving Suno its own Stripe account — 2026-10-06

Percy's decision. Measured first, because the numbers decide how hard this is:

| | |
|---|---|
| Suno price | `price_1T1RsIAEum2hO0KZSb4Wcmse` on `prod_TzQjigN8dRYde8` |
| Amount | **$14.99, ONE-TIME** — not a subscription |
| Suno charges, ever | **2**, on 2026-02-16 and 2026-02-17, **none paid-and-unrefunded** |
| All live charges on the account, ever | 22 (19 x $1.00, 2 x $14.99, 1 x $1.99), newest 2026-02-17 |

**One-time pricing is what makes this easy.** There are no active subscriptions to carry
over, and subscriptions are the thing that cannot be moved between accounts. With two
charges, both already settled out and ~8 months old, there is also nothing left inside the
dispute window, so BFMG's account does not need to stay refund-capable for Suno.

**Order matters — these steps break Suno if run out of sequence.** The old product keeps
working until step 6, which is the point.

1. **Percy** creates the new Stripe account (identity and bank verification — not
   something this project can do).
2. In the **new** account, create the product and a **$14.99 one-time** price. Record the
   new price id. **Ids do not transfer between accounts**; the old one is meaningless there.
3. In the **new** account, create the webhook endpoint pointing at
   `https://us-central1-sunoplaylistdownloader.cloudfunctions.net/handleStripeWebhook`,
   subscribed to `checkout.session.completed` and `charge.refunded` to match what it
   receives today. **Re-derive** its signing secret; never carry the BFMG one across.
4. Update Suno's config with the **whole set from the new account**: secret key,
   publishable key, webhook signing secret, price id. A mismatched pair fails with errors
   that point nowhere near the cause. Suno's code is **not** under `C:\BeatFlowMedia`, so
   this happens wherever that project lives.
5. Deploy Suno and **put one real purchase through it**, end to end, in the new account —
   not a dashboard click. Assert the account id with a whoami before trusting any of it.
6. **Only then**, on BFMG's account: archive the Suno product and price, and remove the
   `sunoplaylistdownloader` webhook endpoint. Archive rather than delete, so the two
   historical charges stay attributable.

**Do not reorder 6 before 5.** Removing the endpoint while Suno still points at BFMG's
account means its customers pay and receive nothing, and the only symptom is silence.

After step 6, BFMG's account holds one business, and the cross-talk goes away: BFMG's
webhook stops receiving Suno's `checkout.session.completed` events and vice versa.

### Amendment: the Suno runbook's ordering no longer applies — 2026-10-06

Percy, same day: the only Suno purchase and customer is **him** — a test made with a live
card — and the project is **being re-coded** because Suno's product changed.

That removes the constraint the ordering above existed to satisfy. Steps 1–6 were
sequenced so paying customers were never left stranded between accounts. There are no
paying customers:

- the 2 live $14.99 charges were Percy's own test, neither paid-and-unrefunded;
- the surrounding 19 x $1.00 and 1 x $1.99 charges are the same kind of thing, which is
  what 22 lifetime charges on a commercial account actually means.

So the two halves are now **independent**, and neither waits on the other:

- **BFMG side, do whenever:** archive the Suno product and price, remove the
  `sunoplaylistdownloader` webhook endpoint. Nothing downstream breaks, because the only
  thing it fulfils is a rewrite in progress. Archive rather than delete so the historical
  charges stay attributable.
- **Suno side:** the new Stripe account is simply part of the rebuild. A re-coded project
  takes fresh keys and a fresh price id as a matter of course, so there is no migration —
  only a new account wired up from scratch.

**The caution that still stands** is the account assertion, not the ordering: whatever
Suno is rebuilt against, assert the account id with a whoami before trusting it, and keep
BFMG's keys out of it. One account per business is the point of the exercise.

### Decision: Studio is deferred, bundle and playlist_submission are dead — 2026-10-06

Percy on BeatFlow Studio: **in progress but stalled**. Its purpose is artists, managers
and producers buying a **complete album project** rather than a single track licence.
Deferred, not cancelled.

Measured before deciding:

| itemType | created in `src/` | collection | purchases ever |
|---|---|---|---|
| `playlist_submission` | no | `playlistSubmissions` 0 | 0 |
| `bundle` | no | `bundles` 0 | 0 |
| `studio_sample` | `Downloads.js` reads only | `studioSamples` 0 | 0 |

Every purchase ever recorded is `song` (1) or `album` (1). But `studioProjects` holds 5
documents and `studioPayments` 1 — exercised, not live.

- **`bundle` and `playlist_submission`: dead.** Nothing creates them, nothing holds them,
  no sale has ever used them.
- **Studio: kept.** `handleStudioProjectPayment` and the `studio_sample` branch exist
  **only** in `stripe-webhook.js`, which is not a registered endpoint. `webhook.js` has no
  studio branches, so deleting `stripe-webhook.js` would delete the only implementation of
  a feature that is coming back.

So `stripe-webhook.js` **stays**, and now carries a header saying why, because it sits in
the gap between two failure modes: someone deletes it and loses Studio, or someone
registers it with Stripe and silently swaps every other handler — including the licence
recording and the renewal handling that only `webhook.js` has.

**When Studio resumes:** port its handling into `webhook.js`. Never register this endpoint.

### Station saves, popularity, and the chart boundary — 2026-10-07

Percy: communicate the design to the station, keep the codebases apart, and be ready for
chart registration. The station's half is written up in `RadioStation/radio/SAVES.md`;
this is BFMG's half.

**The station's heart is "Save to your list", not a like and not a vote.** It writes to
`localStorage` and nothing leaves the browser today. BFMG's own `songLikes` is a different
act on a different surface. They stay separate fields: a save from a passive listener and a
deliberate like on a product page are different evidence and will want different weights.

**Saving currently has no payoff**, which is the actual problem — `paintSaved()` lists the
track and offers no way to buy it, while `releases.json` already carries the absolute
`/album/<id>` store URL that `catalog.js pull` wrote. Fixing that turns the save into a
**revealed preference**: the listener acts for their own benefit, so inflating it gains a
faker nothing. That is a better signal than a vote *and* it needs none of the anti-Sybil
weighting a vote would, because there is no prize.

**The chart boundary, because this is what "being prepared for Billboard" actually means.**
Saves do not feed charts. Billboard derives from Luminate, which is built from **sales** and
**streams reported by registered parties**; a proprietary engagement count is not
chart-eligible data in any form. Preparing is therefore work on the **sales** side here:

- ISRCs and UPCs correct and stable — the ISRC is already the station↔BFMG join
- purchase records carrying what a report requires
- pricing that satisfies the unit rules, including the known collision between the $4.99
  album floor and the "n x $1.99" album-unit rule, which has to be settled **before**
  registration rather than after

Two lanes, kept apart in the data as well as the words: **internal popularity** (saves,
likes, plays → "top songs" shelves) and **chart reporting** (verified sales, reported
streams). "Most saved this week" is honest. The same number presented as a chart position
is not.

Related: [[project-dsp-prd-chart-eligibility]] already records the pricing collision.

**Found while reading the like path:** `src/services/engagementMetrics.js:435` counts likes
with `where('songId','==',itemId)`, but `songLikes` documents are **keyed by** songId and
hold only a `likers` array — there is no `songId` field, so that query matches nothing and
the count is permanently 0. Same shape as the `purchases.where('songId')` bug in
`lib/entitlement.js`. Meanwhile `src/services/adminAnalytics.js:395` orders by `likeCount`,
so something is already ranking on this. **Not fixed here** — it is a separate change and
wants deciding alongside how popularity is actually computed.

**Landmine:** `src/utils/minimalCleanup.js` and `src/utils/purgeFirebase.js` both list
`songLikes` as deprecated in favour of a unified `likes` collection. Measured 2026-10-07:
`songLikes` holds 4 documents and 2 likers; `likes` holds **0** and nothing writes it.
Running either script would delete the live data in favour of an empty collection. Same
class as the `clear-songs.js` script deleted earlier.

---

## Revenue streams: what actually works — 2026-10-07

Percy asked whether the platform can process every transaction type. Measured against the
live account and the **deployed bundle**, not the source.

### THE FINDING: the live pricing page quotes one price and would bill another

`/explore-premium` returns HTTP 200 and advertises Student $9.99, Creator $24, Pro $49,
Agency $149. `ExplorePremium.js` carried
`process.env.REACT_APP_STRIPE_*_PRICE_ID || "price_1RPG…"`.

**Those env vars do not exist in Netlify's project settings.** Confirmed twice: they appear
in neither the "Injected project settings env vars" nor the "Ignored project settings env
var" lists in a `netlify dev` run, and `netlify env:get --context production` returns unset
for all four. CRA inlines `REACT_APP_*` at build time, so the build baked the fallbacks in
— **verified in the deployed chunk `609.2b7c7a1d.chunk.js`**, which contains all four. Of
111 chunks scanned, it is the only one holding any price id.

Resolved against the live account, those fallbacks are a different product line:

| Page advertises | Would actually charge |
|---|---|
| Student $9.99 | $9.99 — **Beat Campus** (amount coincides, wrong product) |
| Creator $24.00 | **$11.99 — Beat Solo** |
| Pro $49.00 | **$16.99 — Beat Duo** |
| Agency $149.00 | **$18.00 — Beat Household** |

Correct live prices for all four **exist and were simply unused**:
`price_1T10Pv…` $9.99, `price_1T10Qh…` $24, `price_1T10RE…` $49, `price_1T10Rh…` $149.

Direction matters: this **undercharges**, so it is lost revenue rather than a customer
overcharge, and no one has been affected — the account has 22 lifetime charges, newest
2026-02-17, and no live subscriptions. It was live and functional all the same.

**Root cause is the fallback, not the missing env var.** A missing configuration value
silently became a wrong price instead of an error. Same shape as `args().value` accepting
`--limit 1` and meaning "no limit": it reads as a seatbelt and is not fastened.

**Fixed:**
- Fallback ids deleted. A tier with no configured price id now yields `null`.
- `StripeButton` refuses to open checkout without a price id and says the plan is
  unavailable. The guard is in the button, so every caller is covered.
- `ExplorePremium` no longer carries its own copy of the tier prices. The displayed string
  is derived from `pricingPlans.js` via `getPlanById` + `formatPrice`, so the page and the
  charge cannot drift apart again.
- `verify:stripe` gained the check that would have caught it: it resolves the id the app is
  **configured with** and compares what it would charge against what the app advertises.
  The existing tier check only proved a correctly-priced price *existed* — which it did,
  unused, the whole time.

**Proven both ways.** With the fallback ids against live it exits 1 and names all three
mispricings; with the correct ids it exits 0. It also surfaced that the `pro` product is
named "Professional" in the sandbox and "Pro" in live, which had made the check report "no
active price" for a price sitting right there — fixed by matching a list of names.

**Still needed, and only Percy can do it:** set the four
`REACT_APP_STRIPE_*_PRICE_ID` in Netlify production to the `price_1T10…` ids above. Until
then the plans show as unavailable — which is the correct failure, but it is still a
failure.

### Status of every revenue stream

| Stream | Path | Production |
|---|---|---|
| Song purchase | `create-checkout` → `webhook` | **works** — price computed server-side from `utils/pricing.js` via `price_data`, no Stripe price id needed |
| Album purchase | same | **works** |
| Subscriptions ×4 | `create-checkout-session` → `webhook` | **broken until the env vars are set** (above) |
| Sponsorships ×3 | `create-checkout-session` | **cannot be sold** — price ids unset, `canPay()` returns false so the UI hides payment. No sponsor id appears in any deployed chunk |
| Studio album projects | handler only in `stripe-webhook.js` | **not wired** — that endpoint is unregistered; Studio is deferred |
| Submission credits | `submissionCreditsService.js` | no purchase path found |
| Artist payouts (out) | `request-payout` | authenticated now; artist join deferred |

Two structural notes. `create-checkout-session` hardcodes `mode: 'subscription'`, so it
cannot sell a one-time product — the live account holds one-time Personal ($29) and
Commercial ($58) Licence products that nothing in the app currently sells. And the live
account carries two subscription families, Student/Creator/Pro/Agency alongside
Beat Solo/Duo/Campus/Household; the second is what the stale fallbacks pointed at.

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

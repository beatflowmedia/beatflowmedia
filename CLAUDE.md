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
| "may this user have this item" | `netlify/functions/lib/entitlement.js` | `npm run test:lib` |
| Catalogue records (albums/songs) | **`C:/Users/percy/RadioStation/radio/releases.json`** — the station seeds BFMG one-way over ISRC; see its `catalog.js` | `node catalog.js diff` |
| Stripe pricing | `netlify/functions/create-checkout.js` (server-side price lookup) | e2e coverage |
| Which agreement a person accepted, and its version | `src/utils/agreements.js` (**CommonJS**, `create-checkout` requires it) | `npx jest src/utils/agreements.test.js` |
| What a licence IS (scope / term / grant) | `src/utils/licenseTerms.js` | `npx jest src/utils/licenseTerms.test.js` |
| Which agreement governs which product | `src/utils/licenseTerms.js` (`PRODUCT_AGREEMENTS`, `agreementForProduct`) | `npx jest src/utils/licenseTerms.test.js` |
| What is being sold for a given `(itemType, licenseType)` | `src/utils/licenseTerms.js` (`productForSale`) | `npx jest src/utils/licenseTerms.test.js` |
| Commercial licence pricing (track / album / collection) | `src/utils/pricing.js` (`calculateCommercialPrice`, `calculateCollectionPrice`) | `npx jest src/utils/pricing.commercial.test.js` |
| How many tracks a collection actually contains | the `songs` query on `collectionId` — **not** `collections.trackCount`, which is a stale derived copy | `npm run verify:collections` |
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
| Gap between cards in a responsive grid | `src/utils/layout.js` (`CARD_GRID_SPACING`) | `npx jest src/utils/layout.test.js` |
| Which packages the deployed functions may rely on | the ROOT `package.json` — `netlify/functions/package.json` and `agents/package.json` are INERT (no node_modules beside them) | `npm run verify:deps` |
| Which advisories matter | derived from `npm ls --all`, not from `npm audit --omit=dev` | `npm run verify:vulns` |
| The firebase-admin API the functions call | `netlify/functions/lib/admin-api.test.js` — the surface, never a pinned version | `npm run test:lib` |
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
6. **`firebase-admin` v14 removes the namespace every function uses, and `npm audit` calls
   it the fix.** `fixAvailable: firebase-admin@14.5.0` is a claim that a version exists
   without the advisory — **not** that your code runs on it. On v14,
   `require('firebase-admin')` returns the `app` module only: `admin.credential`,
   `admin.firestore`, `admin.auth` and `admin.apps` are all `undefined`, so every function
   throws **at module load**. The visible result is a successful Stripe charge followed by a
   500 in the webhook, no purchase row, and a buyer who paid for nothing. Guarded by
   `netlify/functions/lib/admin-api.test.js` (`npm run test:lib`). Fixing it properly means
   migrating to `firebase-admin/app`, `/firestore`, `/auth`, `/storage`.
7. **MUI `Grid spacing` takes a theme multiplier, and a CSS string yields ZERO spacing.**
   `spacing={2}` means 2 × 8px. `spacing={'clamp(2rem, …)'}` is not a fallback and not the
   default — the container gets `margin-top: 0` and every item `padding-top: 0`, so rows
   touch. Nothing warns: not the compiler, not eslint, not the console. Three grids shipped
   this way. The tell is comparing a broken grid (`mt: 0px / pt: 0px`) with a working one
   (`mt: -16px / pt: 16px`) on the same page. Use `CARD_GRID_SPACING` from
   `src/utils/layout.js`; guarded by `npx jest src/utils/layout.test.js`.
8. **A satellite `package.json` with no `node_modules` beside it is read by nobody.**
   `netlify/functions/package.json` and `agents/package.json` both describe dependencies for
   code in their directory, and both resolve from the ROOT install instead. Both were already
   wrong — one asked for `firebase-admin ^12` while 13.10.0 ran. Authoritative-looking and
   inert is the worst shape a config value can have. `npm run verify:deps` compares them.
9. **A dependency scan that misses a directory deletes something in use.** This repo has
   `agents/ api/ frontend/ middleware/ services/ functions/` beyond the obvious `src/`.
   Four packages were removed as "unreferenced" and broke `agents/cli.js`, which the
   pre-commit hook runs. Peer deps (`@emotion/styled`) and dynamic imports
   (`import("web-vitals")`) are invisible to a grep as well. `npm run verify:deps` resolves
   every `require()` rather than searching for names.

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
times; this session introduced `license` 46 times *including Firestore field names*,
so a purchase would have carried `licenseId` and `licenseRevoked` in one document.
Renamed across 27 files while nothing had yet been written with those fields. The
caveat is explicit: a name matching the UI, the DB column and how the team talks
beats a more elegant one matching nothing.

**Regression caught by running, not by syntax-checking:** de-duplicating broke
`link:masters`, whose old local `initAdmin` passed `storageBucket` that the shared
one takes as an argument. `node --check` passed on all five scripts; executing them
found it. Syntax is not behaviour.

**Ratchets:** 123 tests across 9 suites. `license` spelling in identifiers: **0**.
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
*"Tracks licensed for YouTube monetization"*, a license claim over an unfiltered list.

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

There is **no per-platform license**. `pricingPlans.js` sells "License for all major
social platforms" as one grant, and a license record carries `userId`, `trackId` and
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
| **Scope of grant** — a license is cut along media/platform, territory, term and exclusivity; price is a function of width | Whether to sell per-platform licenses | Keep the bundle; price *use type* and *term*, the axes already modelled. Grant wording is a lawyer question, not settled here |
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
the license:

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
| One-off track license | download | sync | perpetual |
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
let BFMG license a venue directly and let it skip ASCAP/BMI — which is the entire pitch
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
| `migrate-license-ids.js` | rewrote purchase + download license ids |
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
handler this project has been maintaining: license ids, the clickwrap acceptance stamp,
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
The evidence that a buyer accepted a specific license version is gathered and discarded.
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
| Purpose | one-off license sales | subscriptions + sponsorships |
| Identity | verified ID token (`verifyIdToken`) | **`userId`, `userEmail` from the request body** |
| Auth refs in file | several | **0** |
| Price source | server-side, from `utils/pricing.js` | Stripe `priceId` |
| License acceptance | **required**, current version enforced | none |

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
`netlify/functions/webhook.js` stays, and the license-recording this session built into
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
and producers buying a **complete album project** rather than a single track license.
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
registers it with Stripe and silently swaps every other handler — including the license
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
Commercial ($58) License products that nothing in the app currently sells. And the live
account carries two subscription families, Student/Creator/Pro/Agency alongside
Beat Solo/Duo/Campus/Household; the second is what the stale fallbacks pointed at.

### Station corrections mirrored — 2026-10-09

The station (`radiostation-24`) asked BFMG to mirror two catalogue decisions. Both
checked against live data; one needed a fix, one did not.

**1. Boom Bap Soul, Vol. 1 is not explicit — CORRECTED.** A DistroKid error the station
had already fixed on its side. All **10 tracks** on album `BxzJN6Q8NgrHZcF9XyW0` carried
`explicit: true`; the album document itself carried no flag at all. `TrackRowCard` renders
a badge straight off `track.explicit`, so the advisory was showing on a release that does
not warrant one — wrong metadata on a product page, and the kind that propagates outward
to DSPs.

Set to `false` rather than deleted, which matches the catalogue: of 300 songs sampled,
**298 carry `explicit: false` and none omit the field**. Firestore excludes a document
from any query naming a field it lacks, so deleting it would have hidden these tracks from
the explicit facet instead of marking them clean. Read back after the batch: 0 true, 10
false.

**2. Style tags shaped `<name>-style` — NOT PRESENT, nothing to do.** Percy does not want
artist names used as descriptors. Scanned every `styleTags`, `tags`, `styles`, `mood`,
`moods`, `genre`, `genres` and `keywords` value across all 906 songs for anything ending
`-style`: **zero**. Then searched the full JSON of all 906 songs and 15 albums for
`babyface|teddy swims|timbaland|neptunes` in any field: **zero**. The problem was
station-side only.

Recorded because an absence is worth writing down: the next person asked to "remove the
style tags from BFMG" should know they were never there, rather than going looking.

**Still open from the station**, none of it started:

- the art handoff in `C:\BeatFlowMedia\docs\STATION-ART-HANDOFF.md` — 12 wide 16:9 album
  masters, a traced logo SVG, brand green `#4DE94C`, IBM Plex. All 12 BFMG album ids in
  its table resolve in Firestore and the UPCs match; **0 of the 12 currently have wide
  art**. Per-album `og:image` cards need BFMG's own call to action, not the station's
  "LISTEN ON BEATFLOW RADIO" — today every album shares one generic share image
- exposing the plain-language license summary + `/terms` and `/sync-licensing` in
  `src/utils/licenseTerms.js`, so `catalog.js` pulls it like `storeUrl` rather than the
  station keeping a copy that can drift from the binding text
- reconciling **164 sellable BFMG commercial songs against the station's 134** before
  anything is marked sellable. Could be 30 the station does not carry, or a broken ISRC
  join; not yet established which

### ISRC join: BFMG 164 vs the station's 134 — 2026-10-10

The station asked which of its 134 tracks map to BFMG's 164 sellable commercial releases.
Joined on ISRC, which is the documented join between the two systems and the only
identifier here assigned by a standards body rather than by either platform.

```
station tracks (releases.json) : 134   (all 134 carry an ISRC)
BFMG commercial, deliverable   : 164   (134 with an ISRC, 30 without)
MATCHED on ISRC                : 134
on BFMG only                   : 0
on the station only            : 0
```

**A clean 1:1. There is no broken join and nothing is orphaned** — the station's whole
catalogue maps onto BFMG, so all 134 can be marked sellable together once production is
verified.

**The 30 are not a gap; they are records that were never distributed.** Every one lacks
an ISRC, and they group precisely:

| Count | Album | UPC |
|---|---|---|
| 12 | Eternal Flame | **none** |
| 9 | From Pain to Light | **none** |
| 6 | It's Christmas Time Again | **none** |
| 3 | *no album* | — |

Three albums with no UPC and no ISRCs never went through a distributor, which is exactly
why the station does not carry them. The station's own 12 albums all have UPCs.

**Two findings fall out of this:**

1. **The 3 orphans look miscategorised.** "Championship Round Flourish", "Classic Variety
   Show Theme", "Correct Answer Victory Stinger" are cue-library names sitting in
   `assetPool: 'commercial-release'` with no album. They read as production music in the
   wrong pool. Not changed — that is a catalogue call, not a cleanup.
2. **27 sellable tracks cannot ever be chart-reported.** Luminate needs ISRC and UPC.
   These are on sale with neither, so they are invisible to the sales lane described in
   the chart-boundary section above. Either they get identifiers before registration, or
   they are knowingly outside it. See [[project-dsp-prd-chart-eligibility]].

### `DOWNLOAD_LICENSE_SUMMARY` in `utils/licenseTerms.js` — 2026-10-10

Added so the license has one wording. The station needs a plain-language summary for the
terms-confirmation popup Percy asked for before a listener leaves for BFMG, and the
alternative — the station keeping its own copy — drifts the moment the license changes
here. That failure is silent and surfaces in a dispute.

`catalog.js` pulls it like `storeUrl`. It carries the headline, the summary, `termsUrl`
and `syncUrl`. Verified by assertion that every exclusion category in
`DownloadLicenseTerms.js` is represented: synchronisation, public performance, broadcast,
alteration, compilation, redistribution and AI/ML training. Checked against Terms.js
section 4, which is what actually binds.

It is a summary and says so. Not legal advice; wants a lawyer's review.

### The storefront shelves served the wrong catalogue — 2026-10-12

Percy, looking at the live site: *"I also see Production Library assets in Best Of… only
albums should be there"*, then sharper: *"tracks from albums only"*.

`src/hooks/usePersonalizedSections.js` runs **8 song queries and not one filtered
`assetPool`**. Home filters its own Trending and New Releases shelves on
`COMMERCIAL_RELEASE`; these seven shelves render on the same page and did not. So
"Best of Percy Rice" could serve game-show stingers from the production library beside
front-line releases, and "Made For You" could mix all three sub-brands — the exact
undifferentiated storefront the asset-pool discriminator exists to prevent (PRD §14).

**Filtered in JS, not in the query, and deliberately.** These combine
`where('genre','in',…)` or `where('artist','in',…)` with an `orderBy`, so an `assetPool`
clause needs a new composite index per combination, and Firestore **fails** a query whose
index is missing rather than degrading. A shelf that throws is worse than one showing the
wrong pool. Two limits raised 12 → 36 so filtering cannot starve a shelf.

**The rule is "tracks from albums", not "the commercial pool"** — Percy's correction, and
it is the better rule. It also means a shelf can never show something with no album page
to open. Measured after: 906 songs → **161** eligible.

### Three game-show cues were in the wrong pool — 2026-10-12

"Championship Round Flourish", "Classic Variety Show Theme", "Correct Answer Victory
Stinger" sat in `commercial-release` with no album and no ISRC. They are production-library
cues. Moved to `production-music` and into the **Game Show Walk-On** collection, which
already existed and already held 27 of exactly this material.

Each was re-verified immediately before the write — still `commercial-release`, still no
album, still no ISRC — with the batch refusing if any had changed. Game Show Walk-On
27 → 30; commercial-release 164 → 161. Every remaining commercial release now has an
album, so the pool and "tracks from albums" are the same set.

### "Most popular tracks" sorts on a field that is zero everywhere

Percy: *"perhaps this is where the station votes persist, maybe because it mentions Most
popular tracks"*. He is right, and it is worse than he put it.

"Most popular tracks" is the description under the **Best of {artist}** shelf, which is
ordered by `orderBy('playCount','desc')`. Measured: **playCount is 0 or absent on all 161**
eligible songs. The shelf asserts a ranking that does not exist — the order is whatever
Firestore returns.

That is exactly where a station signal would land. A save on the station is a *revealed*
preference (see the station-save section above), so it is a better popularity input than
a play count would be, and it is the one signal BFMG could actually have. **Not built** —
it needs the station emitting the signal and a decision on weighting first. Recorded so
the connection is not lost: the shelf is already there, already labelled, and already
sorting on nothing.

### Chart eligibility: what it would actually take — 2026-10-12

Percy asked to be clearly informed before deciding what to do about the 27 sellable tracks
with no ISRC or UPC. Researched against Luminate's own knowledge base, plus press
reporting for the 2025 D2C changes. **Confidence is flagged per item; some of this is
reported rather than published.**

#### Selling is not reporting

The thing that actually surprised: **a store does not report to Luminate by existing.** It
has to be an approved reporter, and the bar is operational rather than technical
(Luminate, *Become a Data Provider* — authoritative):

- eligible sellers are "retailers approved by Luminate"; you apply, Partnerships confirms
  eligibility, and you sign a sales provider agreement
- **four weeks of consecutive test data** before you are live, reported **daily**
- reporting is daily by **1:00 PM EST**, on a Tuesday–Monday tracking week
- lapse more than four weeks without notice and you go inactive and repeat the trial
- **"must report daily on multiple artists"** — stated plainly, and BFMG is effectively one
  artist. This reads as a structural barrier, not a hurdle
- no fee and no volume threshold stated

#### D2C is the most restricted channel there is

A direct-to-consumer store — "purchases made directly from artists and labels, not through
another retail entity" — is exactly what BFMG is, and it is the channel Billboard has spent
2025 tightening (reported via Chart Data and trade press; Billboard has not published all
of it, and dates conflict between sources):

- a digital album bought from an artist webstore counts **only once the buyer redeems it**,
  not when it is paid for
- **hCaptcha** required at purchase
- **$7.99 minimum** for D2C-exclusive digital albums
- only **four digital exclusive versions** per album, for its lifetime, deluxe included
- no mid-first-week drops; pre-order or wait
- three submissions of illegitimate data in 12 months → **minimum 90-day suspension**
- separately reported: D2C digital download singles **no longer count toward the Hot 100**
  at all

#### What this means for BFMG's numbers

| | BFMG today | Chart requirement |
|---|---|---|
| Track price | $1.99 | D2C digital singles reportedly excluded from Hot 100 entirely |
| Album floor | $4.99 | **$7.99** for a D2C-exclusive digital album |
| Identifiers | 27 tracks with no ISRC/UPC | both required before anything counts |
| Reporter status | none | application, agreement, 4-week daily trial, multiple artists |

The $4.99 floor already collided with the n × $1.99 album-unit rule
([[project-dsp-prd-chart-eligibility]]). It now also sits **$3.00 below** the D2C digital
album floor.

#### The conclusion worth acting on

**BFMG does not need to become a Luminate reporter. It needs its releases distributed.**

A distributor already reports to Luminate, so sales through DSPs and retailers count
without BFMG qualifying as anything. The three undistributed albums — From Pain to Light
(9), Eternal Flame (12), It's Christmas Time Again (6) — are the real blocker, and they are
27 of the 161 sellable tracks. The other 134 already carry ISRCs and UPCs because they went
through a distributor.

So the chart question is not "how do we report our own sales". It is "do we distribute
those three albums". Direct sales from beatflowmediagroup.com are a **margin** decision —
no distributor cut — not a chart strategy, and the two should not be confused.

**Not a compliance opinion.** Chart rules are Billboard's and change by announcement
rather than schedule; several items above are reported rather than published. Verify
against Billboard's chart rules and Luminate's chart-eligibility articles before acting,
and take advice on anything contractual.

### The live account's own settings cannot be set over the API — 2026-10-12

`scripts/stripe-business-profile.sh` is **deleted**. It asserted the account, applied
nothing, and printed a read-back showing everything still unset. Running the POST visibly
gives Stripe's reason:

> "You cannot use this method on your own account: you may only use it on connected
> accounts."

`POST /v1/accounts/{id}` is for **Connect connected accounts**. A platform's own account is
edited in the Dashboard and nowhere else. So that script could never have worked, and the
commit that added it was wrong to say Percy could just run it.

Replaced by `npm run verify:stripe-profile`, which reads the live account, reports what is
missing, and says where to set it. It does not pretend it can write.

Still missing on the live account as of today, all four:

| Setting | Suggested | Where |
|---|---|---|
| `statement_descriptor` | `BEATFLOWMEDIAGROUP` | Settings → Payments |
| `business_profile.url` | `https://beatflowmediagroup.com` | Settings → Business |
| `business_profile.support_email` | `support@beatflowmediagroup.com` | Settings → Business |
| `business_profile.support_url` | `https://beatflowmediagroup.com/support` | Settings → Business |

The descriptor is the one that costs money. It is the text on a cardholder's bank
statement, and an unrecognised charge is a leading cause of disputes — which cost the
amount plus the fee, and whose *rate* threatens the account itself.

**The general lesson, which is why this is written down:** a script that performs an action
must be watched performing it once. This one was committed on the strength of a read-back
that said "unset" for every field, and that read-back was reported as if it were the
before-state rather than the after-state.

### "License for $11.99" was selling a consumer download in licensing language — 2026-10-13

Percy, on a 19-track album priced at $11.99: *"how is the license price for this album
correct?"* Then, honestly: *"I still don't know what to do… I have not had any
transactional experience yet to make the correct determination."*

**The price is right. The word was wrong.**

`calculateAlbumPrice` is `clamp(tracks × $1.99, $4.99, $11.99)`. 19 × $1.99 = $37.81,
capped to $11.99. Measured across the catalogue, **14 of 15 albums hit the cap**, so it is
effectively a flat album price: a 9-track and a 19-track album both cost $11.99, and the
per-track rate runs $1.33 down to $0.63.

That is correct *for what is actually granted* — `scope: personal, term: perpetual,
grant: download`. A personal download license benchmarked against iTunes and Bandcamp,
both $9.99–$11.99 for an album, is market rate.

The label was not. **"License for $11.99" invites a licensing buyer to price it against
sync and library rates**, which are orders of magnitude higher, so a correctly-priced
consumer download read as an absurdly cheap commercial license. That is the same failure
already recorded beside `NOT_INCLUDED` in `DownloadLicenseTerms.js`: *the number does the
arguing instead of the terms*. It is also the likeliest reason ProductionHub made the
prices look low — those buyers were pricing a word that was not meant.

Changed to **`Buy · $11.99`**, and `License Options` → `Buying options`. Commercial
licensing on this platform lives in the subscription tiers and in sync enquiries, both of
which say so. Deliberately left alone: `CategoryNav`'s "License for your project" (the
Production Library — genuinely licensing), the sync line on `Album.js`, and the tier
feature copy.

**Why only the label changed, and nothing about the price.** There have been 22 lifetime
charges, all tests. A price moved now is a guess that teaches nothing — if sales stay at
zero there is no way to tell whether the price was wrong or nobody arrived. Removing the
ambiguity is the only change that pays before the first real sale, because it makes the
first sales *mean* something.

**What the first real transactions should answer**, recorded now so the question is ready:
do buyers arrive expecting a consumer download or a commercial license? If downloads sell
and subscriptions do not, this is a storefront. If the enquiries are all sync and
commercial use, the $1.99 download is a sample of the real business, not the business.

### Correction: it is a license, and the terms do not say it can be revoked — 2026-10-13

Percy: *"we are licensing the music to the personal buyer too, not selling it to them… if
we license it then we can revoke it if they step outside the terms of usage."*

He is right, and the previous entry's fix was wrong in the other direction. "Buy" promises
ownership the buyer does not get.

**Revocation is real, not aspirational.** `lib/entitlement.js` calls `isRevoked()` on every
delivery, refuses a revoked license, and deliberately distinguishes "revoked" from "never
bought" so the two can be answered differently. `scripts/revoke-license.js` performs it.
`download-master` therefore stops serving a revoked license. That is a genuine
differentiator: an iTunes download cannot be withdrawn, and a CD certainly cannot.

Label is now **`Personal license · $11.99`**. The missing word was always the SCOPE, never
the license — a bare "License for $11.99" let a sync buyer price it against library rates,
while "Buy" denied the model outright. Naming the scope fixes the anchoring without
pretending anything is sold.

#### The exposure, which is the part that matters

**Nothing tells the buyer the license can be revoked.** Measured: zero mentions of
revoke/revocation in `DownloadLicenseTerms.js` and zero in `Terms.js`. Worse, the clickwrap
says the opposite:

> "A personal license to download and keep this recording. **It does not expire.**"

So the product is a revocable license, the buyer is asked to tick a box saying they have
read terms that do not mention revocation, and the summary they are shown promises they
can *keep* it and that it *does not expire*. If a license is ever revoked, the buyer can
point at the sentence they accepted.

"Does not expire" and "may be revoked for breach" are not actually contradictory — a
perpetual license can still terminate on breach, which is ordinary in licensing. But the
terms have to SAY so, and these do not.

**Not fixed here, and deliberately.** Adding a termination clause is drafting, not
labelling: it decides what counts as breach, what notice is given, and whether anything is
refunded. That wants a lawyer for the jurisdiction, and it is the single highest-value
thing to get reviewed, because the whole revocation model rests on it. What this project
can do is describe real behaviour accurately; it cannot decide the clause.

### Subscriptions as terminable licenses, and the ISRC on the license — 2026-10-14

Percy: *"this is where in my mind the subscription(s) and the ISRC kick-in"* — as the
answer to a perpetual license that can be revoked but whose terms never say so.

The instinct is right and the design already existed. **A subscription license terminates
by structure**: stop paying and it ends, so the awkward "we may revoke your perpetual
license" clause is never needed for commercial use. It was only half-wired.

**What was missing: cancellation never ended anything.** All four tiers are declared
`licenseType: TIME_BOUND`, renewal re-activated licenses (ported earlier), but
`handleSubscriptionCancelled` only set the user's membership flag. License rows stayed
`active` for ever — the money stopped and the license did not. The logic existed in
`stripe-webhook.js`, which Stripe does not call. The same gap, in the same place, as the
license recording.

Ported. Time-bound licenses for that subscription become **`published-only`**, not
revoked — the design is deliberate and worth keeping: *work already published keeps its
license; what ends is the right to use the track in anything new.* Pulling a license out
from under published work would make the product unusable for the professionals it is
sold to. Perpetual one-off licenses are excluded from the query because they are not
contingent on any subscription.

**ISRC is now written on the license row.** `trackId` is a Firestore document id — it
identifies a recording inside this database and nowhere else, and enforcement runs the
other way: a recording turns up where it should not, and the question is which license
covers it. ISRC is the only identifier here assigned by a standards body, so it is the one
that survives leaving the platform. Written as explicit `null` when absent, because
Firestore drops a document from any query naming a field it lacks — an omitted ISRC would
hide exactly the licenses worth finding.

#### Verified, both of them

Cancellation was tested with a signed `customer.subscription.deleted` carrying a
subscription id we control. `stripe trigger` cannot be used: it invents its own id and the
handler looks the user up **by** that id, so a triggered event can never match a fixture.
The test plants a time-bound **and** a perpetual license for the same user and only passes
if the first ends and the second survives:

```
time-bound license : published-only, validWhileSubscribed false
perpetual license  : still active          <- the one that must not break
user membership    : false
```

ISRC was verified through a real test-mode purchase of a distributed track:
`license.isrc = QZRP42560757`, matching the song. Test data removed; purchases and
licenses back to 2 and 2.

#### Still open, and it is the one that matters

The terms still do not mention termination. For subscriptions this is now easy to write —
"your license runs while your subscription does" is ordinary and uncontroversial. For the
perpetual one-off license it is still a drafting question about breach, notice and refunds,
and still wants a lawyer.

#### Running the local stack, since this cost three restarts

`netlify dev` OWNS CRA. Pre-start CRA and it dies with *"Something is already running on
port 3006"*; let it start CRA and it dies with *"Timed out waiting for port 3006"*, because
CRA takes 2–4 minutes here and Netlify's wait is shorter. For testing functions, neither is
needed: **`npx netlify functions:serve --port 8888`** serves them over http, starts in
seconds, and has been reliable every time. Use `netlify dev --offline` only when the React
app is actually needed, and kill every BeatFlow node process first.

### The download was blocked by CSP in the browser — 2026-10-15

Percy, from the production console on `/downloads`:

```
Refused to connect to 'https://…r2.cloudflarestorage.com/beatflow-masters/…'
because it violates the document's Content Security Policy.
Download error: TypeError: Failed to fetch.
```

**`connect-src` never listed Cloudflare R2.** `downloadFileAsBlob` fetches the presigned
URL as a blob so the file downloads rather than opening in a tab, and a blob fetch is
`connect-src` — so the browser refused it outright. The buyer paid and got "Failed to
fetch". Added `https://*.r2.cloudflarestorage.com` to all three copies; `verify:csp`
reconciles.

Wildcarded rather than pinned to the account host on purpose: the hostname is not the
security boundary, the short-lived SigV4 signature is. Pinning would put the account id in
the repo and break silently if the bucket moved.

#### Why nothing caught it, which is the part worth keeping

**Every test of the new download path ran in Node, and Node has no CSP.** The end-to-end
purchase test fetched the presigned URL and measured 7.70 MB of real mp3, so it proved the
URL returns the file — and said nothing about whether the *page* may fetch it. A presigned
URL is useless if the document cannot connect to it.

That is a whole class of bug a Node harness cannot see: CSP, CORS, mixed content, cookie
and storage policy. The lesson is not "test in a browser" as a slogan; it is that **a test
run outside the environment the code runs in cannot answer questions about that
environment**, and I reported the feature working on exactly that evidence.

`verify:csp` now also checks the policy against the hosts the app is **configured** to use,
which is the one thing a Node script can usefully assert about a browser rule. It reads
`R2_MASTERS_ENDPOINT` from `.env` and fails if no `connect-src` entry permits that
hostname. Copy-drift was only ever half the problem — this time all three copies agreed
perfectly and the request was still blocked.

Proven by planting the failure: with the R2 entry removed, `verify:csp` exits 1 and names
the host; restored, it exits 0 and prints
`connect-src permits 209a85bc…r2.cloudflarestorage.com (R2_MASTERS_ENDPOINT)`.

### CSP was only the first of two: R2 has no CORS policy — 2026-10-15

After the CSP fix deployed, a browser check against production showed the R2 fetch
**still failing** — and this time **no CSP violation was raised**. The control request to
a disallowed host was still refused, so the policy was working; something else was
blocking it.

```
GET presigned URL with Origin: https://beatflowmediagroup.com
  -> HTTP 206
  access-control-allow-origin : ABSENT
```

**The bucket has no CORS policy.** R2 serves the bytes and the browser refuses to let the
page read them, surfacing as a bare `TypeError: Failed to fetch`. Two different failures,
identical symptom, and the first fix revealed the second rather than resolving it.

#### The single-track path never needed the fetch

`downloadFileAsBlob` existed to "force download instead of opening in browser" — but
`download-master` already does that server-side: the presigned URL carries
`response-content-disposition: attachment; filename="…"`. A plain anchor navigation
honours it, downloads with the right filename, and **is not subject to CORS at all**,
because the page never reads the response.

So the single-track download now navigates (`downloadFile`), and works with no
infrastructure change. The album ZIP still fetches (`fetchFileAsBlob`) because JSZip must
hold each track's bytes — that one genuinely requires CORS.

**Album downloads remain broken until a CORS policy is set on `beatflow-masters`:**

```json
[ { "AllowedOrigins": ["https://beatflowmediagroup.com"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Disposition"],
    "MaxAgeSeconds": 3600 } ]
```

Cloudflare dashboard → R2 → `beatflow-masters` → Settings → CORS policy. Not done from
here: there is no AWS SDK in the project and hand-rolling a signed `PutBucketCors` is
error-prone for a one-off on live infrastructure.

#### The method lesson, continued

The previous entry recorded that a Node test cannot see CSP. This is the same lesson
charging twice: the browser check that found this one was written *because* of that
entry, and it immediately found a second browser-only failure the Node tests had also
missed. One round of "test it where it runs" was not enough — there were two layers.

## Friendly fraud — when the money goes back, the license goes with it — 2026-10-15

**The attack.** Pay $1.99, download the master, have the bank reverse the charge, keep the
file. The purchase row stayed `status: 'completed'` forever, so the entitlement check kept
saying yes and `/downloads` kept serving the master to someone who had paid nothing.
Repeat per track. The name for this is **friendly fraud**: a real customer using a real
payment mechanism in bad faith. It is the main fraud vector for digital goods because
delivery is irreversible and payment is not.

**The money, which is what sets the priority.** A refund costs the Stripe fee, about
$0.36 on a $1.99 sale. A chargeback costs the sale plus a ~$15 dispute fee — roughly 30x
the $0.49 platform share, so one chargeback erases the platform margin on about thirty
tracks. That asymmetry is why the dispute branch does more work than the refund branch:
it revokes AND snapshots evidence, because a dispute answered with nothing is lost by
default, and losing by default costs the same as losing on the merits.

**What was already here, and what was actually missing.** Nearly all of it existed.
`src/utils/licenseRevocation.js` already defined CHARGEBACK and REFUND as reasons and
documented the four independent states of paid/refunded x licensed/revoked.
`lib/entitlement.js` already refused a revoked purchase — deliberately BEFORE the
subscription fallback, so an active subscription cannot hand back what was just withdrawn.
Only the WRITER was missing: nothing but the manual `scripts/revoke-license.js` CLI ever
set the flag. So this is not new policy. It is the automatic trigger for policy that was
already written and already enforced, which is why it was a small change.

- `netlify/functions/lib/payment-reversal.js` — `revokeForPaymentReversal()`, plus
  `shouldRevokeOnRefund()` and `assertReversalJoinable()`.
- `netlify/functions/lib/dispute-evidence.js` — builds and snapshots the bundle.
- `webhook.js` — `charge.refunded` and `charge.dispute.created` wired into the live switch.

**Deliberate non-revocations.** `charge.refunded` fires on partial refunds too, and giving
back $2 of a $12 album is a price adjustment, not fraud — revoking there punishes a
customer being made whole. A refund tagged `keep_license=true` in its metadata also does
not revoke; that is the "refunded + licensed" state `licenseRevocation.js` already
documented, and `/terms` promises a full refund where WE failed to deliver.

**Escalation is one-way.** A refund that later becomes a chargeback is re-stamped as a
chargeback, because that is the more serious fact. A chargeback is never downgraded to a
refund. Redelivery of the same event is a no-op rather than a re-stamp: moving
`licenseRevokedAt` forward on every retry would destroy the one timestamp a dispute turns
on.

**Payment status is left alone, on purpose.** `status` describes MONEY; revocation
describes the LICENSE. `entitlement.js` tests for exactly `'completed'`, so overloading
`status` would silently break every other purchase path. Asserted in the tests.

**Evidence is a snapshot, not a view.** Written to `disputes/<disputeId>` when the dispute
opens, shaped to Stripe's own `dispute.evidence` field names so it submits without
translation. Evidence assembled later from live collections is evidence that changes after
the fact, which is the one thing a disputed record must not do. It does NOT auto-submit:
submitting closes the response window, and a bundle with no delivery proof is better
withheld — `diagnostics.missing` says which case you are in.

**Both branches rethrow so Stripe retries.** A 200 tells Stripe the job is done. A refund
that failed to revoke and returned 200 leaves the buyer holding a license they were
refunded for, permanently and silently.

### Download cap, and the measurement that changed it

`MASTER_DOWNLOAD_CAP` (default 5) per buyer per track, in `download-master.js`. Without
one, the entitlement check says yes every time, so one account is a distribution channel.

**Counted from a start date, not for all time — found by measuring before shipping.** Three
of eleven (buyer, track) pairs in `downloads` were ALREADY at or above 5, one at 15, almost
entirely from testing this platform. An all-time cap would have locked Percy out of the
track he had just bought, on the first deploy, and the first symptom would have been a
support message rather than a log line. `MASTER_DOWNLOAD_CAP_FROM` defaults to the day
after this was written; **set it to the deploy date.** A cap that starts before it ships
punishes the test run.

Counted in memory after an equality-only query rather than with
`where('downloadedAt','>=',...)`: equality + range needs a composite index, and Firestore
FAILS a query with a missing index rather than degrading, so that version would turn every
download into a 500 until someone noticed. Row counts per pair are tiny; nothing to
optimize. The count also **fails open** — a counting error must not withhold a file someone
bought.

### Provenance on the download log

`ipAddress` and `userAgent` on every `downloads` row, read from Netlify's
`x-nf-client-connection-ip` first because `x-forwarded-for` can be client-supplied. This is
dispute evidence, not analytics: Stripe's evidence form has a field for exactly it.
Legitimate because `src/pages/PrivacyPolicy.js` already discloses log data including IP and
browser.

### The silent failure to watch

The whole path joins on `purchases.stripePaymentIntent`. **Firestore excludes a document
from any query naming a field it lacks**, so a purchase written without that field cannot
be found by a refund or chargeback and keeps its license forever with nothing logged.
`assertReversalJoinable()` exists to make that visible, and a test asserts the hazard so it
cannot be mistaken for working. All 3 current purchases carry the field.

### Tests

`netlify/functions/lib/payment-reversal.test.js` — 16 assertions, in-memory Firestore fake.
A fake rather than the real database for one reason that matters more than speed: these
assertions revoke licenses, and a test that writes to production to prove it can revoke
things can revoke a real buyer's license when run on the wrong day. The fake reproduces the
field-absence rule above; a fake that returned every document on any `where` would pass a
test the real database fails.

Verified by planting bugs: breaking idempotency failed 2 assertions, overloading the payment
status failed 1. This codebase has had three tests that passed because they were wrong, so
a test is not trusted here until it has been seen to fail.

### Still open

- `/terms` terminates a license on breach of a **usage** restriction, so a refund or
  chargeback does not trip it. One sentence is needed. **Lawyer item** — statutory refund
  rights vary and some cannot be waived.
- Stripe Dashboard: `statement_descriptor`, business URL and support email are unset. A
  blank statement descriptor is itself a chargeback *cause* — buyers dispute charges they
  do not recognise.
- No per-buyer watermark, so a leaked file is traceable to the recording (via ISRC) but not
  to the person. Blocked on runtime, not tooling — see below.

### Streaming — measured 2026-10-15, before any work

Verified rather than assumed, because the question "can we stream instead of download" turns
on it. Every commercial-release track streams a **30-second preview, 0.46 MB, publicly
fetchable with no login** (8 of 8 sampled; `audioUrl` in the client-readable song doc). The
master is properly protected: **10.49 MB** behind a presigned URL, 23x larger, purchase only.

So the paywall holds, and the gap is the missing middle: **full-length streaming does not
exist.** Which means there is nothing yet to sell as "streaming access" — a subscriber would
pay for what a stranger already gets free. That is the gate for playlists and personalisation,
since a playlist of 30-second previews is not a product.

Two constraints recorded for whoever builds it:

- **Per-user signed URLs defeat CDN caching.** A unique URL per request cannot be edge-cached,
  so every play hits origin. The fix is to validate the token at the edge (a Cloudflare Worker
  in front of R2) and serve one cached object to everyone. R2 is right for this specifically
  because egress is free.
- **A watermark cannot live in a Netlify Function.** Today the bytes never touch our server —
  a presigned URL goes R2 to browser directly. Routing them through code to stamp them is
  impossible on Netlify Functions, which cap a response at 6 MB against a 10.49 MB master.
  The same edge Worker is the only place both jobs fit.

### Trend declined

No DRM, and the reason is arithmetic rather than taste: a Widevine/FairPlay license server is
roughly $200-1,000+/month and the platform has 3 purchases. Paying a four-figure annual fee to
protect revenue that has not started is the O caveat — optimize where instrumented. Revisit when
subscription volume justifies it. What protects the master meanwhile is **quality tiering**,
which already exists: a captured 128 kbps stream is not a licensable master, at 1/23rd the data
and with no ISRC metadata.

## Concepts covered

- **Friendly fraud** — surfaced when Percy asked what stops a buyer downloading then
  refunding. Call: build the automatic revocation path; accept that the bytes cannot be
  recovered and that the defence is the legal clause plus dispute evidence.
- **Chargeback vs refund economics** — a ~$15 dispute fee against a $0.49 platform share is
  the margin on ~30 tracks. Call: prioritise preventing disputes and winning them over
  policing refunds.
- **Tethered offline playback** — Percy asked whether offline access could replace downloads.
  Call: it solves revocation for listening and cannot solve it for licensing, because a
  usable file is the deliverable; parked on license-server cost.
- **Quality tiering** — named when Percy asked about stream-only access. Call: the protection
  is that a captured stream is not a licensable master, not that capture is prevented.
- **Forensic watermarking** — surfaced when Percy asked about embedding our own DRM. Call:
  DRM on a handed-over file is not possible; attribution is, and the cheap tier (metadata
  stamping) is worth doing before the real one.
- **Minor units** — prices are stored in cents (`199` = $1.99), caught when generating the
  station list where rendering raw would have shown $199. Call: expose both `priceCents` and
  `priceDisplay` across any boundary.

## Redirects live in TWO files, and `_redirects` wins — 2026-10-15

**A landmine, found the expensive way.** `/r/<ISRC>` shipped in 61fbe49, deployed green,
and did nothing. Every request returned **200 with no Location header** while the function
itself was deployed and correct — calling
`/.netlify/functions/redirect-isrc/QZMEQ2609274` directly returned the right 301 the whole
time.

`public/_redirects` carries its own copy of the function routes and ends with the SPA
catch-all `/*  /index.html  200`. It had no `/r/` rule, so the catch-all matched first and
served index.html. The rule added to `netlify.toml` was never reached.

**The rule to remember: a route added only to `netlify.toml` is dead.** Put it in
`public/_redirects`, above the catch-all, or it will look deployed and do nothing.

This is the same failure shape already recorded for the Content Security Policy: one
configuration living in two files, where a value present in one and missing from the other
produces a silent wrong answer instead of an error. The build was green, the function was
right, and the feature was dead. `verify:csp` exists because of the CSP version of this;
there is no equivalent reconciler for redirects yet, and that is the obvious next ratchet.

**It is also why "deployed" was not reported as "working".** The deploy went ready, the
unit tests passed, and the feature was broken. Production was the only thing that could
have said so.

## `/r/<ISRC>` — the license QR short links — 2026-10-15

`netlify/functions/redirect-isrc.js`. Backs the license QR codes beside the playing record
on the Roku and Fire TV apps.

**Why a redirect rather than a direct link.** The TV app regenerates the code on every
deploy, so it is less frozen than a printed sticker — but a viewer can photograph it, and
the photograph outlives the deploy, the app release, and any id we might change. That
residual permanence is the whole argument: the code encodes a URL we control and can
repoint forever.

The codes previously encoded `album/<firestoreDocId>` with UTM parameters baked in. Two
problems, and the second cannot be undone: a doc id is opaque and changes if a record is
re-imported, so a photographed link to a dead id is a URL nobody can fix; and the
attribution scheme was welded into an artefact that needs an app release to change. An
ISRC is permanent by definition and is already the station join key.

**Never 404s.** Not sellable falls back to the album; a withdrawn record goes album, then
artist, then catalogue; malformed input, unknown ISRCs and a bare `/r/` all go to
`/browse`. Every failure path — bad credentials, a lookup error, an unparseable segment —
lands somewhere real. Someone scanned this off a television; an error page is the one
outcome with no recovery.

**301 on a hit, 302 on every fallback, and the asymmetry is deliberate.** An ISRC to its
track page is a permanent mapping and the destination should accumulate the link signal
rather than the hop. "Not available right now" is temporary, and a cached-forever 301 would
strand an ISRC on the album page even after the record came back — so fallbacks are
`no-store`.

`?src=tv` expands to utm_source/medium/campaign **server-side**, so campaign naming can
change without touching a code already in the wild. The ISRC shape is validated before any
database read, so a scanner artefact or a crawler probing `/r/` cannot become a Firestore
query.

`Disallow: /r/` in robots.txt plus `X-Robots-Tag: noindex` on the response — it is a hop,
not content, and crawl budget spent following it is budget not spent on the pages it points
at.

**Verified twice, independently.** All 134 station ISRCs route to their own track page, 0
fall back. The station then checked production itself and confirmed 134 of 134 resolve to
the exact `/song/<id>` already recorded in its `releases.json`, which is a stronger result
than either check alone.

## The legal contact block — one component, no postal address — 2026-10-15

`src/components/LegalContact.js` replaces five copy-pasted blocks in Terms, PrivacyPolicy,
NoticeAtCollection, Legal and UserGuidelines. The copies had drifted exactly as copies do:

- Four pages said "BeatFlow Media Group"; NoticeAtCollection said **"BeatFlow Media Inc.",
  an entity that does not exist.** On a privacy notice the named entity is the data
  controller — the party legally answerable for the data — so naming a non-existent one
  means nobody is identified as answerable.
- It also listed "Phone: 1-800-BEATFLOW", which cannot be dialled: BEATFLOW is eight
  letters and a US number takes seven after the 800.
- The street was spelled "Cubhouse" on all five pages against "Clubhouse" in the email
  templates. Five copies of an address, none correct.

**The address is gone rather than corrected.** There is no brick-and-mortar location, and
what was published was a private residence. A home address on five public legal pages is
not a contact detail, it is a disclosure that cannot be withdrawn once crawled. Contact
runs through `/contact`, which is also the only channel producing a tracked record. When
there is a real business address, and when the company is incorporated, both go in
`LegalContact.js` once — `LEGAL_ENTITY` and the address — and all five pages follow.

**Deliberately NOT changed: the email footers in `functions/index.js`.** US commercial
email has a postal-address requirement that a website page does not, so removing it there
is a legal question, not a cleanup. Open, and it is a lawyer item.

Verified in the deployed JS bundles rather than the page HTML — these are client-rendered
routes, so fetching the HTML would have proved nothing. 0 occurrences of the address, the
entity name, or the phone number in main or any linked chunk.

## Open findings not yet acted on — 2026-10-15

- **The UI/UX pre-commit hook cannot fail.** Every commit prints `Checking N files`, then
  `Found 0 files to analyze`, then 100/100 across every category. It targets `src` but
  receives no file list. A gate that always passes is not a gate, and it produces three
  screens of green that mean nothing — the same empty-log trap that once had a build
  reported as passing from a log containing nothing.
- **`schemaMarkup.js:41` publishes `telephone: '+1-XXX-XXX-XXXX'`** to search engines.
  Placeholder data in structured markup is what the project SEO standard warns against:
  schema describes the page as it is, never as we wish it were.
- **A $29 purchase from 2026-03-09 is orphaned.** `qFSPQRRkgYnyaS4sAs7n` exists as neither
  song nor album, so `download-master.js` returns "Track not found" and that buyer cannot
  download what they paid for. $29 was the correct catalogue price at the time —
  `SONG_PRICE` was 2900 until Percy's own 2bdcb7d on 2026-09-18 — so this is a real sale,
  not a mispricing. Restore the record or refund.
- **Money is stored in two different units.** `songs.price` and `licenses.pricePaid` are
  CENTS; `purchases.price` is DOLLARS (`webhook.js` divides by 100). Three stores, two
  conventions, and nothing in the field names warns a reader. A reader assuming cents turns
  $1.99 into $199. Untouched deliberately: it is money data with historical rows.
- **`licenses.trackId` holds an ALBUM id for album purchases.** Not a broken record, but a
  field name that lies, and it made an album license look like an orphan during this audit.

## The pre-commit UI/UX hook was checking nothing — 2026-10-15

**Three bugs stacked, and the outcome was three screens of green per commit that read not
one line of code.**

1. **`.husky/pre-commit` wrote the staged file list to a temp file and never passed it to
   the CLI.** The temp file was created, written, and deleted unused. The CLI fell back to
   its default `--path src`.
2. **`gatherFiles()` built its glob pattern with `path.join()`**, which emits BACKSLASHES
   on Windows. glob v9+ reads a backslash as an escape character, not a separator, on every
   platform — so `C:\…\src/**/*.{js,jsx}` matched **0 files** where the forward-slash form
   matches **456**. Platform-specific: correct on Linux CI, broken on the only machine
   anyone actually commits from.
3. **`--exit-on-critical` was never passed and defaults to `false`.** Even a real critical
   finding would have exited 0, so the hook's own `if [ $UIUX_EXIT_CODE -ne 0 ]` could
   never fire.

Any one of these alone would have been visible. Together they produced a check that
reported `Composite Score: 100/100`, `Files Analyzed: 0` and exited 0, forever. It is the
same empty-log trap that once had a build reported as passing from a log containing
nothing: **a perfect score over zero inputs is not a pass, it is an absence.**

**Fixed:** basePath normalised to forward slashes once in `gatherFiles()`; a `--files`
option added to `agents/cli.js` and threaded into `analyzeDesignSystem()`; the hook now
passes the staged files and `--exit-on-critical`.

**Why staged files and not the whole tree.** With the glob fixed, a full `src` scan reports
2287 issues, so pointing the hook at everything would fail every commit on pre-existing
debt — and a hook that always fails is bypassed within a day, which is exactly how
`--no-verify` becomes the normal way to commit in a repo. The hook judges what is being
committed. Existing debt is a ratchet to work down, not a wall across every commit.

**Verified by planting a failure**, not by watching it pass: a component with an unlabelled
image, a click handler on a div, an 11px input and a 20px button exits **1**; the files in
this commit exit **0**. A gate is not trusted here until it has been seen to refuse
something.

### Baseline — the ratchet

Full `src` scan, 2026-10-15, immediately after the fix. **Never raise these to make a
build pass.**

| Measure | Baseline |
|---|---|
| Files analysed | 234 |
| Total issues | 2287 |
| Accessibility issues | 594 |
| Composite score | 0/100 |

The accessibility number is the one that matters against the project's mobile-first,
thumb-first standard: 44px targets, 16px inputs, no hover-only affordances. It was 594 the
whole time the hook was reporting 100/100.

## Best-effort legal protection, no lawyer available — 2026-10-15

Percy cannot afford counsel at this stage and asked for a researched best effort. What
follows is what the research changed, what was implemented, and — importantly — what is
still exposed. **None of this is legal advice and none of it certifies compliance.**

### The finding that reordered everything

The asked-for job was a Terms clause saying a refund or chargeback ends a license. The
research turned up something worth far more, and it was not in the Terms at all.

For digital content delivered as a download, **UK Consumer Contracts Regulations 2013
reg.37** and **EU Consumer Rights Directive art.16(m)** give a consumer 14 days to cancel,
and let a seller exclude that right **only** if the buyer both:

1. expressly consents to supply starting immediately, and
2. acknowledges that this loses the cancellation right,

before supply begins. Miss either and **reg.37(4) says the consumer bears no cost** for
digital content supplied in the cancellation window.

In plain terms: download the master, cancel inside 14 days, pay nothing, keep the file.
That is the friendly-fraud scenario the whole revocation effort was built to answer —
except this version is backed by statute, and **no amount of Terms drafting defeats it**.
The guidance is explicit that these obligations cannot be excluded by terms and conditions.
They have to be captured at the point of sale.

The checkout was capturing neither. The box said only "I have read and agree to the
Download License Terms", which is assent to the terms and is not either required element.

So the highest-value protection available was free, mechanical, and nothing to do with the
clause originally requested.

### What was implemented

- **`src/components/LicenseAcceptance.js`** — the clickwrap now carries both statutory
  elements as an explicit second statement: *"I ask for my download to be made available
  immediately, and I accept that once it is, I lose my right to cancel this purchase."*
- **`src/utils/agreements.js`** — `DOWNLOAD_LICENSE` version bumped `2026-09-19` →
  `2026-10-15`. The version MUST move when the accepted words change; the entire value of
  storing `download-license@<version>` against a purchase is being able to say which words
  a given buyer agreed to. Buyers before this date did not give the statutory
  acknowledgement, and their records must not be rewritten to pretend otherwise.
- **`src/pages/Terms.js`** — a "Termination when payment is reversed" clause, and a new
  "Cancellation Rights and Immediate Delivery" section disclosing the waiver up front,
  which the EU/UK guidance requires separately from capturing it.
- **`src/utils/licenseTerms.js` and `src/components/DownloadLicenseTerms.js`** — both said
  the license "does not expire" / is "kept for good". That became false on the day
  revocation shipped. The second of those sits *directly above the checkbox*, which makes
  it the exact wording produced in a dispute. Both now state the two ways a license ends.

### What the research says NOT to do

- **Never add a "no chargeback" clause.** A clause purporting to waive the cardholder's
  right to dispute is not enforceable — the Fair Credit Billing Act makes the issuer
  subject to claims and defenses arising from the transaction, and a merchant contract
  cannot remove a statutory right. Terminating the license is defensible; barring the
  dispute is not. The Terms now say explicitly that we do not ask buyers to give up that
  right, which is both honest and the stronger position.
- **Do not expect termination to reverse a chargeback.** Card network rules decide that,
  and a bank may approve a dispute where the terms did not match what the buyer reasonably
  expected. That is the practical argument for the clickwrap and the evidence bundle
  rather than for clever drafting.

### Still exposed — read this before assuming the matter is closed

- **Subscriptions are not covered by the waiver.** CJEU C-234/25 (2026) held that
  streaming subscriptions are digital *services*, not digital *content*, so art.16(m) does
  not apply and a subscriber keeps the cancellation right regardless of what they tick.
  The new Terms section says so. If subscription plans are sold into the EU/UK, that right
  is live and nothing here removes it.
- **US state disclosure rules are unverified.** No federal law compels refunds, and a
  no-refund policy is generally defensible for digital goods *if disclosed before
  purchase*, which the checkout now does. But several states (California Civil Code §1723
  is the usual starting point) have their own conspicuous-display requirements that were
  not checked against statute text.
- **The clause wording has not been reviewed by anyone qualified.** It was drafted to
  describe the software's real behaviour accurately, which is the part that can be
  verified. Whether it is enforceable in New Jersey, or survives contact with an EU
  consumer, is not something this process can answer.
- **`docs/terms-revocation-clause-draft.md`** holds the longer draft and five specific
  questions for whoever reviews this when that becomes affordable.

### Research sources

CJEU C-234/25 and art.16(m) conditions; UK CCR 2013 reg.37 and reg.37(4); Fair Credit
Billing Act limits on no-chargeback clauses; FTC position that no federal law mandates
refunds. Full URLs are in the session transcript.

## Catalogue feed — one origin for price and sellability — 2026-10-15

`netlify/functions/catalog-feed.js`, served at `/api/catalog.json`.

BeatFlow Radio needed `sellable` and `price` per recording and was holding its own copy,
which had drifted to 2900 cents — correct when `SONG_PRICE` was 2900, a 14x overcharge
after the move to $1.99. This is the origin that copy reconciles to.

**Every price crosses the boundary with its unit attached.** `priceCents` (integer,
authoritative), `priceDisplay` (formatted, for anything a human sees), and a top-level
`priceUnits: "minor"`. A consumer that renders `priceDisplay` cannot get it wrong. This is
not theoretical: the first draft of the station's interim file published `199` as a dollar
price and would have shown **$199 per track on a television**.

`sellable` is derived, never a stored flag taken on trust — it requires a positive price,
not-previewOnly, and a master key. A buyer who pays and cannot download is worse than a
record that was never listed.

The license block carries `version` and `identifier` so a consumer can detect that the
terms changed instead of hearing about it from a customer.

**A bug worth recording, found by testing rather than review:** the first run emitted
`identifier: "[object Object]@null"`. Two constants look like "the agreement" and are not:
`DOWNLOAD_LICENSE` is the key `'download-license'`, while
`DOWNLOAD_LICENSE_SUMMARY.agreement` is the licence *shape* `{scope, term, grant}`. And
`currentAgreementVersion()` returns the full identifier despite its name, not the bare
version — `CURRENT_VERSIONS` is what gives the date alone.

## verify:price-units — 2026-10-15

`npm run verify:price-units`. Read-only, safe against production.

Checks that `songs.price` and `licenses.pricePaid` hold positive integers (cents), reports
whole numbers ≥ 100 in `purchases.price` (dollars) as ambiguous rather than failing them,
and asserts the catalogue feed still carries explicit units.

A fractional value in a cents field undercharges 100x; an integer rendered as dollars
overcharges 100x. Neither throws, and **both look plausible while every price is $1.99** —
which is exactly why this needs a check rather than attention.

Current state: 906 songs, 3 licenses, 3 purchases — all consistent.

## Spelling: "license", not "licence" — 2026-10-15

Normalised across source, docs and CLAUDE.md. US spelling, and in US English "license" is
both the noun and the verb.

Settled by counting rather than preference: 9,533 occurrences of license/License against
102 of licence/Licence, user-facing Terms already at 33 to 2, and the Firestore fields are
`licenseId`, `licenseType`, `licenseRevoked` — data that cannot be renamed without
rewriting every stored document. The I-caveat decides it: a name matching the UI, the DB
column and how the team talks beats a more elegant one matching nothing.

Identifiers moved with the prose (`licenceKind` → `licenseKind`, `licencesEnded` →
`licensesEnded`), and all-caps constants needed a separate pass — a `licence`/`Licence`
replace silently misses `LICENCE_KINDS`.

**One mistake worth recording:** the first pass also rewrote two files inside
`functions/node_modules/bignumber.js`, where `LICENCE.md` is the dependency's own correct
British filename. Reverted. `node_modules` is gitignored so nothing would have been
committed, but a repo-wide replace should name its directories rather than trust a glob.

## What the double-check found — 2026-10-15

Percy asked whether the work had been double-checked. It had not been, fully, and the
check found four things. Recorded because "I verified it" is worth nothing without saying
what was verified and what was not.

**1. The version bump would have broken checkout for anyone with a cached page.**
`create-checkout.js` refuses a stale agreement with a 409. A returning visitor holding the
old bundle sends `download-license@2026-09-19`, gets refused, re-ticks the SAME stale
checkbox, and is refused again — a loop on the payment path with no exit the buyer could
guess at. Fixed in `stripeService.js`: a 409 carrying `currentAgreement` now refreshes the
service worker, clears its caches and reloads ONCE (one-shot flag, because a reload loop is
worse than the bug). The buyer returns on the current bundle and accepts the current text,
which is the point — silently accepting a stale version server-side would defeat the whole
reason the version is recorded.

**2. The service worker would not have fetched the new bundle.** A byte-identical
service-worker.js is never reinstalled, and it serves `/index.html` from cache. `CACHE_NAME`
bumped v7 → v8. Bump it whenever a change must reach returning visitors promptly rather
than eventually.

**3. Editing Terms.js overwrote text that is still in force for somebody.**
`npm run verify:terms` already said so in as many words — *"the old version must stay
readable, not be overwritten"* — and nothing implemented it. The superseded text is now at
`docs/terms-archive/download-license-2026-09-19.md`, with a table of what changed, and
`/terms` tells a buyer on an older version how to obtain the text they actually agreed to.

**4. `payment-reversal.js` revokes regardless of which terms version the buyer accepted.**
The reversal-termination clause exists only in `@2026-10-15`. A buyer on `@2026-09-19`
would have a license revoked under a clause they never agreed to. Both affected purchases
are Percy's own accounts, so there is no live exposure — but the mismatch is real and
should be settled before any third party is on a superseded version. Options when that
happens: gate the auto-revoke on the accepted version, or treat reversal as breach under
the older text, which is arguable rather than clear.

**`verify:terms` exiting non-zero is BY DESIGN, not a regression.** Its own comment says
every existing buyer lands in the superseded bucket the moment a new version publishes. It
is a notification gate, not a health check, and reading its exit code as a failure would be
a misreading.

### What was verified, and what was not

Verified: 47 assertions across three suites; production build exit 0 with zero compile
failures; `verify:csp` and `verify:price-units` pass; the a11y detector tested against four
labelling patterns; the catalogue feed exercised against real Firestore; `/r/` exercised in
production against all 134 station ISRCs.

**Not verified: anything rendered in a browser.** The clickwrap wording, the new Terms
sections and the 409 recovery path have been type-checked and built, not *seen*. The build
proves the JSX compiles, not that the checkbox is still tappable at 44px or that the
recovery reload behaves on a real stale cache. That gap is the same shape as the CSP bug —
tests that ran in Node proved the URL worked and never that the page could fetch it.

## The click-through, and the test infrastructure that did not exist — 2026-10-15

Asked to verify the legal changes in a browser rather than by compiling them. Doing so
turned up that **no component in `src/` had ever been unit-tested**, and the reason was
quiet: `jest.config.js` was EMPTY, so jest had no JSX transform. Every existing suite
(agreements, require-auth, payment-reversal) is plain CommonJS with no JSX, so nothing
ever hit the gap.

Three obstacles, each of which pointed somewhere other than its cause:

1. **No JSX transform.** Configured in `jest.config.js` rather than by filling in the
   equally-empty `babel.config.js` — CRA supplies its own Babel config for the production
   build and can pick up a root one, and changing how the shipped bundle compiles in order
   to run a test is a trade nobody should make.

2. **`react-router-dom`'s exports resolved to `undefined`.** jest's jsdom environment
   resolves package `exports` under the BROWSER condition, which for v7 selects an ESM
   build that node_modules transforms do not touch. Fixed with
   `customExportConditions: ['node']`. The tell was that the same `require()` works in
   plain node.

3. **A manual mock nobody remembered.** `src/__mocks__/react-router-dom.js` is applied
   AUTOMATICALLY with no `jest.mock()` call anywhere, and exported only BrowserRouter,
   Routes and Route. Anything importing `Link` got `undefined`, and React reports that as
   *"Element type is invalid ... got: undefined"* — a message that points at the component
   under test, not at the mock. Extended to a superset of what components import, with
   `Link` as a real `<a>` so a test asserting that clicking it does NOT toggle the
   wrapping checkbox is not vacuous.

### What the click-through actually proved

- **`LicenseAcceptance.test.js`** — 9 assertions, rendered through the real component
  tree. Both statutory elements reach the DOM, inside the label the checkbox governs;
  unchecked by default; the label toggles it; the terms link does not. A grep proves words
  exist in a file, a render proves they reach the buyer.
- **`e2e/terms-render.spec.js`** — 9 assertions in Chrome against the built `build/`
  artefact, which is what deploys. Every new clause renders, no postal address survives,
  the contact link is a real 44px target, and the page does not scroll sideways at 390px.
  This exists because of the CSP failure: node tests proved the R2 URL returned the file
  and never that the PAGE could fetch it, and a buyer paid before anyone noticed.
- **`stripeService.checkoutError.test.js`** — 8 assertions on the 409 recovery, including
  that it reloads exactly ONCE, clears the service worker caches, and degrades to a
  readable message when sessionStorage is blocked.

Each suite was then verified by planting a failure rather than by watching it pass:
removing the statutory acknowledgement fails 3 of 9; removing the one-shot reload guard
fails 3 of 8.

### Ratchet

| Measure | Value |
|---|---|
| jest assertions (4 suites) | 48 |
| node assertions (payment-reversal) | 16 |
| Playwright assertions (terms render) | 9 |
| Component suites in `src/` before today | 0 |

**Still not covered:** the purchase dialog itself, because reaching it needs a signed-in
Firebase session and no browser-auth fixture exists. The clickwrap is covered as a
component and the 409 branch as a unit; the two have not been exercised together through a
real checkout. That is the honest remaining gap.

## /changes — what changed, for the person it changed for — 2026-10-16

Percy asked whether the update modal should link to an explanation of what changed. It
should, but narrower than "updates", and the distinction is the whole design.

**Two different jobs, and conflating them means both get ignored.** The update modal
fires on EVERY deploy and its job is getting new code onto the device — worth a prompt
whether or not there is a story. The LINK is for the rare change that alters what someone
actually gets. If it appeared every time it would usually lead to "fixed a redirect rule",
and a link that is usually worthless is a link nobody clicks on the one occasion it
matters.

### Derived, not authored

The entries that carry legal weight generate themselves from `AGREEMENT_HISTORY`; the
nice-to-have ones are hand-written and degrade to silence rather than to a stale list. An
authored changelog rots — the first forgotten entry makes the page untrustworthy, and an
untrustworthy page is worse than none because people stop reading it.

`CURRENT_VERSIONS` is now **derived** from `AGREEMENT_HISTORY[agreement][0].version`. A
new license version cannot be published without also recording what it says and what
changed, because publishing the entry IS what moves the current version. A hand-kept
"current" beside a hand-kept history is two sources of truth and they drift on the first
busy day.

### The gap this closes

`/terms` promises the version recorded against a purchase governs it. That is only
keepable while the superseded TEXT is readable somewhere, and it was not: editing Terms.js
on 2026-10-15 overwrote wording still in force for two purchases, and `verify:terms` had
been printing *"the old version must stay readable, not be overwritten"* the whole time
with nothing enforcing it. `/changes` now renders every version with its summary as it
stood, and `verify:terms` fails if any version a real buyer accepted is missing from the
history — verified by removing the 2026-09-19 entry and watching it report
`UNREADABLE: 1`.

Superseded versions are labelled **"Still applies to earlier purchases"**, never "old".
A superseded version is not void; it still governs everyone who accepted it, and calling
it old tells exactly the wrong story to the person it binds.

### Seen-state fails in the safe direction

Marked when the reader OPENS `/changes`, not when they dismiss the prompt — closing a
modal is not reading, and treating it as read would silently consume the one notice a
license change gets. Blocked `localStorage` reads as "not seen", so the link still shows:
showing it to someone who has read it is a mild annoyance, hiding a license change from
someone who has not is the outcome the page exists to prevent.

## A build can exit 0 and produce nothing — 2026-10-16

**The third variation of the same mistake, and the most expensive to date.**

`npm run build` exited 0. My check for `"Failed to compile"` found none. I reported a
passing build and ran a browser suite against it — and all 19 tests failed, including 9
that had passed an hour earlier. The build had written **no `index.html` at all**; the
server was handing out leftovers from a previous build.

CRA had said so, quietly:

    Compiled with the following type errors (you may want to check these before deploying)
    Attempted import error: 'hasUnseenChanges' is not exported from '../data/platformChanges'

An unresolvable import is reported as a **type error**, not as a compile failure, and the
process still exits 0.

The cause was CJS/ESM interop: `platformChanges.js` was CommonJS, and webpack could not
statically resolve named imports out of its `module.exports = {...}`. `require()` of the
same file worked perfectly in node, which is what made it confusing — the module tests
passed while the bundle could not import it. Converted to ESM, which is what the rest of
`src/` uses.

**`npm run verify:build` now asserts the ARTEFACT rather than the exit code:** index.html
exists, is not stale, names a main bundle, and that bundle is on disk and a plausible
size. Verified against the broken output before fixing it.

The pattern across all three incidents is identical — **a green signal measured on the
wrong thing**: a build called passing from an empty log, a UI gate scoring 100/100 over
zero files, and now a build that compiled nothing and exited 0. The fix is the same every
time: assert the artefact, never the exit code.

### Ratchet

| Measure | Value |
|---|---|
| jest assertions | 68 |
| node assertions | 16 |
| Playwright assertions | 19 |
| Reconcilers | csp, price-units, terms, published, build |

## Licence certificates and /verify — 2026-10-16

Percy asked for viewable, downloadable certificates with authenticity at zero cost. The
premise was sound and worse than it looked: `Downloads.js` line 380 had been saying
"Download your licensed music and view license certificates" with no certificate behind
the sentence.

### The shape, and why it is asymmetric

**Public to CHECK, private to ISSUE.** `/verify/<LIC-id>` is public because a venue has to
be able to check a certificate without an account — that is the entire point of it — so
the buyer appears masked ("P. R." or "s•••@example.com"), enough to match the person
presenting the document and not personal data. Issuing the PDF is authenticated and
ownership-checked: an authenticated caller asking for another buyer's certificate gets a
403, which is the IDOR this would otherwise be.

### What the code proves, and what it does not

An HMAC keyed with a server-only secret proves BFMG issued the document — **only to
someone who checks it against our domain.** A forged PDF can print any code it likes; what
it cannot produce is a verify page on beatflowmediagroup.com agreeing with it. So the
anchor is the domain, not the document, and every certificate says so in those words. A
buyer showing a PDF to a venue is relying on that venue following the link.

It is not a PKI signature and no reader shows a green tick. The layout leaves room for a
paid AATL signature later.

### Decisions worth keeping

- **`v1|` prefixes the HMAC input**, at the station's suggestion. Codes are printed on
  documents that leave our control and may be checked years later; without a version, any
  change to the hashed fields would silently invalidate every code in circulation, and the
  symptom would be genuine certificates failing with no explanation.
- **Absent fields hash as fixed literals** (`no-isrc`, `no-agreement`, `no-date`) rather
  than being refused. Only ONE of four existing licences had every field: two predate the
  clickwrap entirely and one predates the ISRC deploy by nine minutes. The alternative —
  backfilling an agreement version onto a purchase that never accepted one — would destroy
  the only thing that field is for. The certificate states what is not on record instead
  of implying a completeness it never had.
- **The certificate quotes the version the buyer accepted**, pulled from
  `AGREEMENT_HISTORY`, not today's wording. A 2026-09-19 licence shows the 2026-09-19 text.
- **Seconds-precision UTC timestamps.** A Firestore Timestamp does not stringify stably;
  millisecond drift between issuing and verifying would break genuine codes invisibly.
- **Base32 without I, L, O or U**, so a code read off paper cannot be mistyped into another
  valid-looking one. 10 characters is 50 bits.
- **A missing `LICENSE_CERT_SECRET` refuses rather than defaulting.** A predictable key
  would make every code forgeable while everything still appeared to work, which is worse
  than an outage.
- **Hidden watermark is TRACING, not proof.** An invisible text layer and XMP metadata are
  both trivially readable and trivially strippable. It catches casual redistribution and
  nothing else. Document metadata is document-level, so a multi-licence statement
  accumulates every trace rather than keeping only the last.

### setupProxy, wrong for the second time, now derived

Adding `/verify/*` to `_redirects` and `netlify.toml` was not enough: the function answered
correctly on 8888 while the app on 3006 served the SPA shell, because `setupProxy.js` held
a hardcoded list `['/.netlify', '/api']`. Production was fine throughout — **the bug
existed only on the machine you develop on.**

Then forwarding the prefix alone still failed with "Function not found", because production
REWRITES `/verify/LIC-x` to `/.netlify/functions/verify-license/LIC-x`, and the proxy was
passing the path through unchanged.

Both the port and the full routing table are now READ from `netlify.toml` and
`public/_redirects` rather than copied. Adding a function route to `_redirects` now makes
dev follow automatically. That is the third copy this file has been wrong about — port,
prefixes, rewrites — and the first time it holds none.

### A false alarm worth recording

The browser check flagged "leaks real name" on the verify page. It did not: the name was
the ARTIST credit, which is public and deliberately shown, and the buyer was correctly
masked to `p•••@gmail.com` throughout. The test searched the whole page for a string that
happens to be both the artist and the buyer. Reading the definition list as label/value
pairs rather than grepping the page settled it. A test that cannot tell which FIELD holds
a value will keep producing alarms like this.

### Ratchet

| Measure | Value |
|---|---|
| node assertions (certificate) | 17 |
| node assertions (payment-reversal) | 16 |
| jest assertions | 68 |
| Playwright assertions | 19 |

## Selling the production library — a third licence — 2026-10-17

The commercial price curve existed (88f0d52) with nothing wired to checkout. Wiring it
turned out to be mostly a legal problem.

### Neither existing licence fitted, so quietly reusing one was the trap

| Licence | Why it could not be used for a $319 collection |
|---|---|
| `download-license@2026-10-15` | **Expressly forbids synchronisation.** Recording it against a commercial sale produces evidence the buyer agreed *not* to do the thing they paid for. |
| `sync-license@2026-10-16` | Worded throughout as "while your subscription is active". Against a one-off sale it describes a grant that ends, when what was sold does not. |

`commercial-license@2026-10-17` is published: **commercial / perpetual / sync**. One
payment, no renewal, worldwide, non-exclusive, covering the recordings named on the
licence rather than the catalogue. Terms section 4 defines it in full and the page now
carries **both** version identifiers — it carried one above a document containing two
separately versioned licences, which reads as governing both.

It also said sync was "not available through self-service checkout". This change makes
that false, so the line was corrected rather than left to rot.

**NOT REVIEWED BY A LAWYER.** `docs/commercial-license-draft.md` carries the long text
and seven questions. The two sharpest: whether "permanent" needs qualifying everywhere
it appears given a payment reversal ends the licence, and whether permitting client
delivery *without* licensing the end client holds up.

### The acceptance gate was asking the wrong question

```js
if (!isCurrentAgreementVersion(acceptedAgreement))   // "is this SOME current agreement"
```

With one product that was the same question. With two it is a hole, and **the wrong half
passes**: a client could present `download-license@…` for a commercial collection and be
waved through. The server now derives the product from `(itemType, licenseType)` and
demands *that* product's identifier, so a **valid acceptance of the wrong agreement** is
refused — the case the old check could not see.

An agreement with no published text now returns **503** rather than selling. That is
what makes the `contributor-upload` gap safe to leave open: it cannot be sold under by
accident, only deliberately.

### Both webhooks were recording the wrong licence

`licenseFields(ONE_OFF_DOWNLOAD)` was unconditional in `webhook.js` (1 site) and
`stripe-webhook.js` (2 sites). A commercial sale recorded that way writes
`scope: personal, grant: download` on the row that **is** the evidence. The axes now
travel in the session metadata and come back through `productFromMetadata`.

**A test caught a hole in the fallback.** Validating the three axes was not enough —
`broadcast` is a legitimate member of `LICENSE_GRANT`, so `{commercial, perpetual,
broadcast}` passed every axis check and returned as a product. Nothing sells a broadcast
licence self-serve; the webhook would have written the most expensive right in the
catalogue onto a licence row. **Axis-valid is a spelling check; being a product is a
different question**, and only `PRODUCT_AGREEMENTS` answers it now.

### Entitlement had no collection branch, so the biggest buyer was the one refused

`resolveMasterEntitlement` checked the track, then its album, then a subscription. A
collection licence matched none. The person who paid $319 for 56 tracks could not
download track 41 — and **every individual query in that function is correct**, which is
why it survives review. Joined on `collectionId` exactly the way the storefront joins it.
Revocation cascades through it, or a buyer whose licence was pulled downloads the
contents one track at a time.

### Priced from what will be delivered, not from a stored count

`collections.trackCount` is a derived copy an importer writes and it is **already wrong**:
`verify:collections` reports `game-show-walk-on` holding 27 while 30 songs carry its id.
`assertDeliverable` already runs that query, so it returns the count and the price comes
from it — $219 rather than $209.

The **page** had the mirror of the same problem, which would have advertised $209 while
Stripe billed $219. `CollectionPage` now counts the tracks `HomeStorefront` has already
loaded and filtered (same test the server applies), and the button says
"Counting tracks…" until that lands rather than quoting a figure that moves.

**The backfill that would repair the stored count was refused by the sandbox and has not
run.** Not load-bearing — the server never trusts the field — but `verify:collections`
will keep reporting it until someone runs `npm run backfill:collections -- --apply`.

### `npx jest` now finishes, for the first time

Three files in `netlify/functions/lib` are standalone node scripts ending in
`process.exit()`. Under jest that **terminates the worker**, so a bare `npx jest` stopped
partway and never printed a summary — indistinguishable from a hang. That is why
"run the full suite" was not something anyone here could do.

| Command | Runs |
|---|---|
| `npm run test:lib` | the three node-style assertion scripts |
| `npm run test:all` | jest, then `test:lib` |

**Measured, not claimed:** 44 failed suites / 96 failed tests on `88f0d52` with none of
this applied, and the same 96 after. Nothing that passed before fails now; four suites
newly pass. The 96 are pre-existing — transcode, analytics, design atoms, the audio
engine, the security specs.

### Rule-of-three, applied twice

- **Extracted.** The sign-in offer was about to become its third copy → `useSignInGate`.
  `PurchaseButton` keeps its own, deliberately: it is the one path that sells anything
  today and its block is woven through its own already-purchased and album-choice
  branches.
- **Not extracted.** The commercial and download terms summaries stay two files.
  Parameterising them would put a condition on every line of copy, and getting one
  backwards shows a buyer permission they do not have.

### Decisions worth keeping

- **Two controls, not one chooser.** `PurchaseOptionsDialog` asks "which recording"; the
  new button asks "which licence". One radio group holding a $1.99 download and a $29
  commercial licence puts two incomparable decisions in one control and **the cheap
  option wins by position**. It also leaves the download path untouched.
- **Both prices shown together** on a collection page. A buyer who only sees $319 cannot
  tell whether that is the only way in; one who only sees $29 buys four tracks and never
  learns the curve exists. 56 singly is $1,624 against $319.
- **The acceptance control is shared**, and only the terms block and named restrictions
  vary. The statutory capture does not, and that is a legal judgement: a one-off
  commercial licence is digital content supplied without a physical medium exactly as a
  download is, so **UK CCR 2013 reg.37 / EU CRD art.16(m) reach it identically**. Only the
  noun changes. A second copy is how one of the two elements goes missing from one
  product unnoticed.
- **A collection has no personal product.** `productForSale('collection', 'personal')` is
  `null` and checkout refuses it. Falling back would sell 56 tracks for $1.99, because
  every song document carries `price: 199`.

### An e2e failure that was not a bug

Publishing a third agreement broke two `/changes` assertions, and the page was right both
times: one counted "In force now" badges expecting 1 when the real property is one *per
agreement*; the other pinned the seen-marker to a literal date that had legitimately
moved. Both now derive from `AGREEMENT_HISTORY`. **A test that hardcodes what the data
says fails every time the data is correct**, and a failure that means nothing is the one
people learn to skip.

### Ratchet

| Measure | Before | Now |
|---|---|---|
| node assertions (certificate) | 17 | 17 |
| node assertions (payment-reversal) | 16 | 16 |
| node checks (entitlement) | 0 | 14 |
| jest assertions | 68 | 98 |
| Playwright assertions | 19 | 29 |
| jest suites that can run to completion | 0 (bare run hung) | 58 |
| pre-existing jest failures (unrelated) | 96 | 96 — do not let this rise |
| products on sale | 2 | 3 |
| published agreements | 2 | 3 |

### Still open

- **Acceptance capture at subscription checkout** for `sync-license@2026-10-16`. The
  `agreements.test.js` tripwire still guards it: a subscriber is paying for a grant with
  no evidence they agreed to it.
- **The dispute pack** both sync and commercial terms promise, and the `licenseClaims` log.
- **`pendingRevenueSplits`** — a collection sale records its split obligation rather than
  apportioning it. Safe only because every production-library track is BFMG's own today.
- **Collection pages emit no JSON-LD** — should be `MusicAlbum` +
  `albumProductionType: CompilationAlbum` + `offers`.
- **A cart.** Nothing here needs one: each session is still a single item.

### Concepts covered (continued)

- **Clickwrap scope — one agreement per product** — surfaced when the commercial licence
  needed an acceptance and the gate accepted any current agreement. Call: derive the
  required agreement from the product; a *valid acceptance of the wrong contract* is the
  failure a boolean check cannot see.
- **Non-exclusive licensing** — named when writing the commercial terms. BFMG licenses the
  same recording to many buyers at once; that is what makes $29 possible, and it has to be
  said out loud or a buyer assumes exclusivity. Call: state it at the point of sale.
- **Chain of title through a licensee** — surfaced by the client-work clause: an editor
  must be able to hand a finished film to the client who paid for it, but that puts the
  recording in the hands of someone who accepted nothing. Call: licence the editor to
  include it in delivered work; no separate grant to the end client; recourse runs against
  the licensee. Flagged as the sharpest reviewer question.
- **Calibration** — surfaced when `verify:sitemap` reported 69 song URLs and there were
  906. Call: prove a guard fails before trusting it, AND check the number it reports
  against an independent count — a guard proven to go red can still be reading low while
  it is green. Added to the global CLAUDE.md, because *instrument* and *reconciler* are
  defined there.
- **A checker's authority is the hazard** — an instrument's output gets trusted more than
  the code it checks, so a wrong one causes the fault rather than missing it. `verify:deps`
  said four packages were unused; they were deleted; `agents/` broke.
- **Derived copy vs canonical origin, in money** — `collections.trackCount` priced a
  product while being stale by three tracks. Call: price from the query, not the cached
  count, and have the page quote the same source so it cannot advertise one figure and
  bill another.

## Card rows were touching, and MUI never applied the spacing — 2026-10-18

Percy reported the bottom of one card row sitting against the top of the next on the
home page. Three grids were written like this:

```jsx
<Grid container spacing={'clamp(2rem, calc(1.5rem + 3vw), 4rem)'}>
```

**MUI's `spacing` is a theme multiplier** — `2` means 2 × 8px. Handed a CSS length string
it emits **no spacing at all**: not a fallback, not the default. The container gets
`margin-top: 0` and every item `padding-top: 0`.

Nothing warns. Not the compiler, not eslint, not the browser console. The code reads as
deliberate fluid spacing and renders as zero, which is exactly why it survived.

### Measured before touching anything, because "looks tight" is not a diagnosis

| Grid | gap | container | item |
|---|---|---|---|
| "Recently Released Albums" | **0px** | `mt: 0px` | `pt: 0px` |
| the grid below it | 16px | `mt: -16px` | `pt: 16px` |

The second row is what a **working** MUI grid looks like. The contrast on one page was
the whole tell.

**Three instances, not one.** Only "Recently Released Albums" had enough items to wrap,
so it was the only one visibly broken — Featured Artists and Discover Weekly carried the
identical bug waiting for one more item.

### The fix, and the decision inside it

`CARD_GRID_SPACING = { xs: 2, sm: 3 }` in `src/utils/layout.js`, used by all three.
Mobile-first: the base rule **is** the phone, scaled up, never a desktop value walked
back. It matches the grids already rendering correctly at `spacing={2}` and `{3}`.

**One value for all three is a choice.** The originals asked for two different curves
(0.5–2rem for Featured Artists, 2–4rem for the others) — but since none of them ever
rendered, there is no existing look to preserve. One constant cannot drift the way three
literals did.

Not restored as a `clamp()`: MUI cannot take one here, so keeping the fluid curve would
mean dropping `Grid` for a raw CSS grid in three working layouts, to recover spacing
nobody has ever seen.

Verified in a browser at two widths: **0px → 24px** at 1366px, **16px** at 390px.

`src/utils/layout.test.js` fails on any `spacing={'…'}` string literal. A unit test is
the wrong instrument for "does it look right" and the right one for "is this prop a type
MUI can use" — the failure is categorical, not visual.

> That guard failed on its first run against the example written inside `layout.js`'s own
> explanation of the bug, so it strips comments first. **A guard that cannot tell code
> from the documentation of the thing it guards makes documenting the problem
> impossible.**

---

## 396 vulnerabilities, triaged by surface rather than by count — 2026-10-18

GitHub reported **396** on the default branch (11 critical, 182 high). `npm audit`
reported **185**. Neither is actionable, and acting on either directly gives you one of
two failures:

| | |
|---|---|
| **Paralysis** | 396 is too many to start on, so nothing starts |
| **Theatre** | `npm audit fix --force` runs, the build breaks, and the next person learns that security work breaks builds |

### `npm audit --omit=dev` is not the instrument

Worth recording because it is the obvious move. It reported **119 "production"**
advisories — including `jest`, `webpack-dev-server`, `eslint` and `svgo`. CRA puts
`react-scripts` in `dependencies`, so npm counts the whole build toolchain as production.
**A packaging artefact, not a risk assessment.**

### Two surfaces actually ship

| Surface | What runs there |
|---|---|
| **FUNCTIONS** | `netlify/functions/*` on Netlify's servers, holding the **Stripe secret key** and **Firebase Admin credentials**. Reachable by anyone who can make the site call a function. |
| **BUNDLE** | whatever `src/` imports, compiled into `build/`, in a buyer's browser |

Everything else runs on a developer machine against source that developer already trusts.
**Those advisories are real and not urgent, and saying so out loud is the point** — an
unexplained decline reads as an oversight and gets "fixed" with `--force`.

Measured: **14 advisories on a shipped surface, 161 build tooling.**

### The advisory graph is not the install tree

A first pass walked `effects` from `npm audit --json` and concluded 6 advisories reached
the functions. Wrong, and the way it was wrong is the lesson: **`effects` describes which
packages an advisory invalidates, not which top-level package pulls it in.**
`protobufjs` (critical) did not appear — and it reaches `firebase-admin` via
`@google-cloud/firestore → google-gax → @grpc/grpc-js → @grpc/proto-loader`.

`npm run verify:vulns` resolves every path from `npm ls --all` instead. `npm audit fix`
(no `--force`) cleared **protobufjs, node-forge, fast-xml-parser and form-data** from the
function runtime.

### I removed four packages that were in use

Eight dependencies had zero references in `src/ scripts/ netlify/ config/ e2e/`. That
list looked exhaustive. **It was not** — the repo also has `agents/ api/ frontend/
middleware/ services/ functions/`. `commander`, `esprima`, `fluent-ffmpeg` and
`music-metadata` are required by `agents/`, and removing them broke `agents/cli.js`,
**which the pre-commit hook runs.**

The hook caught it with a stack trace. That is the system working — and it was **luck**,
because it only caught it where that directory happened to sit on the hook's path.
Nothing would have caught the same removal in `api/` or `services/`.

Restored as **devDependencies** (`agents/` is developer tooling, so they stay out of the
production tree). Genuinely unused and still gone: `@radix-ui/react-context-menu`,
`jsmediatags`, `music-metadata-browser`, `react-beautiful-dnd` — the last appears **only
inside a string in a code-generation template**, which is the generated project's
dependency, not this one's.

**Three near-misses, checked before deleting, which is why a scan is not a decision:**

| Package | Looked unused because |
|---|---|
| `web-vitals` | loaded by `import("web-vitals")` — a **dynamic** import the regex missed |
| `@emotion/styled` | a required **peer** of `@mui/material`; MUI fails at runtime without it |
| `react-scripts` | it is the build command itself |

**"No import site" and "safe to delete" are different claims.**

### A third inert manifest

Three `package.json` files describe dependencies for code in their directory and **none
has a `node_modules` beside it**, so every require resolves from the root instead. They
are documentation nothing enforces, and both were already wrong:

```
netlify/functions/package.json   firebase-admin ^12.0.0   root ^13.4.0, installed 13.10.0
agents/package.json              declares commander + esprima, while its code also
                                 requires music-metadata and fluent-ffmpeg
```

**A declaration that is authoritative-looking and inert is the worst shape a config value
can have.** Both now agree with the root. Deleting them would be cleaner and is not done
here: Netlify's behaviour depends on the bundler and settings outside this repo, and a
function that loses `firebase-admin` fails at the moment a buyer pays.

---

## `npm audit` recommended an upgrade that breaks the payment webhook — 2026-10-18

**The most valuable finding of the day.** `npm audit` reports the firebase-admin
advisories with `fixAvailable: { name: 'firebase-admin', version: '14.5.0' }`. Installing
it:

```
v13   require('firebase-admin') → { apps, credential, firestore, auth, storage, … }
v14   require('firebase-admin') → { initializeApp, cert, getApps, … }   app module ONLY
```

Every function opens with
`if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({…}) })`.
On v14 both `admin.apps` and `admin.credential` are undefined, so the function throws
**at module load** — every invocation.

**What would have shipped:** checkout redirects to Stripe → Stripe charges the card →
`stripe-webhook` 500s before reading its own metadata → no purchase and no licence
written. The buyer has paid for something that does not exist, and you find out from
whoever buys next.

> **`fixAvailable` means "a version exists without this advisory". It is not a claim that
> your code still works on it**, and nothing in the audit output distinguishes a patch
> bump from an API removal.

It was not even a win on the numbers: v14 took the function surface from 13 advisories to
7 but took the **highs from 2 to 4**. A breaking change for a worse high count.

**Reverted. firebase-admin stays on 13.x.**

`netlify/functions/lib/admin-api.test.js` asserts the ten calls the functions actually
make. It asserts the **surface, not the version** — pinning a number says "never
upgrade", which ages badly; this says "whatever you install, these calls must still
exist", which an upgrade is free to satisfy and a modular migration satisfies by shrinking
the list to nothing. It runs **first** in `npm run test:lib`, because if it fails the
other suites' results are not interesting.

**Proven both ways:** installed 14.5.0 and watched it fail, restored 13.x and watched it
pass. *A guard nobody has seen fail is a guard nobody should trust.*

### Follow-up, deliberately not done here

Migrating every function to `firebase-admin/app`, `/firestore`, `/auth`, `/storage`. It
touches the payment path, so it deserves its own work and its own testing. Until then
13.x carries 2 highs on the function surface, both transitive and both unfixable without
that migration or an `overrides` pin.

---

## Enforced, not promised

| Command | Goes red when |
|---|---|
| `npm run verify:vulns` | a **high or critical** advisory reaches the **deployed functions** |
| `npm run verify:deps` | a `require()` in our source does not resolve, or a satellite manifest disagrees with the root |
| `npm run test:lib` | the firebase-admin API the functions call has changed shape |
| `npx jest src/utils/layout.test.js` | a `Grid` is handed a CSS string as `spacing` |

`verify:vulns` deliberately does **not** fail on build tooling, and `verify:deps` is a
**ratchet rather than a wall**: 12 imports already do not resolve (dead analytics pages,
agent templates, a Python package name in `services/*/monitoring.js`), the build is green
because webpack never reaches them, and `KNOWN_UNRESOLVED` records them so only *new*
ones fail. **A reconciler that is permanently red gets removed, which is how a ratchet
dies.**

Both new reconcilers were proven by making them fail on purpose — a planted `require` of
a nonexistent package for `verify:deps`, and a real v14 install for the admin guard.

### Two bugs found by running the reconcilers rather than trusting them

- `verify:deps` reported **`firebase` unresolvable in 99 files** — because it reduced
  `firebase/firestore` to `firebase`, which has **no root export**. It now resolves the
  full specifier.
- It flagged `events` as missing from the root, when `events` is a **Node builtin** and
  the manifest is asking for the browser polyfill.

---

## Ratchet — 2026-10-18

| Measure | Before | Now |
|---|---|---|
| node checks (admin-api) | 0 | **10** |
| node checks (entitlement) | 14 | 14 |
| node assertions (certificate) | 17 | 17 |
| node assertions (payment-reversal) | 16 | 16 |
| jest tests passing | 251 | **256** |
| pre-existing jest failures (unrelated) | 96 | 96 — do not let this rise |
| Playwright assertions | 29 | 29 |
| `verify:*` reconcilers | 19 | **21** |
| advisories on a shipped surface | 20 | **14** |
| advisories on the function runtime | 18 | **13** |
| critical advisories on the function runtime | 1 (`protobufjs`) | **0** |
| declared dependencies | 37 | **27** |
| bundle (main chunk) | 225KB | **217KB** |

---

## Concepts covered (continued)

- **Risk surface vs advisory count** — surfaced by 396 GitHub vulnerabilities. Call:
  triage by what actually ships (functions, bundle) rather than by severity totals;
  `--omit=dev` answers a packaging question, not a risk one.
- **`fixAvailable` is not a compatibility claim** — surfaced when the recommended
  firebase-admin fix removed the API every function calls. Call: assert the API surface
  your code uses, and prove the guard fails before trusting it.
- **Peer and dynamic imports are invisible to a static scan** — `@emotion/styled` and
  `web-vitals` both looked unused. Call: a scan produces candidates; resolution produces
  the decision.
- **Theme multiplier vs CSS length** — MUI `spacing={2}` is 2 × 8px, and a `clamp()`
  string silently yields nothing. Call: constrain the prop's type with a test, since the
  failure is categorical rather than visual.
- **Ratchet vs wall** — a reconciler that fails on pre-existing debt gets deleted within
  a week. Call: record the baseline in code (`KNOWN_UNRESOLVED`) and fail only on growth.
- **Pillar / hub / spoke** — surfaced by having 23 collection pages and nothing above them
  saying what a licence is. Call: the pillar is the *subject*, `/sync-licensing` is the
  *conversion*; different jobs that link to each other do not compete.
- **Silent prop rejection** — React drops an unrecognised camelCase DOM prop without
  warning, which is how `innerHTML` emptied every JSON-LD tag on the site. Call: assert
  the rendered output, never the props you passed.
- **Pessimistic miscalibration** — understating your own capability feels like caution and
  therefore attracts no scrutiny. Call: check a claim about your own product in *both*
  directions; `AppRoutes.js` is not the list of routes the site serves.

## Calibration — the concept that came out of six wrong instruments — 2026-10-23

Added to the **global** `CLAUDE.md` as a caveat on "Enforce what you can", because the
vocabulary it uses lives there: *reconciler*, *ratchet* and *instrument* are defined
globally and merely used here. Defining the rule in a project file would split one
concept across two documents — the S violation, in prose.

**Calibration** is checking an instrument against a known reference before trusting what
it tells you. The failure mode is not a broken instrument; it is a working one that is
**off**, which is undetectable from its own output. `npm run verify:sitemap` printed
"69 URLs" in exactly the tone it would have printed "906".

### Six wrong readings in five days, which is a pattern rather than bad luck

| Instrument | Reading | Truth |
|---|---|---|
| `verify:sitemap` | 69 song URLs | **906** — the script capped the response body at 4KB |
| `verify:deps` | `firebase` unresolvable in 99 files | all fine — it reduced `firebase/firestore` to `firebase`, which has no root export |
| `verify:deps` | `events` missing from the root | a **Node builtin**; the manifest wanted the browser polyfill |
| `verify:no-fixtures` | baseline of 16 files | **6 of them were already clean** |
| the a11y checker | `INPUT_WITHOUT_LABEL`, **CRITICAL** | matched MUI's `<InputAdornment>` — `/<input[^>]*>/gi` is case-insensitive with nothing ending the tag name |
| first vulnerability triage | 6 advisories reach the functions | **18** — `effects` describes what an advisory invalidates, not what pulls it in |

### Why it does more damage than a wrong line of code

**A checker's output carries more authority than the code it checks.** When `verify:deps`
said four packages were unused, they were deleted — and four of them were in use by
`agents/`, which broke the pre-commit hook. The instrument did not fail to catch
something; it **caused** the fault, confidently.

### The two practices

1. **Prove the guard fails.** Plant the fault it exists to catch and watch it go red.
   Already the habit here: `verify:deps` was proven with a `require` of a nonexistent
   package, `verify:no-fixtures` with a planted `mockStats`, `admin-api.test.js` by
   actually installing firebase-admin 14, `blogPosts.test.js` by re-introducing the exact
   crash.
2. **Check the number against an independent count.** This is the one that was missing.
   `verify:sitemap` was proven to fail correctly on production — and the figure it
   printed while passing was never checked against `grep -c '<loc>'`.

> A guard proven to go red can still be reading low while it is green.


## The pillar, and the structured data that was never there — 2026-10-23

`/commercial-music-licensing`. BFMG had hubs and spokes and no pillar: `/browse/library`
routes to 23 collections, each collection to its tracks, `/sync-licensing` converts a
quote — and nothing above any of it said what a commercial music licence **is**. A
cluster with no centre reads as isolated pages, which is the thin/duplicate signal the
whole structure exists to avoid.

### Why it is not a second `/sync-licensing`

That page's job is **conversion**: tell us about the project, we come back with terms. The
pillar's job is the **subject**. The rule is the one `radio/albums.js` states best — "two
sites saying the same thing compete for the same searches; two sites with different jobs
that link to each other do not" — and it is as true of two pages as of two properties. So
`/sync-licensing` and the two pool landings link **up**, the pillar links **down** to the
library, the quote form, the terms and `/changes`, and neither restates the other.

### Depth had to be real, so it is built only from what BFMG can prove

1,356 words, eight sections, and **every price derived from `src/utils/pricing.js`** rather
than typed — a pillar quoting a figure the cart does not charge is the collection-page
fault of 2026-10-18 landing on the page that argues for trusting us.

Two claims were written, checked, and found false before shipping:

- *"More tracks always costs more and the per-track rate always falls."* Against the real
  curve: **29 ties** in the first 60 track counts, and the per-track rate **rises 20
  times**, because prices round down to a trailing 9. What survives is weaker and true —
  *adding a track never reduces the total* — plus a paragraph admitting the rounding. The
  honest version is also the better one: it is checkable against any collection on the site.
- The JSDoc in `pricing.js` said 24 tracks cost **$199 / $8.29 a track**. It is
  **$189 / $7.88**. A stale example beside working code, corrected in the same edit.

### Every JSON-LD tag on the site was empty, and had been

Found because the pillar's render check reported `breadcrumb ld: 0`. The instinct was that
the new page was special. It was not — **nothing on the site emitted structured data**.

`schemaToScriptTag()` returned *props to spread onto a script element*:

```js
return { type: 'application/ld+json', innerHTML: JSON.stringify(schema) };
// <script {...schemaToScriptTag(schema)} />
```

`innerHTML` is not a React DOM attribute — React requires `dangerouslySetInnerHTML` and
**silently drops** an unrecognised prop of that shape. Five pages rendered
`<script type="application/ld+json"></script>`: present, valid, and empty.

**Then the repair was wrong too.** Putting the fixed `<script>{json}</script>` inside
`<Helmet>` still produced zero tags: react-helmet-async 2.0.5 drops script children while
passing `<meta>` and `<title>` through **on the same render**. That is precisely what made
the original invisible — the head looked managed and correct. Isolated by noticing the
pillar's `<title>` arrived while its script arrived with zero bytes.

JSON-LD now renders **beside** `<Helmet>`, not in it. Google's own documentation accepts
JSON-LD anywhere in the document; `<head>` is a convention, not a requirement.

Measured after: `/commercial-music-licensing` → one 304-byte `BreadcrumbList`;
`/collection/8d-music-dragon-burial` → a **1,049-byte `MusicAlbum`** carrying the offer,
plus a 426-byte `BreadcrumbList`. Previously zero bytes sitewide.

`src/utils/schemaMarkup.test.js` holds both rules — payload in children, call site outside
`<Helmet>` — and was calibrated by moving the pillar's call back inside and watching it
name `pages/CommercialLicensing.js:92`. Rule 2 is the one the next person will "fix",
because putting meta in the head with the other meta is obviously right and happens to be
wrong here.

`schemaMarkup.js`'s own `@example` had shown the **correct** pattern the whole time, while
the helper beneath it did the wrong thing. Which is why the guard blanks comments before
scanning: three of its four checks quote the patterns they forbid, and the first version
reported a violation in its own explanation — the mistake `layout.test.js` made, for the
same reason. Comments are blanked **line-for-line** rather than deleted, so a reported
line number still points at the right line.

### Calibration cuts both ways, which is new

`OPS-NNRBA` was filed claiming the published licences promise a "public verification link"
that does not exist. **It was wrong and it is withdrawn.** `/verify/<LIC-id>` is a Netlify
function routed in `public/_redirects` line 24 — live since 2026-10-16, and it returns its
own page rather than the SPA shell when curled. It appears in **no React route table**,
which is where the mistake came from.

> `src/AppRoutes.js` is not the list of routes this site serves. `_redirects` and
> `netlify.toml` each add more, and a function route is invisible to a grep of the React
> tree. Check the live URL, not the router.

The sharper lesson is about the direction of the error. Every calibration failure recorded
above was an instrument reading **low**. This one was me reading **our own capability**
low — and being pessimistic about your own product *feels like* caution, so it attracted
no scrutiny at all. It had already softened the strongest section on the page to
"independent lookup is not built yet". The verify page shows VALID/REVOKED, the masked
holder, the ISRC, the rights granted, and **which version of the terms was accepted**,
linked to that exact text. That is the single best thing the pillar has to say, and
caution nearly deleted it.

### Also closed

- `verify:no-fixtures` reported `BlogManager.js` and `AdminDashboard.js` as **new**
  findings — because the comments explaining the fixtures just *removed* from them name
  the numbers they used to render. The gate was always right (comment-only never blocked);
  the **report** filed documentation under "these are the ones that matter". Now split
  into in-code and in-comment groups. An instrument that flags its own repairs trains you
  to skim it, and a check you skim is a check you have stopped running.
- `OPS-KWE66` — **40 of 64 test suites cannot run.** Not assertion failures: suites that
  fail to load. 10 need a `fetch` polyfill, 6 are `.tsx` the transform will not parse, 6
  have `jest.mock` hoisting errors, 4 cannot resolve `../../firebaseConfig`, 4 read a
  field off undefined, 2 want `music-metadata`. Confirmed as a **baseline, not a
  regression**, by stashing today's work and getting the identical 40/96. The cost: "run
  the test suite before any commit" currently buys about a third of the coverage it
  appears to.
- `OPS-GQ5RB` — parked at Percy's request. What rights exist in AI-generated recordings,
  which gates any artist pitch out of Studio Projects. Recorded as *the thing to verify*,
  not as findings: they are dated claims about a third party's terms. Flagged `forLawyer`
  because it is the same question the commercial licence already turns on — which is why
  that licence grants rights **contractually** rather than claiming copyright.

### Ratchet

| | Before | After |
|---|---|---|
| Indexable routes | 12 | **13** |
| Pages emitting non-empty JSON-LD | **0** | 5 |
| Passing tests | 313 | **317** |
| Suites that cannot load | 40 | 40 — now `OPS-KWE66` |

## The accessibility gate was a wall, and three of its rules read prose — 2026-10-23

Found by trying to commit the pillar. The hook refused with "Found 1 critical issues",
and the honest path from there was neither `--no-verify` nor shrugging: it was finding out
what the one critical was.

### It was the word "volume", in a comment, on a page with no audio

`VOLUME_CONTROL_NO_ARIA` fired on `CommercialLicensing.js` because
`checkMusicA11yPatterns` did `content.includes('volume')` against the whole file, and the
file's own comment reads *"the volume argument"* — volume as in quantity. Same fault as
`INPUT_WITHOUT_LABEL` matching `<InputAdornment>` on 2026-10-21, and the same fix: **a
substring is not an element.** The rule now matches an actual control.

**Then the rule was wrong in the other direction too**, which is the more interesting
half. It demanded `aria-valuemin` from everything. A native `<input type="range">` with
`min`, `max` and `value` **already exposes** valuemin/valuemax/valuenow — that is the
native semantics, and ARIA-in-HTML is explicit that you do not duplicate it. Adding the
attributes is redundant, and if they ever drift from the real bounds it is a lie to a
screen reader.

`MusicPlayer.js:294` is the worked example: it carries `aria-label="Volume"`,
`aria-valuetext` for a spoken percentage, and `min`/`max`/`value`. **Correct, accessible
code that the rule flagged.** "Fixing" it to satisfy the rule would have made it worse. So
the rule changed instead, and now asks what the element needs:

| Control | Needs |
|---|---|
| native range input, MUI `<Slider>` | an accessible **name**; value semantics come from the element |
| hand-rolled `role="slider"` | the full `aria-value*` set — nothing else provides it |

Calibrated across eight cases: quiet on prose, quiet on a correct native slider, quiet on
an unrelated `tempo` range input, fires on an unnamed range input, fires on an unnamed MUI
`Slider`, fires on a custom `role="slider"` with no `aria-valuenow`, and quiet on
`MusicPlayer.js`.

### A third rule had never run at all

`validateHeadingHierarchy(headings, filePath)` used `content` on the one line where it
resolves a heading's index to a line number — and never received it. So
**`HEADING_HIERARCHY_SKIP` has never once been reported**: an h1 → h3 jump threw a
`ReferenceError` instead of flagging the page. Caught by eslint's `no-undef`, confirmed
pre-existing by stashing. One-word fix.

> A rule that throws and a rule that finds nothing are indistinguishable from the outside.

### The gate itself: `verify:a11y`, 124 files, 464 issues

The hook ran `uiux review --exit-on-critical` over the staged files **whole**, while its
own comment said the opposite was intended:

> "New code is held to the line; existing debt is a ratchet to work down, recorded in
> CLAUDE.md, not a wall across every commit."

Judging a whole file means a one-line change imports every pre-existing issue in it.
Moving one JSON-LD tag in `Playlist.js` presented **23 accessibility findings** — not one
in the changed line, not one introduced that day — while the brand-new file in the same
commit had zero. The hook's closing line already says what a wall produces, and it had
already happened here once.

So `--exit-on-critical` is gone from that line: the review **reports** its design-token
and music-UX findings, and `scripts/verify-a11y-staged.js` **gates**, with a per-file
baseline in `scripts/a11y-baseline.json` — the same shape as `KNOWN_FIXTURES` here and
`KNOWN_UNRESOLVED` in `verify-deps.js`.

- a file **not** in the baseline → any CRITICAL/HIGH fails, so new code is held to the line
- a file in the baseline → only **growth** fails
- a file below its baseline → reported as CLEARED, so `-- --write` tightens the number

Only CRITICAL and HIGH gate. A gate that catches everything catches nothing, because it
gets turned off.

Calibrated: `--all` reports 464 against a baseline sum of 464 and says *(agree)*, and
planting an unnamed volume slider in the pillar exits 1 naming the file. Its own output
label was also wrong on the first pass — it printed "(staged)" for a `--files` run, which
is the smallest version of the same fault as reporting the wrong number, and it now names
its source.

**Accessibility is the one that gets a gate** because the global standard calls it a floor
that is never traded for style. Design tokens and music UX stay a report.

### Ratchet (updated)

| | Before | After |
|---|---|---|
| Accessibility rules matching prose instead of markup | 2 known | **0** |
| Checker rules that throw instead of reporting | 1 (silent) | **0** |
| Gating a11y issues, `src/` | 464 (ungated) | 464 — **baselined, growth fails** |
| Files in the a11y baseline | — | 124 |
| Commits blocked by debt they did not create | every one touching a legacy file | 0 |

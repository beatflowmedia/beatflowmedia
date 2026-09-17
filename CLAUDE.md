# BeatFlow Media — music-license-app

Instantiates the global DOSI / mobile-first / PHAST standards in `~/.claude/CLAUDE.md`.
This file records only what has been **verified against the tree**. Unverified sections are
marked `NEEDS OWNER` rather than guessed — an invented canonical origin is worse than a
missing one.

## Stack

React 18 + CRA-via-CRACO + MUI, Firebase (Firestore/Storage/Auth), Netlify Functions,
Stripe. Dev server on `:3005` (`npm run dev`).

## Single Source — concern → canonical origin

| Concern | Canonical origin | Reconciler |
|---|---|---|
| Artwork URL for any entity | `src/utils/artwork.js` (`artworkUrl`) | `npx jest src/utils/artwork.test.js` |
| Placeholder / fallback imagery | `src/utils/placeholders.js` (`getPlaceholderImage`, `PLACEHOLDER_IMAGE`) | `npm run verify:assets` |
| Local image assets | `public/` | `npm run verify:assets` |
| Album cover field name | **NEEDS OWNER** — `cover` and `coverUrl` both in use | none yet |
| Song / album pricing | `src/utils/pricing.js` (**CommonJS**, so the station can `require` it) | `npx jest src/utils/pricing.test.js` |
| Master object key + delivery contract | `netlify/functions/lib/masters.js` | `npm run test:functions` |
| "may this user have this item" | `netlify/functions/lib/entitlement.js` | - |
| Catalogue records (albums/songs) | **`C:/Users/percy/RadioStation/radio/releases.json`** — the station seeds BFMG one-way over ISRC; see its `catalog.js` | `node catalog.js diff` |
| Stripe pricing | `netlify/functions/create-checkout.js` (server-side price lookup) | e2e coverage |
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
deciding a paid licence may deliver lossy — or the album is not sold, or the WAVs are
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

**Ratchet:** function-delivery assertions — **baseline 10**. Up only.

**Ratchet:** missing referenced assets in rendering code — **baseline 18**. Never raise it.

#!/usr/bin/env node
//
// scripts/ingest-production-library.js
//
// Bring the local production library into the sellable catalogue.
//
//   npm run ingest:library                        # dry run, writes nothing
//   npm run ingest:library -- --folder="Balearic" # scope to one collection
//   npm run ingest:library -- --limit=5 --apply   # a real but tiny first run
//   npm run ingest:library -- --apply             # everything
//
// WHY THIS EXISTS
// 995 audio files sit in Downloads/Music; 43 of their titles are in the store. The
// platform sells production music and the production library is not in it. These are
// the easy-to-license tracks -- no artist album to explain, no persona, just "music
// for a coffee shop" -- and they are 95% of what Percy has made.
//
// WHAT IT DERIVES, so nothing is typed by hand
//   title        the filename, minus extension
//   collection   the folder name, which is already a use-case taxonomy
//                ("Deep Focus Work Flow", "Game Show Walk-On")
//   artwork      the image sharing the audio file's stem; 916 of 995 have one
//   duration     ffprobe, because a wrong duration is worse than none
//
// WHAT IT WILL NOT GUESS
//   aiDisclosure and humanContributions are CONSTANTS below, set from Percy's
//   answer, not inferred per file. Provenance is the field the platform's whole
//   legal position rests on; deriving it from a folder name would be inventing a
//   claim about authorship.
//
//   No ISRC. These are unreleased, so none exists. A fabricated one would collide
//   with a real registrant's range.
//
// WAV IS CONVERTED TO MP3 FOR DELIVERY
// The library is 23.3 GB of WAV against 1.7 GB of MP3. Percy's call was that "mp3 is
// good enough to sell". Shipping the WAVs would mean paying to store and serve 23 GB
// so buyers can download files most of them cannot tell from a 320k MP3. The WAVs
// stay on disk as the archive -- this never deletes or modifies a source file.
//
// STORAGE DESTINATION admin-uploads/production-library/ follows upload-local-masters.js
// and for its reason: storage.rules restricts admin-uploads/** to isPlatformAdmin(),
// which is what makes it safe for a world-readable song document to carry the path.
// The path is inert; only download-master.js, after checking the buyer paid, can mint
// a signed URL.
//
// IDEMPOTENT. A title already in the catalogue is skipped, so a re-run after a failure
// resumes rather than duplicating. Matching is on a normalised title because that is
// the only key both sides share.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const { loadEnv, initAdmin, assertProject, args } = require('./lib/admin');

const { has, value } = args();
const APPLY = has('--apply');
const FROM = value('from', 'C:/Users/percy/Downloads/Music');
const ONLY_FOLDER = value('folder', null);
const LIMIT = parseInt(value('limit', '0'), 10) || 0;
const EXPECT_PROJECT = value('project', null);
const BUCKET = value('bucket', 'beatflowmedia.firebasestorage.app');
const DEST_PREFIX = 'admin-uploads/production-library/';

// ---- Percy's answers, recorded once. -------------------------------------------
// "all the production library is ai-assisted", with melody, chord progression,
// substantive edits and selection/sequencing as the human contributions. Those four
// span both authorship types in aiDisclosure.js -- melody and chord-progression are
// COMPOSITION, substantive-edits is the SOUND RECORDING -- so these are registrable
// on both counts rather than compilation-only.
const AI_DISCLOSURE = 'ai-assisted';
const HUMAN_CONTRIBUTIONS = [
  'melody',
  'chord-progression',
  'substantive-edits-to-generated-audio',
  'selection-and-sequencing'
];
const ARTIST = 'Percy Rice';
const RECORD_LABEL = 'BeatFlow Media Group';
const PRICE_CENTS = 199; // matches SONG_PRICE in src/utils/pricing.js

// Folders that are working scratch, not product. Named rather than pattern-matched:
// a pattern like /^test/i would silently swallow a real collection called
// "Test Card Themes" one day.
const SKIP_FOLDERS = new Set([
  'test alphabet idea',
  'test brooding',
  'Lighthearted Mischie',
  'Suno',
  'Alphabet Videos',
  'Faceless Youtube Channel',
  'The Silicon Baobab Promos',
  // Promos and working exports rather than product. Named individually rather than
  // pattern-matched: /^test/i would one day swallow a real collection called
  // "Test Card Themes".
  'The Silicon Baobab Final Audio Mastered',
  'FullYutubeStreamVErsion',
  'jazzy neo-soul'
]);

/**
 * Tracks excluded by NAME, for reasons the folder cannot express.
 *
 * COVERS AND REMIXES are the important half. A cover is someone else's COMPOSITION.
 * The platform's whole proposition is one-stop clearance -- BFMG holds the recording
 * and the composition, so a single licence covers both -- and on a cover it does not.
 * Listing one would make /terms untrue for that record and would grant rights BFMG
 * does not hold. Percy has not confirmed these individually, so they stay out; some
 * may well be his own work remixed, and each can be added back deliberately.
 *
 * JOINED EXPORTS are continuous mixes built for a YouTube upload, not tracks. Their
 * tags name audio-joiner.com, which is also why they carry no Suno id -- re-encoding
 * strips it.
 */
const SKIP_TITLES = new Set([
  // Covers and remixes of other people's compositions
  'Atlantis - From.Us (Cover)',
  "DJ Illuminado (Carlos' Song) (Remix) (Cover)",
  'Favorite Birthday...Ever (Cover)',
  'Let it Slide (Remix Me)',
  'little island (Cover)',
  'nikiDUA - Memory 03 (Cover)',
  'Balcony (Scoson Cover)',
  'Out Yo Head - Remix',
  'Right Kind of Wrong (Remix)',
  // Joined exports, not individual tracks
  'SunsetChillVIbesEPYouTube'
]);

// "Cloud Cover" contains the word cover and is not one -- the exclusions above are an
// explicit list precisely so a substring match cannot take a real track with it.

/**
 * Folders that are RELEASES, not production-library collections.
 *
 * Percy's classification, not inferred: "It's Christmas Time Again" falls under
 * Albums, and Interstellar Drift and After Hours at the Library are production
 * library despite reading like sequential releases. Naming cannot decide this --
 * "Eternal Flame" and "Deep Sleep" look alike and are different products.
 *
 * The distinction is structural, not cosmetic. A release needs an albums/ document
 * and an albumId on every track, or it appears on no album page and in no album
 * browse -- six loose tracks with a shared string in a field nothing joins on.
 */
const ALBUM_FOLDERS = new Set([
  "It's Christmas Time Again",
  'Eternal Flame',
  'From Pain to Light',
  'Memphis Love'
]);

/**
 * Which pool a track belongs to, using the vocabulary assetPools.js already defines.
 *
 * Set EXPLICITLY rather than left to assetPoolOf()'s heuristic. That classifier infers
 * from the presence of isrc/trackNumber (a release) or mood/bpm/loopable (licensing
 * metadata), and these records have neither -- so every one of them would classify as
 * null and sit unpooled. We know which is which here; stating it beats a guess made
 * later from absent fields.
 */
const POOL_RELEASE = 'commercial-release';
const POOL_PRODUCTION = 'production-music';

const AUDIO_EXT = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aiff', '.aif']);
const IMAGE_EXT = ['.jpeg', '.jpg', '.png', '.webp'];

const normTitle = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/\(feat\..*?\)/g, '')
    .replace(/[^a-z0-9]/g, '');

const slug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (AUDIO_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function artworkFor(audioPath) {
  const dir = path.dirname(audioPath);
  const stem = path.basename(audioPath, path.extname(audioPath));
  for (const ext of IMAGE_EXT) {
    const candidate = path.join(dir, stem + ext);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Seconds, rounded. Returns null rather than a guess when ffprobe cannot read it. */
function durationOf(file) {
  try {
    const out = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
      { encoding: 'utf8', timeout: 30000 }
    );
    const seconds = parseFloat(String(out).trim());
    return Number.isFinite(seconds) ? Math.round(seconds) : null;
  } catch {
    return null;
  }
}

/** Convert to 320k mp3 in a temp dir. Never touches the source. */
function toMp3(sourcePath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bfmg-'));
  const out = path.join(tmp, path.basename(sourcePath, path.extname(sourcePath)) + '.mp3');
  execFileSync(
    'ffmpeg',
    ['-v', 'error', '-y', '-i', sourcePath, '-codec:a', 'libmp3lame', '-b:a', '320k', out],
    { timeout: 300000 }
  );
  return { file: out, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

(async () => {
  loadEnv();
  // initAdmin returns { admin, projectId, via } rather than the SDK itself, and takes
  // the bucket up front -- storage() with no configured bucket throws later, mid-run,
  // after the first upload has already been attempted.
  const { admin, projectId, via } = initAdmin({ storageBucket: BUCKET });
  const db = admin.firestore();
  assertProject(projectId, EXPECT_PROJECT);

  console.log('Source   : ' + FROM);
  console.log('Project  : ' + projectId + '  (via ' + via + ')');
  console.log('Bucket   : ' + BUCKET);
  console.log('Applying : ' + (APPLY ? 'YES' : 'no - dry run, pass --apply to write'));
  console.log('');

  if (!fs.existsSync(FROM)) {
    console.error('REFUSING: source folder not found: ' + FROM);
    process.exit(1);
  }

  // Existing titles, so a re-run resumes instead of duplicating.
  const existing = new Set();
  const snap = await db.collection('songs').select('title').get();
  snap.forEach((doc) => existing.add(normTitle(doc.get('title'))));

  // Existing albums by normalised title. A folder matching one ATTACHES to it rather
  // than creating a second album with the same name -- three folders already match
  // ("What She Said", "Maps & Moments", "I Should of Shown up For You"), and a
  // duplicate album is invisible in a list and impossible to tell apart later.
  const albumIdByTitle = new Map();
  const albumSnap = await db.collection('albums').get();
  albumSnap.forEach((doc) => albumIdByTitle.set(normTitle(doc.get('title')), doc.id));

  console.log('Catalogue already holds ' + existing.size + ' distinct titles and ' +
    albumIdByTitle.size + ' albums.');
  console.log('');

  const files = walk(FROM);
  const skipped = { folder: 0, sameTrackOtherFormat: 0, inCatalogue: 0, excludedTitle: 0 };

  // Group by COLLECTION + TITLE, not title alone.
  //
  // The first version keyed on title only and dropped 107 files as duplicates. The dry
  // run showed that was two different things wearing one name:
  //
  //   104  the same track present as both .wav and .mp3 in one folder -- a real
  //        duplicate, but the FORMAT to keep is a choice, and taking whichever the
  //        directory walk reached first is not one.
  //    25  genuinely DIFFERENT tracks that happen to share a title across folders.
  //        "Horizon Glow" is 33MB in After Midnight Vibes and 25MB in Sunset Chill
  //        Vibes -- different recordings, different lengths. Dropping one of each pair
  //        would have quietly lost 25 sellable tracks, with nothing reporting it.
  //
  // Collection is part of the identity of a production-library track, so it belongs in
  // the key. Two tracks called "First Light" in two collections are two products.
  const groups = new Map();

  for (const file of files) {
    const collection = path.basename(path.dirname(file));
    if (SKIP_FOLDERS.has(collection)) { skipped.folder += 1; continue; }
    if (ONLY_FOLDER && collection !== ONLY_FOLDER) continue;

    const title = path.basename(file, path.extname(file));
    if (SKIP_TITLES.has(title)) { skipped.excludedTitle += 1; continue; }
    const key = slug(collection) + '|' + normTitle(title);
    const group = groups.get(key) || [];
    group.push({ file, title, collection });
    groups.set(key, group);
  }

  // Best source per track. WAV first because the delivery copy is transcoded once from
  // it; choosing an MP3 when a WAV sits beside it means encoding an already-encoded
  // file and losing quality that cannot come back.
  const FORMAT_RANK = ['.wav', '.aiff', '.aif', '.flac', '.m4a', '.mp3'];
  const rankOf = (file) => {
    const index = FORMAT_RANK.indexOf(path.extname(file).toLowerCase());
    return index === -1 ? FORMAT_RANK.length : index;
  };

  const plan = [];
  for (const group of groups.values()) {
    group.sort((a, b) => rankOf(a.file) - rankOf(b.file));
    const best = group[0];
    skipped.sameTrackOtherFormat += group.length - 1;

    if (existing.has(normTitle(best.title))) { skipped.inCatalogue += 1; continue; }

    plan.push({ ...best, art: artworkFor(best.file) });
    if (LIMIT && plan.length >= LIMIT) break;
  }

  // Provisional track numbers for album folders only.
  //
  // Assigned AFTER the plan is built so numbering is contiguous over what will
  // actually be written -- numbering during the walk would leave gaps wherever a
  // track was skipped as a duplicate format or already present.
  //
  // Alphabetical because the filenames carry no order and the intended sequence is
  // recorded nowhere. Stable and reorderable beats absent, which sorts arbitrarily on
  // an album page; it is presentation, not a claim about the record.
  const albumCounters = new Map();
  plan
    .filter((item) => ALBUM_FOLDERS.has(item.collection))
    .sort((a, b) => a.collection.localeCompare(b.collection) || a.title.localeCompare(b.title))
    .forEach((item) => {
      const next = (albumCounters.get(item.collection) || 0) + 1;
      albumCounters.set(item.collection, next);
      item.trackNumber = next;
    });

  // Report by collection before anything is written.
  const byCollection = {};
  plan.forEach((item) => {
    byCollection[item.collection] = byCollection[item.collection] || { n: 0, art: 0 };
    byCollection[item.collection].n += 1;
    if (item.art) byCollection[item.collection].art += 1;
  });

  console.log('WOULD INGEST ' + plan.length + ' tracks:');
  Object.entries(byCollection)
    .sort((a, b) => b[1].n - a[1].n)
    .forEach(([name, stat]) =>
      console.log(
        '  ' + String(stat.n).padStart(4) + '  ' + name.padEnd(46) +
        (ALBUM_FOLDERS.has(name) ? '[ALBUM] ' : '        ') +
        (stat.art === stat.n ? 'all have art' : stat.art + '/' + stat.n + ' have art')
      )
    );

  console.log('');
  console.log('SKIPPED');
  console.log('  ' + String(skipped.folder).padStart(4) + '  in excluded folders');
  console.log('  ' + String(skipped.excludedTitle).padStart(4) + '  covers, remixes and joined exports');
  console.log('  ' + String(skipped.inCatalogue).padStart(4) + '  already in the catalogue');
  console.log('  ' + String(skipped.sameTrackOtherFormat).padStart(4) + '  same track in another format (best source kept)');

  const wavCount = plan.filter((p) => path.extname(p.file).toLowerCase() === '.wav').length;
  console.log('');
  console.log('  ' + wavCount + ' of these are WAV and would be converted to 320k mp3 for delivery.');
  console.log('  Source files are never modified.');

  if (!APPLY) {
    console.log('');
    console.log('Dry run only. Re-run with --apply to write.');
    console.log('Suggested first real run:  npm run ingest:library -- --limit=3 --apply');
    return;
  }

  const bucket = admin.storage().bucket(BUCKET);
  let written = 0;
  let failed = 0;

  for (const item of plan) {
    const label = item.collection + ' / ' + item.title;
    try {
      const seconds = durationOf(item.file);
      if (seconds === null) {
        console.log('  SKIP  ' + label + '  (ffprobe could not read a duration)');
        failed += 1;
        continue;
      }

      // Convert ANYTHING that is not already mp3, not just wav.
      //
      // The first version tested only for .wav, so .m4a, .flac and .aiff were uploaded
      // byte-for-byte but named ".mp3" and served as audio/mpeg -- a file that lies
      // about its own format. It would download with the wrong extension and fail to
      // play, and the only symptom a buyer gets is "this file is broken". Memphis Love
      // is entirely .m4a, which is how it surfaced.
      const alreadyMp3 = path.extname(item.file).toLowerCase() === '.mp3';
      const converted = alreadyMp3 ? null : toMp3(item.file);
      const audioSource = converted ? converted.file : item.file;
      const audioDest = DEST_PREFIX + slug(item.collection) + '/' + item.title + '.mp3';

      await bucket.upload(audioSource, {
        destination: audioDest,
        metadata: { contentType: 'audio/mpeg' }
      });
      if (converted) converted.cleanup();

      let coverUrl = '';
      if (item.art) {
        const artDest = DEST_PREFIX + slug(item.collection) + '/' + item.title +
          path.extname(item.art).toLowerCase();
        await bucket.upload(item.art, { destination: artDest });
        const artFile = bucket.file(artDest);
        await artFile.makePublic();
        coverUrl = 'https://storage.googleapis.com/' + BUCKET + '/' + encodeURI(artDest);
      }

      const isAlbum = ALBUM_FOLDERS.has(item.collection);

      // Attach to an existing album, or create one once per run.
      let albumId = null;
      if (isAlbum) {
        const key = normTitle(item.collection);
        if (!albumIdByTitle.has(key)) {
          const created = await db.collection('albums').add({
            title: item.collection,
            artist: ARTIST,
            artistName: ARTIST,
            recordLabel: RECORD_LABEL,
            aiDisclosure: AI_DISCLOSURE,
            humanContributions: HUMAN_CONTRIBUTIONS,
            isVisible: true,
            assetPool: POOL_RELEASE,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          albumIdByTitle.set(key, created.id);
          console.log('  ALBUM created: ' + item.collection + '  (' + created.id + ')');
        }
        albumId = albumIdByTitle.get(key);
      }

      await db.collection('songs').add({
        title: item.title,
        album: item.collection,
        albumTitle: item.collection,
        ...(albumId ? { albumId } : {}),
        // PROVISIONAL running order, alphabetical by title. The filenames carry no
        // track numbers, so the intended sequence is not recorded anywhere -- this is
        // stable and reorderable in admin rather than a claim about the album.
        ...(isAlbum ? { trackNumber: item.trackNumber } : {}),
        assetPool: isAlbum ? POOL_RELEASE : POOL_PRODUCTION,
        artist: ARTIST,
        artistName: ARTIST,
        recordLabel: RECORD_LABEL,
        duration: seconds,
        price: PRICE_CENTS,
        coverUrl,
        // audioUrl is deliberately EMPTY. The master is behind admin-only storage and
        // is served by download-master.js after payment; a public audio URL here would
        // hand the file to anyone who opened the document.
        audioUrl: '',
        masterBackend: 'firebase',
        masterFormat: 'mp3',
        masterPath: audioDest,
        aiDisclosure: AI_DISCLOSURE,
        humanContributions: HUMAN_CONTRIBUTIONS,
        explicit: false,
        isVisible: true,
        approved: true,
        status: 'published',
        previewOnly: false,
        playCount: 0,
        likeCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      written += 1;
      console.log('  OK    ' + label + '  (' + seconds + 's' + (item.art ? ', art' : ', no art') + ')');
    } catch (err) {
      failed += 1;
      console.log('  FAIL  ' + label + '  ' + String(err.message).slice(0, 120));
    }
  }

  console.log('');
  console.log('Written: ' + written + '   Failed: ' + failed);
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});

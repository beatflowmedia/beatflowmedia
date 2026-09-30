#!/usr/bin/env node
//
// scripts/generate-previews.js
//
//   npm run previews                        # dry run
//   npm run previews -- --limit=5 --apply   # a small real run
//   npm run previews -- --apply             # everything missing one
//
// WHY
// The ingest wrote audioUrl EMPTY on 782 tracks, deliberately: the master sits under
// admin-uploads/** and is released by download-master.js only after payment, so a
// populated audioUrl on a world-readable document would hand the file to anyone.
//
// But the storefront skips any track without an audioUrl -- correctly, since a grid
// slot you cannot hear is not shoppable. So the whole production library is in the
// database, properly secured, and invisible. The missing piece is a PREVIEW: a short,
// public, deliberately partial clip that is safe to give away and is what audioUrl
// should point at.
//
// SOURCE IS THE LOCAL FILE, NOT THE UPLOADED MASTER
// The masters are in Cloud Storage, but the originals are on disk and the mapping is
// exact (collection = folder, title = filename). Cutting locally avoids downloading
// ~2.5GB back out of a bucket that bills egress, to produce something we already have
// the source for.
//
// DESTINATION songs/previews/** is PUBLIC by storage.rules -- `allow read: if true`,
// admin write, 5MB ceiling. That is the point: a preview is meant to be heard by
// someone who has not paid. The master's path is unchanged and stays private.
//
// THE CLIP IS PARTIAL ON PURPOSE. 30 seconds, and for anything long enough it starts
// 30 seconds in rather than at zero -- intros are often the least representative part
// of a production cue, and a preview that gives away the whole arrangement is not a
// preview. Tracks shorter than the window are cut from the start and remain shorter
// than the original, so a 10-second stinger is never served complete.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const { loadEnv, initAdmin, assertProject, args } = require('./lib/admin');

const { has, value } = args();
const APPLY = has('--apply');
const FROM = value('from', 'C:/Users/percy/Downloads/Music');
const LIMIT = parseInt(value('limit', '0'), 10) || 0;
const EXPECT_PROJECT = value('project', null);
const BUCKET = value('bucket', 'beatflowmedia.firebasestorage.app');
const DEST_PREFIX = 'songs/previews/';

const PREVIEW_SECONDS = 30;
// Skip the intro when there is enough track to skip. 30 + 30 + a little headroom:
// below this the offset would land at or past the end.
const OFFSET_SECONDS = 30;
const MIN_FOR_OFFSET = 75;

const AUDIO_EXT = ['.wav', '.aiff', '.aif', '.flac', '.m4a', '.mp3'];

/** Find the local source for a song, by collection folder and title. */
function localSourceFor(collection, title) {
  const dir = path.join(FROM, collection);
  if (!fs.existsSync(dir)) return null;
  for (const ext of AUDIO_EXT) {
    const candidate = path.join(dir, title + ext);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Cut a preview. Returns { file, cleanup } or throws.
 *
 * -ss before -i seeks by keyframe and is fast; accuracy to the frame does not matter
 * for a 30 second excerpt. afade gives it a half-second in and out so it does not
 * begin or end on a click, which is what an abrupt cut sounds like.
 */
function cutPreview(source, durationSeconds) {
  const offset = durationSeconds >= MIN_FOR_OFFSET ? OFFSET_SECONDS : 0;
  const length = Math.min(PREVIEW_SECONDS, Math.max(1, durationSeconds - offset));

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bfmg-prev-'));
  const out = path.join(tmp, 'preview.mp3');

  execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-y',
      '-ss', String(offset),
      '-i', source,
      '-t', String(length),
      '-af', `afade=t=in:st=0:d=0.5,afade=t=out:st=${Math.max(0, length - 0.5)}:d=0.5`,
      '-codec:a', 'libmp3lame', '-b:a', '128k',
      out
    ],
    { timeout: 180000 }
  );

  return { file: out, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

(async () => {
  loadEnv();
  const { admin, projectId, via } = initAdmin({ storageBucket: BUCKET });
  const db = admin.firestore();
  assertProject(projectId, EXPECT_PROJECT);

  console.log('Source   : ' + FROM);
  console.log('Project  : ' + projectId + '  (via ' + via + ')');
  console.log('Applying : ' + (APPLY ? 'YES' : 'no - dry run, pass --apply to write'));
  console.log('');

  const snapshot = await db.collection('songs').get();

  const needing = [];
  const problems = { alreadyHas: 0, noSource: 0, noDuration: 0 };

  snapshot.forEach((doc) => {
    const song = doc.data();
    if (song.audioUrl) { problems.alreadyHas += 1; return; }

    const source = localSourceFor(song.album || song.albumTitle || '', song.title || '');
    if (!source) { problems.noSource += 1; return; }
    if (!song.duration) { problems.noDuration += 1; return; }

    needing.push({ id: doc.id, title: song.title, collection: song.album, source, duration: song.duration });
  });

  console.log('SONGS');
  console.log('  ' + String(problems.alreadyHas).padStart(4) + '  already have an audioUrl');
  console.log('  ' + String(needing.length).padStart(4) + '  need a preview and have a local source');
  console.log('  ' + String(problems.noSource).padStart(4) + '  need one but no local file was found');
  console.log('  ' + String(problems.noDuration).padStart(4) + '  need one but have no duration recorded');

  const work = LIMIT ? needing.slice(0, LIMIT) : needing;

  const short = work.filter((w) => w.duration < MIN_FOR_OFFSET).length;
  console.log('');
  console.log('  ' + work.length + ' previews would be cut: ' + PREVIEW_SECONDS + 's each, from ' +
    OFFSET_SECONDS + 's in.');
  console.log('  ' + short + ' are shorter than ' + MIN_FOR_OFFSET + 's so are cut from the start instead.');

  if (!APPLY) {
    console.log('');
    console.log('Dry run only. Re-run with --apply.');
    console.log('Suggested first real run:  npm run previews -- --limit=5 --apply');
    return;
  }

  const bucket = admin.storage().bucket(BUCKET);
  let done = 0;
  let failed = 0;

  for (const item of work) {
    try {
      const clip = cutPreview(item.source, item.duration);
      const dest = DEST_PREFIX + item.id + '.mp3';

      await bucket.upload(clip.file, {
        destination: dest,
        metadata: { contentType: 'audio/mpeg', cacheControl: 'public, max-age=31536000' }
      });
      clip.cleanup();

      await bucket.file(dest).makePublic();
      const url = 'https://storage.googleapis.com/' + BUCKET + '/' + dest;

      // previewOnly is NOT set here, and that was a real bug.
      //
      // It reads like "this record has a preview" and means the opposite: "a preview
      // is ALL there is -- no master can be delivered". The storefront filters those
      // out and create-checkout refuses them, so setting it true while generating
      // previews made all 785 tracks invisible AND unsellable in one line.
      //
      // Every one of these HAS a master, sitting in storage with its path on the
      // record. Having a preview and having a master are independent facts, and the
      // flag describes the second.
      await db.collection('songs').doc(item.id).update({
        audioUrl: url
      });

      done += 1;
      if (done % 25 === 0 || done <= 5) {
        console.log('  ' + done + '/' + work.length + '  ' + item.collection + ' / ' + item.title);
      }
    } catch (err) {
      failed += 1;
      console.log('  FAIL  ' + item.collection + ' / ' + item.title + '  ' + String(err.message).slice(0, 100));
    }
  }

  console.log('');
  console.log('Previews written: ' + done + '   Failed: ' + failed);
})().catch((err) => {
  console.error('FAILED: ' + err.message);
  process.exit(1);
});

// Runs BeatFlow Radio's OWN parser against BFMG's firebaseConfig.js.
// Verbatim from RadioStation/radio/catalog.js — webConfig() and bucketName().
const fs = require('fs');

const src = fs.readFileSync('C:/BeatFlowMedia/music-license-app/src/firebaseConfig.js', 'utf8');

const get = (k) => {
  const m = new RegExp(k + '\\s*:\\s*"([^"]+)"').exec(src);
  return m ? m[1] : '';
};

const cfg = { projectId: get('projectId'), apiKey: get('apiKey') };
const bucketMatch = /storageBucket:\s*"([^"]+)"/.exec(src);
const bucket = bucketMatch ? bucketMatch[1] : '';

const lineOf = (needle) => {
  const i = src.indexOf(needle);
  return i < 0 ? '?' : src.slice(0, i).split('\n').length;
};

console.log('projectId     :', cfg.projectId || 'NOT FOUND',
  cfg.projectId ? '(line ' + lineOf('projectId: "') + ')' : '');
console.log('apiKey        :', cfg.apiKey ? cfg.apiKey.slice(0, 8) + '…' : 'NOT FOUND',
  cfg.apiKey ? '(line ' + lineOf('apiKey: "') + ')' : '');
console.log('storageBucket :', bucket || 'NOT FOUND');
console.log('');

const ok = cfg.projectId === 'beatflowmedia' && cfg.apiKey && bucket;
console.log(ok ? 'RADIO PARSER OK — catalogue sync unaffected'
                : 'RADIO PARSER WOULD FAIL — do not commit');
process.exit(ok ? 0 : 1);

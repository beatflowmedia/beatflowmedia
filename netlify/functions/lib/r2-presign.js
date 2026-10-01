// netlify/functions/lib/r2-presign.js
//
// AWS Signature Version 4 presigned GET, for Cloudflare R2's S3-compatible API.
//
// Hand-rolled against node's crypto rather than pulling @aws-sdk/client-s3 +
// s3-request-presigner: this runs on a cold-start path and those add several MB
// to the bundle to produce a string. Presigning is pure arithmetic -- no network,
// no service calls -- so there is nothing here that a client library would do
// better. Correctness is pinned by AWS's own published test vector in
// tests/r2-presign.test.js; if that fails, this is wrong.
//
// The credential never leaves the server. The browser receives a URL that works
// for MASTER_URL_TTL_SECONDS and then does not.

const crypto = require('crypto');

const ALGORITHM = 'AWS4-HMAC-SHA256';

const sha256Hex = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value, 'utf8').digest();

/** RFC 3986. encodeURIComponent leaves !'()* alone and AWS does not. */
function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/** Path segments are encoded individually so the separators survive. */
function encodePath(path) {
  return path.split('/').map(encodeRfc3986).join('/');
}

function amzDate(date) {
  return date.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Returns a URL that grants `method` (default GET) on one object for `expiresIn`
 * seconds. HEAD is used to ask whether an object exists without transferring it.
 *
 * `bucket` is omitted for virtual-hosted style (the bucket is in the hostname);
 * R2 uses path style, so pass it.
 */
function presignGetObject(options) {
  const {
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucket,
    key,
    expiresIn,
    region = 'auto',
    service = 's3',
    now = new Date(),
    method = 'GET',
    responseContentDisposition
  } = options;

  if (!accessKeyId || !secretAccessKey) throw new Error('presignGetObject: missing credentials');
  if (!endpoint) throw new Error('presignGetObject: missing endpoint');
  if (!key) throw new Error('presignGetObject: missing key');

  const url = new URL(endpoint);
  const host = url.host;

  const stamp = amzDate(now);
  const dateOnly = stamp.slice(0, 8);
  const scope = dateOnly + '/' + region + '/' + service + '/aws4_request';

  const canonicalUri = encodePath(bucket ? '/' + bucket + '/' + key : '/' + key);

  const query = {
    'X-Amz-Algorithm': ALGORITHM,
    'X-Amz-Credential': accessKeyId + '/' + scope,
    'X-Amz-Date': stamp,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host'
  };
  if (responseContentDisposition) {
    query['response-content-disposition'] = responseContentDisposition;
  }

  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => encodeRfc3986(k) + '=' + encodeRfc3986(query[k]))
    .join('&');

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    'host:' + host + '\n',
    'host',
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  const stringToSign = [ALGORITHM, stamp, scope, sha256Hex(canonicalRequest)].join('\n');

  const signingKey = ['AWS4' + secretAccessKey, dateOnly, region, service, 'aws4_request']
    .reduce((prev, cur, i) => (i === 0 ? prev : hmac(prev, cur)), 'AWS4' + secretAccessKey);

  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

  return url.protocol + '//' + host + canonicalUri + '?' + canonicalQuery + '&X-Amz-Signature=' + signature;
}


/**
 * R2 credentials and target, from the environment, in ONE place.
 *
 * This function existed three times -- in download-master.js, in verify-masters.js, and
 * in the migration script that was being written when this was noticed. Each copy named
 * its own env vars, and one of them got the endpoint variable wrong
 * (R2_ENDPOINT rather than R2_MASTERS_ENDPOINT), which fails as "missing endpoint" at
 * the point of use rather than as a typo at the point of writing.
 *
 * The same shape as the master-resolution bug it was written alongside: one rule, three
 * implementations, and nothing to stop them drifting. The env var NAMES are the
 * contract here, so the contract gets one home.
 *
 * Throws rather than returning a half-filled object, because presigning with undefined
 * produces a URL that 403s later, somewhere far from the cause.
 */
function r2Config() {
  const cfg = {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    endpoint: process.env.R2_MASTERS_ENDPOINT,
    bucket: process.env.R2_MASTERS_BUCKET
  };
  const missing = Object.keys(cfg).filter((k) => !cfg[k]);
  if (missing.length) {
    const err = new Error(
      'R2 is not configured: missing ' +
      missing.map((k) => ({
        accessKeyId: 'R2_ACCESS_KEY_ID',
        secretAccessKey: 'R2_SECRET_ACCESS_KEY',
        endpoint: 'R2_MASTERS_ENDPOINT',
        bucket: 'R2_MASTERS_BUCKET'
      })[k]).join(', ')
    );
    err.statusCode = 503;
    throw err;
  }
  return cfg;
}


/**
 * Credentials for READING the bucket a migration is moving away from.
 *
 * Separate from r2Config() on purpose. A cross-bucket move needs read THERE and write
 * HERE, and Cloudflare cannot express "read-only on bucket A, read-write on bucket B"
 * in one token. The alternative was widening the write token to cover beatflow-assets,
 * which holds the radio station's public intros/ and spots/ -- and keeping paid masters
 * out of that blast radius is the entire reason the masters bucket exists.
 *
 * So the write credential never gains reach over the radio's bucket. The source token
 * is read-only, temporary, and revoked once the migration reports zero absent.
 *
 * Falls back to the main config when unset, so every normal caller is unaffected.
 */
function r2SourceConfig() {
  if (!process.env.R2_SOURCE_ACCESS_KEY_ID) return r2Config();
  return {
    accessKeyId: process.env.R2_SOURCE_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SOURCE_SECRET_ACCESS_KEY,
    endpoint: process.env.R2_MASTERS_ENDPOINT,
    bucket: process.env.R2_SOURCE_BUCKET || 'beatflow-assets'
  };
}

module.exports = { presignGetObject, r2Config, r2SourceConfig, encodeRfc3986, encodePath, amzDate };

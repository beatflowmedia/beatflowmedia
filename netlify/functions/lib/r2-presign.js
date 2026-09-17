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

module.exports = { presignGetObject, encodeRfc3986, encodePath, amzDate };

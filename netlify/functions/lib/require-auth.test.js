// netlify/functions/lib/require-auth.test.js
//
// These assert the half that is easy to get wrong. Authentication is obvious and was
// never the gap: request-payout accepted a verified-looking request and then acted on
// an `artistId` the caller chose. So the case that matters most here is "signed in as
// A, asking to act as B" -- it must 403, and it must do so without a token check
// having passed being mistaken for permission.

const admin = require('firebase-admin');

jest.mock('firebase-admin', () => ({
  apps: [{}],                  // pretend initializeApp already ran
  auth: jest.fn()
}));

const { requireUser, requireSelf, requireAdmin } = require('./require-auth');

// Taken from src/utils/platformAdmins.js rather than retyped, so renaming an admin
// address cannot leave this suite asserting against a stale one.
const { PLATFORM_ADMIN_EMAILS } = require('../../../src/utils/platformAdmins');
const ADMIN_EMAIL = PLATFORM_ADMIN_EMAILS[0];

const eventWith = (headers = {}) => ({ headers, httpMethod: 'POST', body: '{}' });
const bearer = (token = 'tok') => eventWith({ authorization: `Bearer ${token}` });

/** Make verifyIdToken resolve to a given decoded token. */
function signedInAs({ uid, email }) {
  admin.auth.mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({ uid, email })
  });
}

function tokenRejects(message = 'bad token') {
  admin.auth.mockReturnValue({
    verifyIdToken: jest.fn().mockRejectedValue(new Error(message))
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  admin.apps = [{}];
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('requireUser', () => {
  it('refuses a request with no Authorization header', async () => {
    const res = await requireUser(eventWith());
    expect(res.ok).toBe(false);
    expect(res.response.statusCode).toBe(401);
  });

  it('refuses a header that is not a bearer token', async () => {
    const res = await requireUser(eventWith({ authorization: 'Basic abc123' }));
    expect(res.ok).toBe(false);
    expect(res.response.statusCode).toBe(401);
  });

  it('accepts either header capitalisation', async () => {
    signedInAs({ uid: 'u1', email: 'a@b.com' });
    const res = await requireUser(eventWith({ Authorization: 'Bearer tok' }));
    expect(res.ok).toBe(true);
    expect(res.uid).toBe('u1');
  });

  it('refuses a token that does not verify', async () => {
    tokenRejects();
    const res = await requireUser(bearer());
    expect(res.ok).toBe(false);
    expect(res.response.statusCode).toBe(401);
  });

  it('does not leak the verification failure reason to the caller', async () => {
    tokenRejects('token used too late, iat is in the future for user abc');
    const res = await requireUser(bearer());
    expect(res.response.body).not.toMatch(/iat|abc/);
  });

  it('fails closed with a 500 if firebase-admin was never initialised', async () => {
    admin.apps = [];
    const res = await requireUser(bearer());
    expect(res.ok).toBe(false);
    expect(res.response.statusCode).toBe(500);
  });
});

describe('requireSelf', () => {
  it('allows a caller acting on their own id', async () => {
    signedInAs({ uid: 'artist-1', email: 'artist@example.com' });
    const res = await requireSelf(bearer(), 'artist-1');
    expect(res.ok).toBe(true);
    expect(res.actingAsAdmin).toBeUndefined();
  });

  // The IDOR. This is the whole reason the module exists.
  it('REFUSES a signed-in caller acting on someone else\'s id', async () => {
    signedInAs({ uid: 'artist-1', email: 'artist@example.com' });
    const res = await requireSelf(bearer(), 'artist-2');
    expect(res.ok).toBe(false);
    expect(res.response.statusCode).toBe(403);
  });

  it('refuses with 403, not 401, so the client does not retry a completed sign-in', async () => {
    signedInAs({ uid: 'artist-1', email: 'artist@example.com' });
    const res = await requireSelf(bearer(), 'artist-2');
    expect(res.response.statusCode).not.toBe(401);
  });

  it('does not confirm whether the other id exists', async () => {
    signedInAs({ uid: 'artist-1', email: 'artist@example.com' });
    const res = await requireSelf(bearer(), 'artist-2');
    expect(res.response.body).not.toMatch(/artist-2/);
  });

  it('refuses a missing id rather than treating it as a match', async () => {
    signedInAs({ uid: 'artist-1', email: 'artist@example.com' });
    for (const bad of [undefined, null, '', 0, {}]) {
      const res = await requireSelf(bearer(), bad);
      expect(res.ok).toBe(false);
      expect(res.response.statusCode).toBe(400);
    }
  });

  it('checks the token before the id, so an unauthenticated call cannot probe ids', async () => {
    const res = await requireSelf(eventWith(), 'artist-2');
    expect(res.response.statusCode).toBe(401);
  });

  it('lets a platform admin act for another account, and says so', async () => {
    signedInAs({ uid: 'admin-uid', email: ADMIN_EMAIL });
    const res = await requireSelf(bearer(), 'artist-2');
    expect(res.ok).toBe(true);
    expect(res.actingAsAdmin).toBe(true);
  });

  it('recognises an admin address whatever its capitalisation', async () => {
    signedInAs({ uid: 'admin-uid', email: ADMIN_EMAIL.toUpperCase() });
    const res = await requireSelf(bearer(), 'artist-2');
    expect(res.ok).toBe(true);
  });
});

describe('requireAdmin', () => {
  it('allows a platform admin', async () => {
    signedInAs({ uid: 'admin-uid', email: ADMIN_EMAIL });
    const res = await requireAdmin(bearer());
    expect(res.ok).toBe(true);
  });

  it('refuses an ordinary signed-in user', async () => {
    signedInAs({ uid: 'u1', email: 'someone@example.com' });
    const res = await requireAdmin(bearer());
    expect(res.ok).toBe(false);
    expect(res.response.statusCode).toBe(403);
  });

  it('refuses a verified token carrying no email at all', async () => {
    signedInAs({ uid: 'u1', email: undefined });
    const res = await requireAdmin(bearer());
    expect(res.ok).toBe(false);
    expect(res.response.statusCode).toBe(403);
  });

  it('refuses an unauthenticated call', async () => {
    const res = await requireAdmin(eventWith());
    expect(res.response.statusCode).toBe(401);
  });
});

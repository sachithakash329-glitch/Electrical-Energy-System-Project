import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { readToken, tokenDigest, publicUser } from '../auth/session.js';
import { protectWrites, loginLimiter } from '../auth/requestSecurity.js';

test('passwords use random salts and only the correct password verifies', async () => {
  const first = await hashPassword('a long unique test passphrase');
  const second = await hashPassword('a long unique test passphrase');
  assert.notEqual(first, second);
  assert.equal(first.includes('a long unique test passphrase'), false);
  assert.equal(await verifyPassword('a long unique test passphrase', first), true);
  assert.equal(await verifyPassword('a different test passphrase', first), false);
  assert.equal(await verifyPassword('a long unique test passphrase', undefined), false);
});

test('session cookies are validated and only their digests are stored', () => {
  const token = 'ab'.repeat(32);
  assert.equal(readToken({ headers: { cookie: `other=example; ee_session=${token}` } }), token);
  assert.equal(readToken({ headers: { cookie: 'ee_session=invalid' } }), null);
  assert.equal(readToken({ headers: {} }), null);
  assert.equal(tokenDigest(token).length, 64);
  assert.notEqual(tokenDigest(token), token);
  assert.deepEqual(Object.keys(publicUser({ _id: '123', passwordHash: 'private', fullName: 'Test', email: 'test@example.com' })),
    ['_id', 'fullName', 'email', 'householdName', 'city', 'householdSize']);
});

test('state-changing browser requests need a custom header and a trusted origin', () => {
  function check(headers, method = 'POST') {
    let code = 200; let continued = false;
    protectWrites({ method, get: name => headers[name.toLowerCase()] },
      { status(value) { code = value; return this; }, json() {} }, () => { continued = true; });
    return { code, continued };
  }
  assert.equal(check({}).code, 403);
  assert.equal(check({ 'x-energy-client': 'web', origin: 'https://untrusted.example' }).code, 403);
  assert.equal(check({ 'x-energy-client': 'web', origin: 'null' }).code, 403);
  assert.equal(check({ 'x-energy-client': 'web', 'sec-fetch-site': 'cross-site' }).code, 403);
  assert.equal(check({ 'x-energy-client': 'web', origin: 'http://localhost:5173' }).continued, true);
  assert.equal(check({}, 'GET').continued, true);
});

test('repeated sign-in attempts are limited per client address', () => {
  const limiter = loginLimiter({ limit: 2 });
  let count = 0; let status = 200; let retry;
  const res = { set(name, value) { retry = value; }, status(value) { status = value; return this; }, json() {} };
  for (let index = 0; index < 3; index++) limiter({ ip: '127.0.0.1' }, res, () => { count += 1; });
  assert.equal(count, 2); assert.equal(status, 429); assert.ok(Number(retry) > 0);
});

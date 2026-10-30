import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDatabase } from '../database.js';
import User from '../models/User.js';
import Appliance from '../models/Appliance.js';
import Session from '../models/Session.js';
import Setting from '../models/Setting.js';
import { tokenDigest } from '../auth/session.js';
import { memoryModels } from '../test-support/memoryModels.js';

// Default: real HTTP requests with in-memory model doubles.
// TEST_MONGODB_URI switches the same cases to a dedicated disposable MongoDB database.
const uri = process.env.TEST_MONGODB_URI;
test(`${uri ? 'real MongoDB' : 'HTTP API with model doubles'}: account access, isolation and session lifecycle`, async t => {
  if (uri) {
    const databaseName = uri.split('?')[0].split('/').at(-1);
    assert.match(databaseName, /^energy_estimator_[a-z0-9]+_auth_test$/,
      'Use a disposable database named energy_estimator_<label>_auth_test.');
  } else memoryModels(t);
  let disposeDatabase = false;
  let server; let base;
  async function start() {
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}/api`;
  }
  async function stop() { if (server?.listening) await new Promise(resolve => server.close(resolve)); }
  async function request(path, { method = 'GET', body, jar, headers = {}, clientHeader = true } = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(clientHeader ? { 'X-Energy-Client': 'web' } : {}),
        Origin: 'http://localhost:5173',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(jar?.cookie ? { Cookie: jar.cookie } : {}), ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const cookies = response.headers.getSetCookie();
    if (jar && cookies[0]) jar.cookie = cookies[0].split(';')[0];
    return { status: response.status, data: await response.json(), headers: response.headers };
  }
  function expect(result, status = 200) { assert.equal(result.status, status, JSON.stringify(result.data)); return result.data; }
  const a = {}; const b = {};
  const accountA = { fullName: 'First Test User', email: 'first@example.test', password: 'unique first test passphrase', householdName: 'First home', city: 'Galle', householdSize: 4 };
  const accountB = { fullName: 'Second Test User', email: 'second@example.test', password: 'unique second test passphrase' };
  let userA; let userB; let appliance; let input;
  try {
    if (uri) await connectDatabase(uri);
    // Do not run against an occupied test database: create a fresh label for each run.
    assert.equal(await User.countDocuments(), 0, 'This disposable test database must start empty.');
    disposeDatabase = Boolean(uri);
    await start();
    await t.test('logged-out requests cannot read protected data', async () => {
      for (const route of ['/rooms', '/appliances', '/settings', '/auth/me']) expect(await request(route), 401);
      assert.equal(expect(await request('/health')).database, 'connected');
    });
    await t.test('registration validates fields, normalizes emails and sets an HttpOnly cookie', async () => {
      expect(await request('/auth/register', { method: 'POST', body: { ...accountA, password: 'short' } }), 400);
      expect(await request('/auth/register', { method: 'POST', body: { ...accountA, householdSize: 1.5 } }), 400);
      const result = await request('/auth/register', { method: 'POST', body: { ...accountA, email: 'FIRST@EXAMPLE.TEST' }, jar: a });
      userA = expect(result, 201).user;
      assert.equal(userA.email, accountA.email);
      assert.equal(userA.passwordHash, undefined);
      assert.equal(userA.password, undefined);
      assert.match(result.headers.getSetCookie()[0], /HttpOnly/i);
      assert.match(result.headers.getSetCookie()[0], /SameSite=Lax/i);
      const stored = await User.findById(userA._id).select('+passwordHash');
      assert.match(stored.passwordHash, /^scrypt\$/);
      expect(await request('/auth/register', { method: 'POST', body: accountA }), 409);
    });
    await t.test('old unassigned records stay hidden; new records belong to their creator', async () => {
      const rooms = expect(await request('/rooms', { jar: a }));
      input = { name: 'Ceiling fan', roomId: rooms[0]._id, powerWatts: 75, quantity: 2, hoursPerDay: 8, daysPerMonth: 30 };
      await Appliance.collection.insertOne({ ...input, roomId: new mongoose.Types.ObjectId(input.roomId) });
      assert.equal(expect(await request('/appliances', { jar: a })).length, 0);
      appliance = expect(await request('/appliances', { method: 'POST', body: input, jar: a }), 201);
      assert.equal(appliance.userId, userA._id);
      assert.equal(expect(await request('/appliances', { jar: a })).length, 1);
      expect(await request(`/appliances/${appliance._id}`, { jar: a }));
      const updated = expect(await request(`/appliances/${appliance._id}`, { method: 'PUT', body: { ...input, powerWatts: 100 }, jar: a }));
      assert.equal(updated.powerWatts, 100);
      expect(await request(`/appliances/${appliance._id}`, { method: 'PUT', body: input, jar: a }));
    });
    await t.test('each account gets one independent tariff, including simultaneous first requests', async () => {
      const requests = await Promise.all([request('/settings', { jar: a }), request('/settings', { jar: a })]);
      requests.forEach(result => expect(result));
      assert.equal(await Setting.countDocuments({ userId: userA._id }), 1);
      expect(await request('/settings', { method: 'PUT', body: { unitRate: 45, fixedCharge: 100 }, jar: a }));
      userB = expect(await request('/auth/register', { method: 'POST', body: accountB, jar: b }), 201).user;
      const settingsB = expect(await request('/settings', { jar: b }));
      assert.equal(settingsB.unitRate, 30); assert.equal(settingsB.fixedCharge, 0);
      expect(await request('/settings', { method: 'PUT', body: { unitRate: 10, fixedCharge: 25 }, jar: b }));
      assert.equal(expect(await request('/settings', { jar: a })).unitRate, 45);
    });
    await t.test('a second account cannot read, change or delete the first account records', async () => {
      assert.equal(expect(await request('/appliances', { jar: b })).length, 0);
      expect(await request(`/appliances/${appliance._id}`, { jar: b }), 404);
      expect(await request(`/appliances/${appliance._id}`, { method: 'PUT', body: { ...input, powerWatts: 100 }, jar: b }), 404);
      expect(await request(`/appliances/${appliance._id}`, { method: 'DELETE', jar: b }), 404);
      const forged = expect(await request('/appliances', { method: 'POST', body: { ...input, userId: userA._id }, jar: b }), 201);
      assert.equal(forged.userId, userB._id);
      const stillOwned = expect(await request(`/appliances/${forged._id}`, { method: 'PUT', body: { ...input, powerWatts: 100, userId: userA._id }, jar: b }));
      assert.equal(stillOwned.userId, userB._id);
      expect(await request(`/appliances/${forged._id}`, { method: 'DELETE', jar: b }));
      assert.equal(expect(await request('/appliances', { jar: b })).length, 0);
      assert.equal(expect(await request(`/appliances/${appliance._id}`, { jar: a })).powerWatts, 75);
    });
    await t.test('login rejects wrong credentials, rotates sessions and survives an API restart', async () => {
      expect(await request('/auth/login', { method: 'POST', body: { email: accountA.email, password: 'the wrong test passphrase' } }), 401);
      const previous = { cookie: a.cookie };
      expect(await request('/auth/login', { method: 'POST', body: { email: accountA.email, password: accountA.password }, jar: a }));
      assert.notEqual(previous.cookie, a.cookie);
      expect(await request('/auth/me', { jar: previous }), 401);
      await stop(); await start();
      assert.equal(expect(await request('/auth/me', { jar: a })).user._id, userA._id);
      assert.equal(expect(await request('/appliances', { jar: a })).length, 1);
    });
    await t.test('logout revokes a stolen old cookie and expired sessions are rejected immediately', async () => {
      const oldCookie = { cookie: b.cookie };
      expect(await request('/auth/logout', { method: 'POST', jar: b }));
      expect(await request('/auth/me', { jar: oldCookie }), 401);
      const token = a.cookie.split('=')[1];
      await Session.updateOne({ _id: tokenDigest(token) }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
      expect(await request('/auth/me', { jar: a }), 401);
    });
    await t.test('cross-origin writes and requests missing the custom header are rejected', async () => {
      expect(await request('/auth/register', { method: 'POST', body: accountA, clientHeader: false }), 403);
      expect(await request('/auth/register', { method: 'POST', body: accountA, headers: { Origin: 'https://untrusted.example' } }), 403);
    });
  } finally {
    await stop();
    if (uri && mongoose.connection.readyState === 1) {
      if (disposeDatabase) await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  }
});

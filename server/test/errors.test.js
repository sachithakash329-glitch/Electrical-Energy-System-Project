import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../app.js';

test('disconnected database and malformed JSON return useful API errors', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 503);
    assert.deepEqual(await health.json(), { database: 'disconnected' });
    const list = await fetch(`${base}/api/appliances`);
    assert.equal(list.status, 503);
    assert.match((await list.json()).message, /Database unavailable/);
    const invalid = await fetch(`${base}/api/appliances`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).message, 'Invalid JSON request.');
    const missing = await fetch(`${base}/missing`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

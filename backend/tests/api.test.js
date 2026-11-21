const { test } = require('node:test');
const assert = require('node:assert/strict');

const base = process.env.API_URL || 'http://localhost:3000';

test('GET /health zwraca status UP i polaczenie z baza', async () => {
  const response = await fetch(`${base}/api/health`);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.status, 'ok');
  assert.equal(data.database, 'connected');
});

test('GET /api/trips zwraca liste podrozy', async () => {
  const response = await fetch(`${base}/api/trips`);
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await response.json()));
});

test('GET /api/trips/999999 zwraca 404', async () => {
  const response = await fetch(`${base}/api/trips/999999`);
  assert.equal(response.status, 404);
});

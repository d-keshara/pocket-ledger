/* Tests for web/sync-core.js: finding what changed since the last sync.
 * Run with:  npm test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Load sync-core.js into a small sandbox and take PocketSync out of it.
const SRC = fs.readFileSync(new URL('../web/sync-core.js', import.meta.url), 'utf8');
const box = {}; vm.runInNewContext(SRC, box);
const { stable, snapshotOf, diffState } = box.PocketSync;
// Objects from the sandbox have their own "Object", so copy them before deepEqual.
const plain = (v) => JSON.parse(JSON.stringify(v));

function sampleState() {
  return {
    version: 1,
    settings: { currency: 'LKR', symbol: 'Rs', weekStart: 1, theme: 'dark', lastBackup: '2026-10-01', backupSnoozeUntil: '' },
    accounts: [{ id: 'a1', name: 'Cash', initial: 0 }],
    categories: [{ id: 'c1', name: 'Food', type: 'expense' }],
    transactions: [{ id: 't1', type: 'expense', amount: 500, date: '2026-10-07', categoryId: 'c1', accountId: 'a1', note: '' }],
    budgets: [], recurring: [],
    goals: [{ id: 'g1', name: 'Bike', target: 5000, saved: 1000, deadline: '' }],
  };
}
const copy = (v) => JSON.parse(JSON.stringify(v));

describe('sync: finding changes', () => {
  test('the same data in a different key order is not a change', () => {
    assert.equal(stable({ a: 1, b: { c: 2, d: 3 } }), stable({ b: { d: 3, c: 2 }, a: 1 }));
  });

  test('nothing changed means nothing to send', () => {
    const s = sampleState();
    assert.deepEqual(plain(diffState(snapshotOf(s), s)), { upserts: [], deletes: [] });
  });

  test('a new transaction is found', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.transactions.push({ id: 't2', type: 'income', amount: 9000, date: '2026-10-07', categoryId: 'c1', accountId: 'a1', note: 'Salary' });
    const { upserts, deletes } = plain(diffState(snap, s));
    assert.deepEqual(upserts.map((u) => u.list + '/' + u.id), ['transactions/t2']);
    assert.equal(upserts[0].data.note, 'Salary');
    assert.equal(deletes.length, 0);
  });

  test('an edited transaction is found', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.transactions[0].amount = 650;
    const { upserts } = plain(diffState(snap, s));
    assert.deepEqual(upserts.map((u) => u.id), ['t1']);
    assert.equal(upserts[0].data.amount, 650);
  });

  test('a deleted transaction is found', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.transactions = [];
    assert.deepEqual(plain(diffState(snap, s)), { upserts: [], deletes: [{ list: 'transactions', id: 't1' }] });
  });

  test('ids with dashes (scheduled payments) keep their full id', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.transactions.push({ id: 'r1-2026-10-01', type: 'expense', amount: 50000, date: '2026-10-01' });
    assert.equal(plain(diffState(snap, s)).upserts[0].id, 'r1-2026-10-01');
  });

  test('money added to a goal is sent as "how much it changed", not the new total', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.goals[0].saved = 1200;
    const [u] = plain(diffState(snap, s)).upserts;
    assert.equal(u.savedDelta, 200);
    assert.equal(u.data.saved, undefined); // the total is not sent, so it can't overwrite another device
  });

  test('money taken out of a goal is a negative change', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.goals[0].saved = 700.5;
    assert.equal(plain(diffState(snap, s)).upserts[0].savedDelta, -299.5);
  });

  test('a new goal is sent with its full amount', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.goals.push({ id: 'g2', name: 'Phone', target: 9000, saved: 300, deadline: '' });
    const [u] = plain(diffState(snap, s)).upserts;
    assert.equal(u.data.saved, 300);
    assert.equal(u.savedDelta, undefined);
  });

  test('renaming a goal sends the name but no amount change', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.goals[0].name = 'Mountain bike';
    const [u] = plain(diffState(snap, s)).upserts;
    assert.equal(u.data.name, 'Mountain bike');
    assert.equal(u.savedDelta, undefined);
  });

  test('shared settings sync, but theme and backup reminder stay on this device', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.settings.theme = 'light'; s.settings.lastBackup = '2026-10-07';
    assert.equal(plain(diffState(snap, s)).upserts.length, 0);
    s.settings.currency = 'USD';
    const [u] = plain(diffState(snap, s)).upserts;
    assert.equal(u.list + '/' + u.id, 'settings/main');
    assert.equal(u.data.currency, 'USD');
    assert.equal(u.data.theme, undefined);
  });

  test('finding changes does not change the data or the snapshot', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.goals[0].saved = 1500;
    const before = copy(s); const snapBefore = copy(snap);
    diffState(snap, s);
    assert.deepEqual(s, before);
    assert.deepEqual(plain(snap), snapBefore);
  });
});

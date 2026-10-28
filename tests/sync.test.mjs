/* Tests for web/sync-core.js: finding what changed, and syncing two devices through a pretend cloud.
 * Run with:  npm test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

// Load sync-core.js into a small sandbox and take PocketSync out of it.
const SRC = fs.readFileSync(new URL('../web/sync-core.js', import.meta.url), 'utf8');
const box = { setTimeout, clearTimeout, console, Date }; vm.runInNewContext(SRC, box);
const { stable, snapshotOf, diffState, applyRemote, commitSnapshot, chunkDiff, createEngine, forgetSync } = box.PocketSync;
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

describe('sync: applying changes from the cloud', () => {
  test('a record changed only in the cloud is taken', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    const changed = applyRemote(s, snap, 'transactions', 't1', { ...s.transactions[0], amount: 999 });
    assert.equal(changed, true);
    assert.equal(s.transactions[0].amount, 999);
    assert.equal(diffState(snap, s).upserts.length, 0, 'nothing left to send back');
  });

  test('if this device changed the record too, this device wins (it is sent next)', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.transactions[0].amount = 650;
    assert.equal(applyRemote(s, snap, 'transactions', 't1', { ...s.transactions[0], amount: 999 }), false);
    assert.equal(s.transactions[0].amount, 650);
    assert.equal(diffState(snap, s).upserts[0].data.amount, 650);
  });

  test('a record deleted in the cloud is removed here, a new one is added', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    applyRemote(s, snap, 'transactions', 't1', null);
    applyRemote(s, snap, 'transactions', 't9', { type: 'income', amount: 5, date: '2026-10-07' });
    assert.deepEqual(s.transactions.map((t) => t.id), ['t9']);
    assert.deepEqual(plain(diffState(snap, s)), { upserts: [], deletes: [] });
  });

  test('cloud settings are taken, but this device keeps its own theme and backup reminder', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    applyRemote(s, snap, 'settings', 'main', { currency: 'USD', symbol: '$', weekStart: 0 });
    assert.equal(s.settings.currency, 'USD');
    assert.equal(s.settings.theme, 'dark');
    assert.equal(s.settings.lastBackup, '2026-10-01');
  });

  test('after sending a goal change, the snapshot holds the new total', () => {
    const s = sampleState(); const snap = snapshotOf(s);
    s.goals[0].saved = 1250;
    commitSnapshot(snap, diffState(snap, s));
    assert.deepEqual(plain(diffState(snap, s)), { upserts: [], deletes: [] });
  });

  test('a big first upload is split into parts', () => {
    const diff = { upserts: Array.from({ length: 950 }, (_, i) => ({ list: 'transactions', id: 't' + i, data: {} })), deletes: [{ list: 'goals', id: 'g' }] };
    assert.deepEqual(plain(chunkDiff(diff, 400).map((p) => p.upserts.length + p.deletes.length)), [400, 400, 151]);
  });
});

/* ------------------------------------------------------------------ *
 * Two (or three) devices syncing through a pretend cloud that behaves like Firestore:
 * every write gets a time stamp, listeners hear about changes after the write is saved,
 * and goal amounts sent as "+200" are added to the total.
 * ------------------------------------------------------------------ */
const APP_SRC = fs.readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
function makeAppState(now = '2026-10-07T10:00:00') {
  const dom = new JSDOM('<!doctype html><body><div id="root"></div><div id="tip"></div><div id="toasts"></div></body>',
    { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; w.__LEDGER_TEST__ = true; w.__LEDGER_NOW__ = now; w.eval(APP_SRC);
  const L = w.__ledger; L.state = L.defaultState();
  return { L, close: () => w.close() };
}

function pretendCloud() {
  const docs = new Map(); // "uid/list/id" -> data
  const listeners = new Set();
  let clock = 1000; let reads = 0;
  const stamp = () => { const t = ++clock; return { toMillis: () => t }; };
  const tell = (uid, list, id, data) => setTimeout(() => {
    for (const l of listeners) if (l.uid === uid && data._at.toMillis() > l.since) l.onDocs(list, [{ id, data: { ...data } }]);
  }, 1);
  return {
    docs, reads: () => reads,
    /* The connection breaks: every listener of this account gets an error and stops (like Firestore). */
    breakListeners(uid) { for (const l of [...listeners]) if (l.uid === uid) { listeners.delete(l); l.onError({ code: 'unavailable' }); } },
    count: (uid, list) => [...docs.entries()].filter(([k, d]) => k.startsWith(`${uid}/${list}/`) && !d._del).length,
    adapter(uid) {
      const key = (list, id) => `${uid}/${list}/${id}`;
      return {
        async fetchAll() {
          const records = {}; let settings = null; let maxAt = 0;
          for (const [k, d] of docs) {
            const [u, list, id] = k.split('/'); if (u !== uid) continue;
            reads++; maxAt = Math.max(maxAt, d._at.toMillis()); if (d._del) continue;
            const rec = Object.fromEntries(Object.entries(d).filter(([f]) => f[0] !== '_'));
            if (list === 'settings') settings = rec; else (records[list] ||= {})[id] = rec;
          }
          return { records, settings, maxAt };
        },
        // Like a Firestore query "changed after `since`": first sends what already matches, then new changes.
        listen(since, onDocs, onError, onReady = () => {}) {
          const l = { uid, since, onDocs, onError }; listeners.add(l);
          setTimeout(() => {
            for (const [k, d] of docs) {
              const [u, list, id] = k.split('/');
              if (u === uid && d._at.toMillis() > since && listeners.has(l)) { reads++; onDocs(list, [{ id, data: { ...d } }]); }
            }
            if (listeners.has(l)) onReady();
          }, 1);
          return () => listeners.delete(l);
        },
        async commit(diff) {
          await new Promise((r) => setTimeout(r, 2)); // the network
          for (const u of diff.upserts) {
            const k = key(u.list, u.id); const old = docs.get(k) || {};
            let data;
            if (u.list === 'goals' && !('saved' in u.data)) {
              // like the real adapter's transaction: add the change, or bring a deleted goal back whole
              if (docs.has(k) && !old._del) data = { ...old, ...u.data, _at: stamp(), saved: Math.round(((old.saved || 0) + (u.savedDelta || 0)) * 100) / 100 };
              else data = { ...u.data, saved: u.total || 0, _at: stamp() };
            } else data = { ...u.data, _at: stamp() };
            docs.set(k, data); tell(uid, u.list, u.id, data);
          }
          for (const d of diff.deletes) { const data = { _del: true, _at: stamp() }; docs.set(key(d.list, d.id), data); tell(uid, d.list, d.id, data); }
        },
        async getOne(list, id) { reads++; const d = docs.get(key(list, id)); return d ? { ...d } : null; },
        async deleteAll() { for (const k of [...docs.keys()]) if (k.startsWith(uid + '/')) docs.delete(k); },
      };
    },
  };
}

function device(cloud, { uid = 'u1', store = new Map(), confirm = true, now, ask } = {}) {
  const { L, close } = makeAppState(now);
  const hooks = {
    getState: () => L.state,
    setState: (s) => { L.state = s; },
    merge: (mine, theirs) => L.mergeStates(mine, L.migrate(JSON.parse(JSON.stringify(theirs)))).state,
    migrate: L.migrate,
    confirmMerge: ask || (async () => confirm),
    isOnline: () => true,
  };
  const keep = {
    load: (u) => (store.has('meta:' + u) ? JSON.parse(store.get('meta:' + u)) : null),
    save: (u, m) => store.set('meta:' + u, JSON.stringify(m)),
    clear: (u) => store.delete('meta:' + u),
    lastUid: () => store.get('last') || null,
    setLastUid: (u) => store.set('last', u),
  };
  let engine = null;
  const d = {
    L, store, get S() { return L.state; },
    async signIn(asUid = uid) { engine = createEngine({ api: cloud.adapter(asUid), hooks, store: keep, uid: asUid, debounceMs: 3, retryMs: 20, overlapMs: 0 }); await engine.start(); await settle(); },
    startSignIn(asUid = uid) { engine = createEngine({ api: cloud.adapter(asUid), hooks, store: keep, uid: asUid, debounceMs: 3, retryMs: 20, overlapMs: 0 }); return engine.start(); },
    get engine() { return engine; },
    edit(fn) { fn(L.state); engine.changed(); },
    signOut() { engine.stop(); }, // sync stopped (app closed, offline): the snapshot is kept
    signOutForGood(asUid = uid) { engine.stop(); forgetSync(keep, asUid); }, // the Sign out button
    close() { engine?.stop(); close(); },
  };
  return d;
}
const settle = () => new Promise((r) => setTimeout(r, 60));
const ids = (list) => [...list].map((x) => x.id).sort();
const tx = (id, amount, extra = {}) => ({ id, type: 'expense', amount, date: '2026-10-06', note: '', ...extra });

describe('sync: two devices, one account', () => {
  test('the first device uploads its data; a new device gets it without doubling the starter categories', async (t) => {
    const cloud = pretendCloud();
    const a = device(cloud); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    Object.assign(a.S.settings, { name: 'Kezara', currency: 'USD', symbol: '$', onboarded: true });
    a.S.transactions.push(tx('t1', 100, { categoryId: a.S.categories[0].id, accountId: a.S.accounts[0].id }));
    await a.signIn();
    assert.equal(cloud.count('u1', 'transactions'), 1);
    assert.equal(cloud.count('u1', 'categories'), a.S.categories.length);

    await b.signIn(); // b is a fresh install that hasn't been set up yet
    assert.equal(b.S.settings.name, 'Kezara');
    assert.equal(b.S.settings.onboarded, true);
    assert.equal(b.S.transactions.length, 1);
    assert.equal(b.S.categories.filter((c) => c.name === 'Food & groceries').length, 1);
    assert.equal(b.S.transactions[0].categoryId, a.S.transactions[0].categoryId, 'points at the same category');
    assert.equal(cloud.count('u1', 'categories'), a.S.categories.length, 'b did not upload a second set of categories');
  });

  test('adding, editing and deleting on one device shows up on the other', async (t) => {
    const cloud = pretendCloud();
    const a = device(cloud); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    a.S.settings.onboarded = true;
    await a.signIn(); await b.signIn();

    a.edit((s) => s.transactions.push(tx('t1', 250)));
    await settle();
    assert.deepEqual(ids(b.S.transactions), ['t1']);

    b.edit((s) => { s.transactions[0].amount = 300; });
    await settle();
    assert.equal(a.S.transactions[0].amount, 300);

    a.edit((s) => { s.transactions = []; });
    await settle();
    assert.equal(b.S.transactions.length, 0);
  });

  test('a device that was offline learns about deletions when it comes back', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const a = device(cloud); let b = device(cloud, { store }); t.after(() => { a.close(); b.close(); });
    a.S.transactions.push(tx('t1', 10), tx('t2', 20));
    await a.signIn(); await b.signIn();
    b.close(); // b is switched off
    a.edit((s) => { s.transactions = s.transactions.filter((x) => x.id !== 't1'); });
    await settle();
    const readsBefore = cloud.reads();
    const bState = JSON.parse(JSON.stringify(b.S));
    b = device(cloud, { store }); b.L.state = bState; // b starts again with its saved data
    await b.signIn();
    assert.deepEqual(ids(b.S.transactions), ['t2']);
    assert.ok(cloud.reads() - readsBefore <= 2, 'it only read what changed, not everything again');
  });

  test('money added to the same goal on two devices at once adds up', async (t) => {
    const cloud = pretendCloud();
    const a = device(cloud); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    a.S.goals.push({ id: 'g1', name: 'Bike', target: 5000, saved: 1000, deadline: '' });
    await a.signIn(); await b.signIn();
    a.edit((s) => { s.goals[0].saved = 1200; }); // +200
    b.edit((s) => { s.goals[0].saved = 1500; }); // +500, at the same moment
    await settle(); await settle();
    assert.equal(a.S.goals[0].saved, 1700);
    assert.equal(b.S.goals[0].saved, 1700);
  });

  test('when both devices edit the same transaction, they end up the same', async (t) => {
    const cloud = pretendCloud();
    const a = device(cloud); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    a.S.transactions.push(tx('t1', 100));
    await a.signIn(); await b.signIn();
    a.edit((s) => { s.transactions[0].note = 'from A'; });
    b.edit((s) => { s.transactions[0].note = 'from B'; });
    await settle(); await settle();
    assert.equal(a.S.transactions[0].note, b.S.transactions[0].note);
  });

  test('a scheduled payment posted on both devices is one transaction', async (t) => {
    const cloud = pretendCloud();
    const a = device(cloud); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    a.S.recurring.push({ id: 'r1', type: 'expense', amount: 50000, note: 'Rent', categoryId: a.S.categories[0].id, frequency: 'monthly', nextDate: '2026-10-01', anchorDay: 1, accountId: a.S.accounts[0].id, active: true });
    await a.signIn(); await b.signIn();
    a.edit(() => a.L.postDueRecurring());
    b.edit(() => b.L.postDueRecurring());
    await settle(); await settle();
    assert.deepEqual(ids(a.S.transactions), ['r1-2026-10-01']);
    assert.deepEqual(ids(b.S.transactions), ['r1-2026-10-01']);
    assert.equal(cloud.count('u1', 'transactions'), 1);
  });

  test('theme and backup reminder stay per device, currency is shared', async (t) => {
    const cloud = pretendCloud();
    const a = device(cloud); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    await a.signIn(); await b.signIn();
    a.edit((s) => { s.settings.theme = 'dark'; s.settings.currency = 'EUR'; s.settings.symbol = '€'; });
    await settle();
    assert.equal(b.S.settings.currency, 'EUR');
    assert.equal(b.S.settings.theme, 'system');
  });

  test('changes made while sync was stopped are sent when it starts again', async (t) => {
    const cloud = pretendCloud();
    const a = device(cloud); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    await a.signIn(); await b.signIn();
    a.signOut();
    a.S.transactions.push(tx('t5', 5));
    await a.signIn();
    assert.deepEqual(ids(b.S.transactions), ['t5']);
  });

  test('after signing out, erasing this device and signing in again deletes nothing in the account', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const a = device(cloud, { store }); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    a.S.transactions.push(tx('t1', 1), tx('t2', 2));
    await a.signIn(); await b.signIn();
    a.signOutForGood();
    a.L.state = a.L.defaultState(); // Settings → Erase all data, while signed out
    await a.signIn();
    assert.deepEqual(ids(a.S.transactions), ['t1', 't2'], 'the account data came back');
    assert.deepEqual(ids(b.S.transactions), ['t1', 't2'], 'nothing was deleted on the other device');
    assert.equal(cloud.count('u1', 'transactions'), 2);
  });

  test('after signing out, new data on this device is only added to the account if the person agrees', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const a = device(cloud, { store, confirm: false }); t.after(() => a.close());
    a.S.transactions.push(tx('t1', 1));
    await a.signIn(); a.signOutForGood();
    a.S.transactions.push(tx('guest', 50)); // someone else used the app while signed out
    await assert.rejects(() => a.signIn(), (e) => e.code === 'sync/cancelled');
    assert.ok(!cloud.docs.has('u1/transactions/guest'), 'not sent without asking');

    const again = device(cloud, { store, confirm: true }); t.after(() => again.close());
    again.L.state = a.S;
    await again.signIn();
    assert.ok(cloud.docs.has('u1/transactions/guest'), 'sent once the person said yes');
  });

  test("another account's data on this device is only added if the person agrees", async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const other = device(cloud, { uid: 'u2' }); t.after(() => other.close());
    other.S.transactions.push(tx('x1', 1));
    await other.signIn();

    const a = device(cloud, { uid: 'u1', store, confirm: false }); t.after(() => a.close());
    a.S.transactions.push(tx('mine', 7));
    await a.signIn('u1'); a.signOut();
    // now someone signs in to account u2 on this same device and says "no, don't add it"
    await assert.rejects(() => a.signIn('u2'), (e) => e.code === 'sync/cancelled');
    assert.equal(cloud.count('u2', 'transactions'), 1, 'u2 was not given this device’s data');
    assert.ok(!cloud.docs.has('u2/transactions/mine'));
  });
});

describe('sync: fixes from the bug review', () => {
  test('signing in to a NEW, empty account asks before adding the last account’s data to it', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const a = device(cloud, { store, confirm: false }); t.after(() => a.close());
    a.S.transactions.push(tx('private', 99));
    await a.signIn('u1'); a.signOut();
    await assert.rejects(() => a.signIn('u2'), (e) => e.code === 'sync/cancelled');
    assert.equal(cloud.count('u2', 'transactions'), 0, 'nothing of u1 went into u2');
    assert.equal(cloud.count('u2', 'categories'), 0);
  });

  test('nothing is sent while the person is still answering the question', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    let answer; const asked = new Promise((r) => { answer = r; });
    let opened; const questionOpen = new Promise((r) => { opened = r; });
    const a = device(cloud, { store, ask: () => { opened(); return asked; } }); t.after(() => a.close());
    a.S.transactions.push(tx('private', 99));
    await a.signIn('u1'); a.signOut();
    const starting = a.startSignIn('u2').catch((e) => e);
    await questionOpen;
    a.engine.push(); a.engine.changed(); // e.g. the internet came back while the question is open
    await settle();
    assert.equal(cloud.count('u2', 'transactions'), 0, 'not sent before answering');
    answer(false);
    assert.equal((await starting).code, 'sync/cancelled');
    await settle();
    assert.equal(cloud.count('u2', 'transactions'), 0, 'and not after answering no');
  });

  test('a goal deleted on one device and topped up on an offline one comes back with its whole amount', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const a = device(cloud); const b = device(cloud, { store }); t.after(() => { a.close(); b.close(); });
    a.S.goals.push({ id: 'g1', name: 'Bike', target: 5000, saved: 1000, deadline: '' });
    await a.signIn(); await b.signIn();
    b.signOut(); // b goes offline
    a.edit((s) => { s.goals = []; });
    await settle();
    b.S.goals[0].saved = 1200; // b adds 200 while offline
    await b.signIn();
    await settle();
    assert.equal(b.S.goals[0].saved, 1200, 'not just the 200');
    assert.equal(cloud.docs.get('u1/goals/g1').saved, 1200);
    assert.equal(a.S.goals[0].saved, 1200);
  });

  test('if the live connection breaks, it reconnects and changes keep arriving', async (t) => {
    const cloud = pretendCloud();
    const a = device(cloud); const b = device(cloud); t.after(() => { a.close(); b.close(); });
    await a.signIn(); await b.signIn();
    cloud.breakListeners('u1');
    await settle(); await settle();
    a.edit((s) => s.transactions.push(tx('after', 5)));
    await settle(); await settle();
    assert.deepEqual(ids(b.S.transactions), ['after']);
  });

  test('a payment posted by an offline device does not undo an edit or delete made on another device', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const a = device(cloud); const b = device(cloud, { store }); t.after(() => { a.close(); b.close(); });
    const rent = (s) => ({ id: 'r1', type: 'expense', amount: 50000, note: 'Rent', categoryId: s.categories[0].id, frequency: 'monthly', nextDate: '2026-10-01', anchorDay: 1, accountId: s.accounts[0].id, active: true });
    a.S.recurring.push(rent(a.S));
    await a.signIn(); await b.signIn();
    b.signOut(); // b is offline
    a.edit(() => a.L.postDueRecurring());
    await settle();
    a.edit((s) => { s.transactions[0].amount = 48000; }); // the rent was a bit less this month
    await settle();
    b.L.postDueRecurring(); // b posts the same rent by itself, with the old amount
    await b.signIn();
    await settle(); await settle();
    assert.equal(b.S.transactions.length, 1);
    assert.equal(b.S.transactions[0].amount, 48000, 'b took the edit');
    assert.equal(cloud.docs.get('u1/transactions/r1-2026-10-01').amount, 48000, 'and did not overwrite it');
  });

  test('sync notes saved by the older version are converted, so nothing is sent again or overwritten', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const a = device(cloud); const b = device(cloud, { store }); t.after(() => { a.close(); b.close(); });
    a.S.transactions.push(tx('t1', 100));
    await a.signIn(); await b.signIn();
    b.signOut();
    // turn b's notes into the old format: whole texts instead of fingerprints
    const meta = JSON.parse(store.get('meta:u1'));
    for (const k of Object.keys(meta.snapshot)) if (!k.startsWith('goals/')) meta.snapshot[k] = stable(k === 'settings/main'
      ? Object.fromEntries(Object.entries(b.S.settings).filter(([f]) => !['lastBackup', 'backupSnoozeUntil', 'theme', 'palette'].includes(f)))
      : b.S[k.split('/')[0]].find((x) => x.id === k.slice(k.indexOf('/') + 1)));
    store.set('meta:u1', JSON.stringify(meta));
    a.edit((s) => { s.transactions[0].amount = 250; }); // changed on a while b was closed
    await settle();
    await b.signIn();
    await settle();
    assert.equal(b.S.transactions[0].amount, 250, 'b took the newer edit');
    assert.equal(cloud.docs.get('u1/transactions/t1').amount, 250, 'and did not overwrite it with its old copy');
  });

  test('the sync notes are much smaller than the data itself', async (t) => {
    const cloud = pretendCloud(); const store = new Map();
    const a = device(cloud, { store }); t.after(() => a.close());
    for (let i = 0; i < 500; i++) a.S.transactions.push(tx('t' + i, i, { note: 'Groceries at the market, weekly shop' }));
    await a.signIn();
    const dataSize = JSON.stringify(a.S).length;
    const notesSize = store.get('meta:u1').length;
    assert.ok(notesSize < dataSize * 0.5, `notes ${notesSize} vs data ${dataSize}`);
  });
});

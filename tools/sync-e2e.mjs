/* End-to-end check of cloud sync against the REAL Firebase project (needs internet).
 * Not part of `npm test`. Run it after changing firestore.rules or the sync code:
 *
 *   node tools/sync-e2e.mjs
 *
 * It creates two throwaway accounts (sync-e2e-...@example.com), checks the security rules and
 * the sync adapter, then deletes both accounts and everything they wrote.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import * as F from 'firebase/firestore';

// The same settings and sync code the app uses.
const box = {}; vm.runInNewContext(fs.readFileSync(new URL('../web/firebase-config.js', import.meta.url), 'utf8'), { window: box });
const config = box.FIREBASE_CONFIG;
// Run in this same JavaScript world (not a sandbox): Firebase only accepts plain objects made here.
new Function(fs.readFileSync(new URL('../web/sync-core.js', import.meta.url), 'utf8'))();
const { makeFirestoreAdapter } = globalThis.PocketSync;

let n = 0;
const ok = (what) => console.log(`  ✔ ${++n}. ${what}`);
async function refused(what, promise) {
  try { await promise; } catch (e) { assert.equal(e.code, 'permission-denied', `${what}: expected permission-denied, got ${e.code}`); return ok(`refused: ${what}`); }
  throw new Error(`NOT refused: ${what}`);
}
async function device(name) {
  const app = initializeApp(config, name);
  return { app, auth: getAuth(app), db: F.initializeFirestore(app, { ignoreUndefinedProperties: true }) };
}
const pw = 'e2e-Test-' + Math.random().toString(36).slice(2) + '9';
const stamp = Date.now();

const a = await device('a'); const a2 = await device('a2'); const b = await device('b'); const guest = await device('guest');
const users = [];
try {
  console.log('Creating two throwaway accounts…');
  const ua = (await createUserWithEmailAndPassword(a.auth, `sync-e2e-a-${stamp}@example.com`, pw)).user; users.push(ua);
  const ub = (await createUserWithEmailAndPassword(b.auth, `sync-e2e-b-${stamp}@example.com`, pw)).user; users.push(ub);
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  await signInWithEmailAndPassword(a2.auth, ua.email, pw); // the same account on a second "device"

  const A = makeFirestoreAdapter(F, a.db, ua.uid, 'dev-a');
  const A2 = makeFirestoreAdapter(F, a2.db, ua.uid, 'dev-a2');

  console.log('Sync adapter:');
  await A.commit({ upserts: [
    { list: 'transactions', id: 't1', data: { id: 't1', type: 'expense', amount: 500, date: '2026-10-07', note: 'e2e' } },
    { list: 'goals', id: 'g1', data: { id: 'g1', name: 'Bike', target: 5000, saved: 1000, deadline: '' } },
    { list: 'settings', id: 'main', data: { currency: 'LKR', symbol: 'Rs', onboarded: true } },
  ], deletes: [] });
  ok('device A uploaded a transaction, a goal and settings');

  const all = await A2.fetchAll();
  assert.equal(all.records.transactions.t1.amount, 500);
  assert.equal(all.settings.currency, 'LKR');
  assert.ok(all.maxAt > 0);
  ok('device A2 (same account) downloaded them');

  const heard = new Promise((resolve) => {
    const stop = A2.listen(all.maxAt, (list, docs) => { if (list === 'transactions' && docs.some((d) => d.id === 't2')) { stop(); resolve(docs); } }, (e) => { stop(); resolve(e); });
  });
  await A.commit({ upserts: [{ list: 'transactions', id: 't2', data: { id: 't2', type: 'income', amount: 9000, date: '2026-10-07', note: '' } }], deletes: [] });
  const docs = await heard;
  assert.ok(Array.isArray(docs), 'listener error: ' + docs?.code);
  ok('device A2 heard about a new transaction from A, live');

  await Promise.all([
    A.commit({ upserts: [{ list: 'goals', id: 'g1', data: { id: 'g1', name: 'Bike', target: 5000, deadline: '' }, savedDelta: 200 }], deletes: [] }),
    A2.commit({ upserts: [{ list: 'goals', id: 'g1', data: { id: 'g1', name: 'Bike', target: 5000, deadline: '' }, savedDelta: 500 }], deletes: [] }),
  ]);
  assert.equal((await A.getOne('goals', 'g1')).saved, 1700);
  ok('+200 and +500 sent to a goal at the same time = 1700');

  await A.commit({ upserts: [], deletes: [{ list: 'transactions', id: 't1' }] });
  const after = await A2.fetchAll();
  assert.equal(after.records.transactions.t1, undefined);
  ok('a deleted transaction is gone for the other device');

  // A goal deleted on one device while another (offline) device added money comes back with the whole amount.
  await A.commit({ upserts: [], deletes: [{ list: 'goals', id: 'g1' }] });
  await A2.commit({ upserts: [{ list: 'goals', id: 'g1', data: { id: 'g1', name: 'Bike', target: 5000, deadline: '' }, savedDelta: 200, total: 1900 }], deletes: [] });
  assert.equal((await A.getOne('goals', 'g1')).saved, 1900);
  assert.equal((await A.getOne('goals', 'g1'))._del, undefined);
  ok('a deleted goal topped up on another device comes back with its whole amount (1900, not 200)');

  const readyAfter = await new Promise((resolve) => { const t0 = Date.now(); const stop = A2.listen(0, () => {}, (e) => resolve(e), () => { stop(); resolve(Date.now() - t0); }); });
  assert.equal(typeof readyAfter, 'number', 'listener error: ' + readyAfter?.code);
  ok(`the listener says it is ready once it has sent what was there (${readyAfter} ms)`);

  console.log('Security rules:');
  const theirs = F.doc(b.db, 'users', ua.uid, 'transactions', 't2');
  await refused('B reads A’s transaction', F.getDoc(theirs));
  await refused('B lists A’s transactions', F.getDocs(F.collection(b.db, 'users', ua.uid, 'transactions')));
  await refused('B writes into A’s folder', F.setDoc(theirs, { amount: 1, _at: F.serverTimestamp() }));
  await refused('B deletes A’s transaction', F.deleteDoc(theirs));
  await refused('a signed-out visitor reads A’s data', F.getDoc(F.doc(guest.db, 'users', ua.uid, 'transactions', 't2')));
  await refused('A writes with a made-up time', F.setDoc(F.doc(a.db, 'users', ua.uid, 'transactions', 'x'), { amount: 1, _at: F.Timestamp.fromMillis(Date.now() + 1e9) }));
  await refused('A writes without a time', F.setDoc(F.doc(a.db, 'users', ua.uid, 'transactions', 'x'), { amount: 1 }));
  await refused('A writes outside the app’s folders', F.setDoc(F.doc(a.db, 'users', ua.uid, 'secrets', 'x'), { v: 1, _at: F.serverTimestamp() }));
  await refused('A writes at the top level', F.setDoc(F.doc(a.db, 'anything', 'x'), { v: 1, _at: F.serverTimestamp() }));
} finally {
  console.log('Cleaning up…');
  for (const [u, d] of [[users[0], a], [users[1], b]]) {
    if (!u) continue;
    try { await makeFirestoreAdapter(F, d.db, u.uid, 'cleanup').deleteAll(); } catch (e) { console.warn('  could not delete data', e.code); }
    try { await deleteUser(u); } catch (e) { console.warn('  could not delete account', e.code); }
  }
  for (const d of [a, a2, b, guest]) await deleteApp(d.app).catch(() => {});
}
console.log(`All ${n} checks passed.`);
process.exit(0);

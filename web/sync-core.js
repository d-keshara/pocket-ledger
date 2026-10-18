/* Sync core: works out what changed on this device since the last sync.
 * No internet and no Firebase in here, just plain functions, so they are easy to test (tests/sync.test.mjs).
 *
 * The idea: after each sync we keep a "snapshot", a copy of every record as text, keyed by "list/id".
 * Comparing the snapshot with the data now gives what was added, changed or deleted.
 * That way the screens in app.js don't have to report their changes; sync finds them by itself.
 */
(function (root) {
  // The lists of records that sync. Each record has an id.
  const LISTS = ['accounts', 'categories', 'transactions', 'budgets', 'goals', 'recurring'];
  // Settings that belong to one device only: the backup reminder and the light/dark choice.
  const LOCAL_SETTINGS = ['lastBackup', 'backupSnoozeUntil', 'theme'];

  /* JSON with keys in a fixed order, so {a,b} and {b,a} give the same text and don't look "changed". */
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort()
        .map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    }
    return JSON.stringify(v);
  }

  function sharedSettings(settings) {
    const out = { ...settings };
    for (const k of LOCAL_SETTINGS) delete out[k];
    return out;
  }

  /* Every record as text: { "transactions/t1": "{...}", ..., "settings/main": "{...}" } */
  function snapshotOf(state) {
    const snap = {};
    for (const list of LISTS) for (const item of state[list] || []) snap[list + '/' + item.id] = stable(item);
    snap['settings/main'] = stable(sharedSettings(state.settings || {}));
    return snap;
  }

  /* What changed between the snapshot and the state now:
   *   upserts: records to write (new or changed). For a goal that already existed, `saved` is
   *            left out and its change is in `savedDelta` instead, so two devices adding money
   *            to the same goal add up instead of one overwriting the other.
   *   deletes: records that are gone.
   * Nothing here changes the state or the snapshot. */
  function diffState(snapshot, state) {
    const now = snapshotOf(state);
    const upserts = []; const deletes = [];
    for (const key of Object.keys(now)) {
      if (now[key] === snapshot[key]) continue;
      const [list, id] = splitKey(key);
      const data = JSON.parse(now[key]);
      const change = { list, id, data };
      if (list === 'goals' && snapshot[key] !== undefined) {
        const before = JSON.parse(snapshot[key]);
        const delta = round2((+data.saved || 0) - (+before.saved || 0));
        delete data.saved;
        if (delta) change.savedDelta = delta;
        // Only the amount changed and it changed by 0? Then nothing to send.
        if (!delta && stable(data) === stable(withoutSaved(before))) continue;
      }
      upserts.push(change);
    }
    for (const key of Object.keys(snapshot)) {
      if (!(key in now)) { const [list, id] = splitKey(key); deletes.push({ list, id }); }
    }
    return { upserts, deletes };
  }

  // "transactions/r1-2026-10-01" -> ["transactions", "r1-2026-10-01"] (ids may contain "-" but never "/")
  function splitKey(key) { const i = key.indexOf('/'); return [key.slice(0, i), key.slice(i + 1)]; }
  function withoutSaved(goal) { const g = { ...goal }; delete g.saved; return g; }
  function round2(n) { return Math.round((+n || 0) * 100) / 100 || 0; }

  root.PocketSync = { LISTS, LOCAL_SETTINGS, stable, snapshotOf, diffState };
})(typeof window !== 'undefined' ? window : globalThis);

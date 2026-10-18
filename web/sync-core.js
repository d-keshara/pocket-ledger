/* Sync core: works out what changed on this device since the last sync.
 * No internet and no Firebase in here, just plain functions, so they are easy to test (tests/sync.test.mjs).
 *
 * The idea: after each sync we keep a "snapshot", a short fingerprint of every record, keyed by "list/id".
 * Comparing the snapshot with the data now gives what was added, changed or deleted.
 * (Goals keep their full text instead of a fingerprint, because their saved amount is needed.)
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

  /* A short fingerprint of a text (53-bit "cyrb53" hash), so the snapshot stays small.
     Starts with "#" so it can never be mistaken for a record's text. */
  function hash(str) {
    let h1 = 0xdeadbeef; let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return '#' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  // What the snapshot keeps for a record: goals keep their text (the saved amount is needed), the rest a fingerprint.
  const sig = (key, text) => (key.startsWith('goals/') ? text : hash(text));
  const parseGoal = (text) => { try { return JSON.parse(text); } catch { return {}; } };

  function sharedSettings(settings) {
    const out = { ...settings };
    for (const k of LOCAL_SETTINGS) delete out[k];
    return out;
  }

  /* Every record as text: { "transactions/t1": "{...}", ..., "settings/main": "{...}" } */
  function textOf(state) {
    const text = {};
    for (const list of LISTS) for (const item of state[list] || []) text[list + '/' + item.id] = stable(item);
    text['settings/main'] = stable(sharedSettings(state.settings || {}));
    return text;
  }
  /* The snapshot of a state: { "transactions/t1": "#k3j9...", "goals/g1": "{...}", ... } */
  function snapshotOf(state) {
    const snap = textOf(state);
    for (const key of Object.keys(snap)) snap[key] = sig(key, snap[key]);
    return snap;
  }

  /* What changed between the snapshot and the state now:
   *   upserts: records to write (new or changed). For a goal that already existed, `saved` is
   *            left out and its change is in `savedDelta` instead, so two devices adding money
   *            to the same goal add up instead of one overwriting the other.
   *   deletes: records that are gone.
   * Nothing here changes the state or the snapshot. */
  function diffState(snapshot, state) {
    const now = textOf(state);
    const upserts = []; const deletes = [];
    for (const key of Object.keys(now)) {
      if (sig(key, now[key]) === snapshot[key]) continue;
      const [list, id] = splitKey(key);
      const data = JSON.parse(now[key]);
      const change = { list, id, data };
      if (list === 'goals' && snapshot[key] !== undefined) {
        const before = parseGoal(snapshot[key]);
        const delta = round2((+data.saved || 0) - (+before.saved || 0));
        // The whole amount too, in case the goal was deleted on another device meanwhile (see commit()).
        change.total = round2(+data.saved || 0);
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

  /* ================= applying what came from the cloud ================= */
  const SETTINGS_KEY = 'settings/main';
  // Fields starting with "_" are sync bookkeeping (_at = when, _dev = which device, _del = deleted), not app data.
  function strip(data) { const o = {}; for (const k of Object.keys(data || {})) if (k[0] !== '_') o[k] = data[k]; return o; }
  function localOnly(settings) { const o = {}; for (const k of LOCAL_SETTINGS) if (settings && k in settings) o[k] = settings[k]; return o; }

  /* One record from the cloud (`remote`, or null if it was deleted there). Changes `state` and `snapshot`.
   * Rule: if this device changed the record since the last sync, this device's version wins; it will be
   * sent up next and overwrite the cloud. Otherwise the cloud's version is taken.
   * Exception: a scheduled payment this device just posted by itself (auto: true, never synced) is the
   * same payment another device already posted, maybe edited or deleted there since; the cloud wins.
   * Returns true if `state` changed (so the screen should be redrawn). */
  function applyRemote(state, snapshot, list, id, remote) {
    const key = list + '/' + id;
    if (key === SETTINGS_KEY) {
      const localStr = stable(sharedSettings(state.settings || {}));
      if (sig(key, localStr) !== snapshot[key] || !remote) return false;
      const rStr = stable(sharedSettings(remote));
      snapshot[key] = sig(key, rStr);
      if (rStr === localStr) return false;
      state.settings = { ...sharedSettings(remote), ...localOnly(state.settings) };
      return true;
    }
    const arr = state[list]; if (!Array.isArray(arr)) return false;
    const i = arr.findIndex((x) => x.id === id);
    const localStr = i >= 0 ? stable(arr[i]) : undefined;
    const justPosted = i >= 0 && snapshot[key] === undefined && arr[i].auto === true;
    if ((localStr === undefined ? undefined : sig(key, localStr)) !== snapshot[key] && !justPosted) return false; // changed here too: ours wins
    if (!remote) { delete snapshot[key]; if (i >= 0) arr.splice(i, 1); return i >= 0; }
    const rec = { ...remote, id }; const rStr = stable(rec);
    snapshot[key] = sig(key, rStr);
    if (rStr === localStr) return false;
    if (i >= 0) arr[i] = rec; else arr.push(rec);
    return true;
  }

  /* After a diff was saved in the cloud, the snapshot now matches what was sent. */
  function commitSnapshot(snapshot, diff) {
    for (const u of diff.upserts) {
      const key = u.list + '/' + u.id;
      if (u.list === 'goals' && !('saved' in u.data)) {
        // The amount went up as a change (+200), so add it to what the cloud had.
        const before = snapshot[key] ? parseGoal(snapshot[key]) : {};
        snapshot[key] = stable({ ...u.data, saved: round2((+before.saved || 0) + (u.savedDelta || 0)) });
      } else snapshot[key] = sig(key, stable(u.data));
    }
    for (const d of diff.deletes) delete snapshot[d.list + '/' + d.id];
  }

  /* Splits a big diff (e.g. the first upload of 3000 transactions) into parts of `size` writes. */
  function chunkDiff(diff, size) {
    const all = [...diff.upserts.map((u) => ['u', u]), ...diff.deletes.map((d) => ['d', d])];
    const parts = [];
    for (let i = 0; i < all.length; i += size) {
      const part = all.slice(i, i + size);
      parts.push({ upserts: part.filter(([k]) => k === 'u').map(([, x]) => x), deletes: part.filter(([k]) => k === 'd').map(([, x]) => x) });
    }
    return parts;
  }

  /* The cloud's records as an app state, exactly as they are (no default categories added). */
  function remoteToState(remote, localSettings) {
    const s = { version: 1, settings: { ...(remote.settings || {}), ...localOnly(localSettings) } };
    for (const list of LISTS) s[list] = Object.entries(remote.records[list] || {}).map(([id, r]) => ({ ...r, id }));
    return s;
  }

  /* ================= the sync engine =================
   * Knows nothing about Firebase: it talks to the cloud through `api` (see makeFirestoreAdapter below),
   * and to the app through `hooks`: getState(), setState(state), merge(mine, theirs), migrate(state),
   * confirmMerge() -> Promise<boolean>, isOnline().
   * `api.listen` calls onReady once it has sent what was already in the cloud; only then does this
   * device send its own changes, so it hears about other devices' edits and deletions first.
   * `store` keeps the snapshot between runs: load(uid), save(uid, meta), lastUid(), setLastUid(uid). */
  const OVERLAP_MS = 2 * 60 * 1000; // ask again for changes from just before the last one seen, in case of clock edges
  const BATCH = 400;                // Firestore allows 500 writes in one batch

  function createEngine({ api, hooks, store, uid, onStatus = () => {}, debounceMs = 1200, retryMs = 30000, overlapMs = OVERLAP_MS, readyTimeoutMs = 15000 }) {
    let meta = null; let running = false; let unlisten = null; let live = false; let relisten = null;
    let pushing = false; let pushAgain = false; let timer = null; let retry = null; let offlineTimer = null;
    const status = { state: 'starting', lastSynced: 0, error: null };
    const set = (state, error = null) => {
      Object.assign(status, { state, error }); if (state === 'synced') status.lastSynced = Date.now();
      onStatus({ ...status });
    };
    let metaTimer = null;
    const saveMeta = () => { clearTimeout(metaTimer); metaTimer = setTimeout(() => { try { store.save(uid, meta); } catch (e) { console.warn('Could not keep sync state', e); } }, 300); };
    const saveMetaNow = () => { clearTimeout(metaTimer); try { store.save(uid, meta); } catch (e) { console.warn('Could not keep sync state', e); } };
    const toMs = (data) => (data && data._at && typeof data._at.toMillis === 'function' ? data._at.toMillis() : 0);

    /* Changes from other devices (or the first download). */
    function onRemote(list, docs) {
      if (!running) return;
      const state = hooks.getState(); let changed = false;
      for (const { id, data } of docs) {
        meta.since = Math.max(meta.since || 0, toMs(data));
        changed = applyRemote(state, meta.snapshot, list, id, data && !data._del ? strip(data) : null) || changed;
      }
      if (changed) hooks.setState(state);
      saveMeta();
    }

    /* The first sync of this account on this device. Returns false if it was stopped (signed out) meanwhile.
       `meta` stays empty until the very end, so nothing can be sent while the person is still deciding. */
    async function firstSync() {
      set('syncing');
      const remote = await api.fetchAll();
      if (!running) return false;
      // This device has data from a different account? Only add it to this one if the person says so,
      // also when this account is still empty (a new account on a shared device).
      const local = hooks.getState();
      const hasLocalData = ['transactions', 'goals', 'budgets', 'recurring'].some((l) => (local[l] || []).length);
      const last = store.lastUid();
      if (last && last !== uid && hasLocalData) {
        const yes = await hooks.confirmMerge();
        if (!running) return false;
        if (!yes) { const e = new Error('The person chose not to merge'); e.code = 'sync/cancelled'; throw e; }
      }
      const next = { snapshot: {}, since: remote.maxAt || 0 };
      const hasRemote = !!remote.settings || LISTS.some((l) => Object.keys(remote.records[l] || {}).length);
      if (hasRemote) {
        const mine = hooks.getState(); // read again: it may have changed while the question was open
        const raw = remoteToState(remote, mine.settings);
        next.snapshot = snapshotOf(raw); // exactly what the cloud has
        // The account is "mine" (its ids are kept), this device's data is added to it. Nothing is deleted.
        const merged = hooks.merge(hooks.migrate(JSON.parse(JSON.stringify(raw))), mine);
        // No settings in the cloud yet (an upload was cut short)? Keep this device's, they go up next.
        merged.settings = remote.settings ? { ...merged.settings, ...localOnly(mine.settings) } : { ...mine.settings };
        hooks.setState(merged);
      }
      meta = next;
      saveMetaNow(); store.setLastUid(uid);
      return true;
    }

    /* Listens for changes from the cloud. If the connection breaks, it listens again a bit later. */
    function listen() {
      return new Promise((resolve) => {
        let done = false;
        const ready = () => { if (done) return; done = true; clearTimeout(slow); live = true; resolve(); push(); };
        const slow = setTimeout(ready, readyTimeoutMs); // offline: don't wait forever
        unlisten = api.listen(Math.max(0, (meta.since || 0) - overlapMs), onRemote, (e) => {
          console.error('Sync listener stopped', e);
          if (!running) return;
          set('error', e);
          if (unlisten) { try { unlisten(); } catch { /* already closed */ } unlisten = null; }
          clearTimeout(relisten);
          relisten = setTimeout(() => { if (running && !unlisten) listen(); }, retryMs);
          ready();
        }, ready);
      });
    }

    async function start() {
      running = true;
      meta = store.load(uid);
      if (meta && meta.snapshot) {
        // Notes saved by an older version kept whole texts: turn them into fingerprints (same result as now).
        for (const [key, v] of Object.entries(meta.snapshot)) if (!key.startsWith('goals/') && v[0] !== '#') meta.snapshot[key] = hash(v);
      }
      if (!meta || !meta.snapshot) { meta = null; if (!(await firstSync())) return; }
      if (!running) return;
      await listen();
    }

    function stop() {
      running = false; live = false;
      if (unlisten) { try { unlisten(); } catch { /* already closed */ } }
      unlisten = null; clearTimeout(timer); clearTimeout(retry); clearTimeout(offlineTimer); clearTimeout(relisten);
      if (meta) saveMetaNow();
    }

    /* Sends this device's changes. Runs one at a time; changes made meanwhile go in the next round. */
    async function push() {
      if (!running || !meta) return;
      if (!live) { pushAgain = true; return; } // still hearing what's in the cloud: send afterwards
      if (pushing) { pushAgain = true; return; }
      pushing = true; clearTimeout(retry);
      try {
        for (let round = 0; round < 20 && running; round++) {
          pushAgain = false;
          const diff = diffState(meta.snapshot, hooks.getState());
          if (!diff.upserts.length && !diff.deletes.length) break;
          set('syncing');
          clearTimeout(offlineTimer);
          offlineTimer = setTimeout(() => { if (pushing && !hooks.isOnline()) set('offline'); }, 3000);
          for (const part of chunkDiff(diff, BATCH)) {
            await api.commit(part);
            if (!running) return;
            commitSnapshot(meta.snapshot, part); saveMeta();
          }
          // Another device may have added money to the same goal at the same moment: read the real total.
          for (const u of diff.upserts) {
            if (u.list === 'goals' && u.savedDelta) { const data = await api.getOne('goals', u.id); if (data) onRemote('goals', [{ id: u.id, data }]); }
          }
          if (!pushAgain) break;
        }
        clearTimeout(offlineTimer);
        if (running) set('synced');
      } catch (e) {
        clearTimeout(offlineTimer);
        console.error('Sync upload failed', e);
        if (running) { set(hooks.isOnline() ? 'error' : 'offline', e); retry = setTimeout(push, retryMs); }
      } finally {
        pushing = false;
        if (pushAgain && running) push();
      }
    }

    function changed() { if (!running) return; clearTimeout(timer); timer = setTimeout(push, debounceMs); }

    return { start, stop, changed, push, status: () => ({ ...status }), get meta() { return meta; } };
  }

  /* ================= Firestore ================= *
   * F = the Firestore functions (from vendor/firebase/firebase-firestore.js in the app, or the
   * "firebase/firestore" package in the test script). Layout in the cloud:
   *   users/{uid}/{list}/{id}   one document per record
   *   users/{uid}/meta/settings the shared settings */
  function makeFirestoreAdapter(F, db, uid, deviceId) {
    const ref = (list, id) => (list === 'settings' ? F.doc(db, 'users', uid, 'meta', 'settings') : F.doc(db, 'users', uid, list, id));
    const col = (list) => F.collection(db, 'users', uid, list);
    const ms = (d) => (d && d._at && d._at.toMillis ? d._at.toMillis() : 0);
    return {
      async fetchAll() {
        const records = {}; let maxAt = 0;
        for (const list of LISTS) {
          records[list] = {};
          (await F.getDocs(col(list))).forEach((d) => { const data = d.data(); maxAt = Math.max(maxAt, ms(data)); if (!data._del) records[list][d.id] = strip(data); });
        }
        const s = await F.getDoc(ref('settings'));
        let settings = null;
        if (s.exists()) { const data = s.data(); maxAt = Math.max(maxAt, ms(data)); if (!data._del) settings = strip(data); }
        return { records, settings, maxAt };
      },
      /* Only asks for records changed after `sinceMs`, so each start reads just what's new (cheaper).
         onReady runs once every list has sent what it already had. */
      listen(sinceMs, onDocs, onError, onReady = () => {}) {
        const after = F.Timestamp.fromMillis(sinceMs);
        let waiting = LISTS.length + 1;
        const first = new Set();
        const arrived = (name) => { if (!first.has(name)) { first.add(name); if (--waiting === 0) onReady(); } };
        const stops = LISTS.map((list) => F.onSnapshot(F.query(col(list), F.where('_at', '>', after)), (snap) => {
          const docs = [];
          snap.docChanges().forEach((ch) => { if (ch.type !== 'removed' && !ch.doc.metadata.hasPendingWrites) docs.push({ id: ch.doc.id, data: ch.doc.data() }); });
          if (docs.length) onDocs(list, docs);
          arrived(list);
        }, onError));
        stops.push(F.onSnapshot(ref('settings'), (s) => {
          if (s.exists() && !s.metadata.hasPendingWrites) onDocs('settings', [{ id: 'main', data: s.data() }]);
          arrived('settings');
        }, onError));
        return () => stops.forEach((f) => f());
      },
      async commit(diff) {
        const b = F.writeBatch(db);
        const stamp = () => ({ _at: F.serverTimestamp(), _dev: deviceId });
        const goals = [];
        for (const u of diff.upserts) {
          if (u.list === 'goals' && !('saved' in u.data)) goals.push(u);
          else b.set(ref(u.list, u.id), { ...u.data, ...stamp() });
        }
        // A deleted record leaves a small marker, so devices that were offline also learn it was deleted.
        for (const d of diff.deletes) b.set(ref(d.list, d.id), { _del: true, ...stamp() });
        await b.commit();
        // A goal that already existed: send only the change in the amount, so Firestore adds it to whatever
        // total is there (two devices adding money at once both count). But if the goal was deleted on another
        // device meanwhile, bring it back with this device's whole amount, not just the change.
        for (const u of goals) {
          await F.runTransaction(db, async (tx) => {
            const r = ref(u.list, u.id); const snap = await tx.get(r);
            if (snap.exists() && !snap.data()._del) tx.set(r, { ...u.data, ...stamp(), ...(u.savedDelta ? { saved: F.increment(u.savedDelta) } : {}) }, { merge: true });
            else tx.set(r, { ...u.data, saved: u.total || 0, ...stamp() });
          });
        }
      },
      async getOne(list, id) { const s = await F.getDoc(ref(list, id)); return s.exists() ? s.data() : null; },
      /* Removes everything in this account (used when deleting the account). */
      async deleteAll() {
        const refs = [];
        for (const list of [...LISTS, 'meta']) (await F.getDocs(col(list))).forEach((d) => refs.push(d.ref));
        for (let i = 0; i < refs.length; i += BATCH) {
          const b = F.writeBatch(db); refs.slice(i, i + BATCH).forEach((r) => b.delete(r)); await b.commit();
        }
      },
    };
  }

  root.PocketSync = {
    LISTS, LOCAL_SETTINGS, SETTINGS_KEY, stable, hash, snapshotOf, diffState,
    strip, applyRemote, commitSnapshot, chunkDiff, remoteToState, createEngine, makeFirestoreAdapter,
  };
})(typeof window !== 'undefined' ? window : globalThis);

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

  /* ================= applying what came from the cloud ================= */
  const SETTINGS_KEY = 'settings/main';
  // Fields starting with "_" are sync bookkeeping (_at = when, _dev = which device, _del = deleted), not app data.
  function strip(data) { const o = {}; for (const k of Object.keys(data || {})) if (k[0] !== '_') o[k] = data[k]; return o; }
  function localOnly(settings) { const o = {}; for (const k of LOCAL_SETTINGS) if (settings && k in settings) o[k] = settings[k]; return o; }

  /* One record from the cloud (`remote`, or null if it was deleted there). Changes `state` and `snapshot`.
   * Rule: if this device changed the record since the last sync, this device's version wins; it will be
   * sent up next and overwrite the cloud. Otherwise the cloud's version is taken.
   * Returns true if `state` changed (so the screen should be redrawn). */
  function applyRemote(state, snapshot, list, id, remote) {
    const key = list + '/' + id;
    if (key === SETTINGS_KEY) {
      const localStr = stable(sharedSettings(state.settings || {}));
      if (localStr !== snapshot[key] || !remote) return false;
      const rStr = stable(sharedSettings(remote));
      snapshot[key] = rStr;
      if (rStr === localStr) return false;
      state.settings = { ...sharedSettings(remote), ...localOnly(state.settings) };
      return true;
    }
    const arr = state[list]; if (!Array.isArray(arr)) return false;
    const i = arr.findIndex((x) => x.id === id);
    const localStr = i >= 0 ? stable(arr[i]) : undefined;
    if (localStr !== snapshot[key]) return false; // changed here too: ours wins and goes up next
    if (!remote) { delete snapshot[key]; if (i >= 0) arr.splice(i, 1); return i >= 0; }
    const rec = { ...remote, id }; const rStr = stable(rec);
    snapshot[key] = rStr;
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
        const before = snapshot[key] ? JSON.parse(snapshot[key]) : {};
        snapshot[key] = stable({ ...u.data, saved: round2((+before.saved || 0) + (u.savedDelta || 0)) });
      } else snapshot[key] = stable(u.data);
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
   * `store` keeps the snapshot between runs: load(uid), save(uid, meta), lastUid(), setLastUid(uid). */
  const OVERLAP_MS = 2 * 60 * 1000; // ask again for changes from just before the last one seen, in case of clock edges
  const BATCH = 400;                // Firestore allows 500 writes in one batch

  function createEngine({ api, hooks, store, uid, onStatus = () => {}, debounceMs = 1200, retryMs = 30000, overlapMs = OVERLAP_MS }) {
    let meta = null; let running = false; let unlisten = null;
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

    async function firstSync() {
      set('syncing');
      const remote = await api.fetchAll();
      const local = hooks.getState();
      const hasRemote = !!remote.settings || LISTS.some((l) => Object.keys(remote.records[l] || {}).length);
      meta = { snapshot: {}, since: remote.maxAt || 0 };
      if (hasRemote) {
        // Data from a different account on this device? Only add it to this account if the person says so.
        const last = store.lastUid();
        if (last && last !== uid && (local.transactions || []).length && !(await hooks.confirmMerge())) {
          const e = new Error('The person chose not to merge'); e.code = 'sync/cancelled'; throw e;
        }
        const raw = remoteToState(remote, local.settings);
        meta.snapshot = snapshotOf(raw); // exactly what the cloud has
        // The account is "mine" (its ids are kept), this device's data is added to it. Nothing is deleted.
        const merged = hooks.merge(hooks.migrate(JSON.parse(JSON.stringify(raw))), local);
        // No settings in the cloud yet (an upload was cut short)? Keep this device's, they go up next.
        merged.settings = remote.settings ? { ...merged.settings, ...localOnly(local.settings) } : { ...local.settings };
        hooks.setState(merged);
      }
      saveMetaNow(); store.setLastUid(uid);
    }

    async function start() {
      running = true;
      meta = store.load(uid);
      if (!meta || !meta.snapshot) await firstSync();
      if (!running) return;
      unlisten = api.listen(Math.max(0, (meta.since || 0) - overlapMs), onRemote, (e) => { console.error('Sync listener', e); set('error', e); });
      await push();
    }

    function stop() {
      running = false;
      if (unlisten) { try { unlisten(); } catch { /* already closed */ } }
      unlisten = null; clearTimeout(timer); clearTimeout(retry); clearTimeout(offlineTimer);
      if (meta) saveMetaNow();
    }

    /* Sends this device's changes. Runs one at a time; changes made meanwhile go in the next round. */
    async function push() {
      if (!running || !meta) return;
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
      /* Only asks for records changed after `sinceMs`, so each start reads just what's new (cheaper). */
      listen(sinceMs, onDocs, onError) {
        const after = F.Timestamp.fromMillis(sinceMs);
        const stops = LISTS.map((list) => F.onSnapshot(F.query(col(list), F.where('_at', '>', after)), (snap) => {
          const docs = [];
          snap.docChanges().forEach((ch) => { if (ch.type !== 'removed' && !ch.doc.metadata.hasPendingWrites) docs.push({ id: ch.doc.id, data: ch.doc.data() }); });
          if (docs.length) onDocs(list, docs);
        }, onError));
        stops.push(F.onSnapshot(ref('settings'), (s) => {
          if (s.exists() && !s.metadata.hasPendingWrites) onDocs('settings', [{ id: 'main', data: s.data() }]);
        }, onError));
        return () => stops.forEach((f) => f());
      },
      async commit(diff) {
        const b = F.writeBatch(db);
        const stamp = () => ({ _at: F.serverTimestamp(), _dev: deviceId });
        for (const u of diff.upserts) {
          if (u.list === 'goals' && !('saved' in u.data)) {
            // Only the change in the amount is sent: Firestore adds it to whatever total is there.
            const data = { ...u.data, ...stamp(), _del: F.deleteField() };
            if (u.savedDelta) data.saved = F.increment(u.savedDelta);
            b.set(ref(u.list, u.id), data, { merge: true });
          } else b.set(ref(u.list, u.id), { ...u.data, ...stamp() });
        }
        // A deleted record leaves a small marker, so devices that were offline also learn it was deleted.
        for (const d of diff.deletes) b.set(ref(d.list, d.id), { _del: true, ...stamp() });
        await b.commit();
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
    LISTS, LOCAL_SETTINGS, SETTINGS_KEY, stable, snapshotOf, diffState,
    strip, applyRemote, commitSnapshot, chunkDiff, remoteToState, createEngine, makeFirestoreAdapter,
  };
})(typeof window !== 'undefined' ? window : globalThis);

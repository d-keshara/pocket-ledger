/* Cloud account for sync: create an account, sign in, sign out, reset a password, delete the account.
 *
 * Safety rules (the app must work exactly as before for people who never sign in):
 *   - Firebase is loaded only when someone opens the sign-in form, or has signed in on this device before.
 *   - Every Firebase call is wrapped: if it fails (no internet, blocked, a bug), the app keeps working.
 *   - app.js only talks to window.PocketCloud. If this file is missing, the Sync section simply isn't shown.
 *
 * The syncing itself (what changed, what to send, what to take from the cloud) is in sync-core.js.
 * This file connects it to Firebase and keeps its notes in localStorage between runs.
 */
(function () {
  const FLAG = 'pocket-ledger-cloud'; // in localStorage: "1" once someone signed in on this device
  const config = window.FIREBASE_CONFIG;

  let fb = null;        // { auth, A } once Firebase is loaded; A = the Firebase Auth functions
  let loading = null;   // the Promise while loading, so two callers don't load it twice
  let user = null;      // the signed-in Firebase user, or null
  let status = 'off';   // 'off' (never loaded) | 'loading' | 'ready' | 'error'
  const listeners = new Set();

  // Data sync
  let hooks = null;     // how to read and change the app's data, given by app.js through attach()
  let engine = null;    // the running sync (PocketSync.createEngine), while signed in
  let firestore = null; // { F, db } once loaded
  let retryStart = null;
  let sync = { state: 'off', lastSynced: 0, error: null }; // shown in Settings
  const Core = window.PocketSync;
  const local = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { console.warn('localStorage is full or blocked', e); } },
    del: (k) => { try { localStorage.removeItem(k); } catch { /* blocked */ } },
  };
  // A random name for this device, so each change in the cloud says which device made it.
  const deviceId = local.get('pocket-ledger-device') || (() => {
    const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); local.set('pocket-ledger-device', id); return id;
  })();
  // What was last synced, per account: { snapshot, since }. Lets each start send and read only what's new.
  const store = {
    load: (uid) => { try { return JSON.parse(local.get('pocket-ledger-sync:' + uid) || 'null'); } catch { return null; } },
    save: (uid, meta) => local.set('pocket-ledger-sync:' + uid, JSON.stringify(meta)),
    lastUid: () => local.get('pocket-ledger-sync-last'),
    setLastUid: (uid) => local.set('pocket-ledger-sync-last', uid),
  };

  const flag = {
    get: () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } },
    set: (on) => { try { on ? localStorage.setItem(FLAG, '1') : localStorage.removeItem(FLAG); } catch { /* private mode */ } },
  };
  function emit() { for (const fn of listeners) { try { fn(); } catch (e) { console.error(e); } } }

  /* Loads Firebase from web/vendor/firebase/ (copied there by tools/vendor-firebase.mjs). */
  function load() {
    if (fb) return Promise.resolve(fb);
    if (loading) return loading;
    status = 'loading'; emit();
    const base = new URL('vendor/firebase/', document.baseURI).href;
    loading = Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js')])
      .then(async ([appMod, A]) => {
        const app = appMod.initializeApp(config);
        // Stay signed in after the app is closed (IndexedDB first, localStorage if that's unavailable).
        const auth = A.initializeAuth(app, { persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence] });
        await auth.authStateReady();
        user = auth.currentUser;
        A.onAuthStateChanged(auth, (u) => {
          user = u; flag.set(!!u); emit();
          if (u) startSync(); else stopSync();
        });
        fb = { app, auth, A };
        status = 'ready'; emit();
        return fb;
      })
      .catch((e) => { console.error('Could not load Firebase', e); status = 'error'; loading = null; emit(); throw e; });
    return loading;
  }

  /* ----- data sync ----- */
  async function loadFirestore() {
    if (firestore) return firestore;
    const { app } = await load();
    const F = await import(new URL('vendor/firebase/', document.baseURI).href + 'firebase-firestore.js');
    firestore = { F, db: F.initializeFirestore(app, { ignoreUndefinedProperties: true }) };
    return firestore;
  }
  const setSync = (next) => { sync = { ...sync, ...next }; emit(); };
  async function startSync() {
    if (!user || !hooks || !Core || (engine && engine.uid === user.uid)) return;
    stopSync();
    const u = user;
    clearTimeout(retryStart);
    try {
      setSync({ state: 'starting', error: null });
      const { F, db } = await loadFirestore();
      if (user !== u) return; // signed out meanwhile
      const e = Core.createEngine({ api: Core.makeFirestoreAdapter(F, db, u.uid, deviceId), hooks, store, uid: u.uid, onStatus: setSync });
      engine = Object.assign(e, { uid: u.uid });
      await e.start();
    } catch (err) {
      if (err && err.code === 'sync/cancelled') { stopSync(); await signOut().catch(() => {}); return; }
      console.error('Sync could not start', err);
      stopSync();
      setSync({ state: navigator.onLine === false ? 'offline' : 'error', error: err });
      retryStart = setTimeout(startSync, 30000); // try again in a while
    }
  }
  function stopSync() {
    clearTimeout(retryStart);
    if (engine) { try { engine.stop(); } catch (e) { console.error(e); } }
    engine = null;
    if (sync.state !== 'off') setSync({ state: 'off', error: null });
  }
  // Back online: send what's waiting (or start, if starting failed while offline).
  window.addEventListener('online', () => { if (engine) engine.push(); else if (user && hooks) startSync(); });

  /* Firebase error codes -> short, friendly sentences. */
  const MESSAGES = {
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/missing-email': 'Enter your email address.',
    'auth/missing-password': 'Enter your password.',
    'auth/weak-password': 'That password is too weak. Use 8 or more characters with a letter and a number.',
    'auth/password-does-not-meet-requirements': 'That password is too weak. Use 8 or more characters with a letter and a number.',
    'auth/email-already-in-use': 'There’s already an account with this email. Try signing in instead.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong password.',
    'auth/user-not-found': 'No account with this email.',
    'auth/user-disabled': 'This account has been turned off.',
    'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
    'auth/network-request-failed': 'No internet connection. Check it and try again.',
    'auth/requires-recent-login': 'For your safety, sign in again first.',
  };
  function friendlyError(e) {
    if (e && MESSAGES[e.code]) return MESSAGES[e.code];
    if (e && e.message && /import|fetch|load/i.test(e.message)) return 'Sync couldn’t start on this device.';
    return 'Something went wrong. Try again.';
  }

  /* One way in for every sign-in method, so a "Sign in with Google" button can be added later
     as one more `method` without changing the screens that call this. */
  async function signIn(method, { email, password } = {}) {
    const { auth, A } = await load();
    if (method === 'password') return (await A.signInWithEmailAndPassword(auth, email.trim(), password)).user;
    throw new Error('Sign-in method not supported yet: ' + method);
  }
  async function signUp(email, password) {
    const { auth, A } = await load();
    const u = (await A.createUserWithEmailAndPassword(auth, email.trim(), password)).user;
    // Ask the person to confirm the address is really theirs. If sending fails, they can resend from Settings.
    A.sendEmailVerification(u).catch((e) => console.warn('Could not send the confirmation email', e.code));
    return u;
  }
  async function sendVerification() {
    const { auth, A } = await load();
    if (auth.currentUser) await A.sendEmailVerification(auth.currentUser);
  }
  /* Asks Firebase again for this account's details, e.g. after the person clicked the confirmation link. */
  async function refresh() {
    const { auth } = await load();
    if (auth.currentUser) { await auth.currentUser.reload(); user = auth.currentUser; emit(); }
  }
  async function resetPassword(email) {
    const { auth, A } = await load();
    await A.sendPasswordResetEmail(auth, email.trim());
  }
  async function signOut() {
    const { auth, A } = await load();
    stopSync(); // stop listening before the sign-in goes away
    await A.signOut(auth);
  }
  /* Deleting an account needs a fresh sign-in, so we ask for the password again first. */
  async function deleteAccount(password) {
    const { auth, A } = await load();
    const u = auth.currentUser; if (!u) return;
    await A.reauthenticateWithCredential(u, A.EmailAuthProvider.credential(u.email, password));
    // Delete everything stored in the cloud for this account first, then the account itself.
    stopSync();
    const { F, db } = await loadFirestore();
    await Core.makeFirestoreAdapter(F, db, u.uid, deviceId).deleteAll();
    local.del('pocket-ledger-sync:' + u.uid);
    if (store.lastUid() === u.uid) local.del('pocket-ledger-sync-last');
    await A.deleteUser(u);
  }

  window.PocketCloud = {
    available: !!config,
    /* What the Settings page shows. */
    info: () => ({ status, signedIn: !!user, email: user ? user.email : '', verified: !!(user && user.emailVerified), sync: { ...sync } }),
    /* app.js gives the sync engine access to its data. Syncing starts once someone is signed in. */
    attach: (h) => { hooks = h; if (user) startSync(); },
    /* app.js calls this after every save; the engine sends the change a moment later. */
    changed: () => { if (engine) engine.changed(); },
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    /* Called once when the app starts: only loads Firebase if someone signed in here before. */
    start: () => { if (config && flag.get()) load().catch(() => {}); },
    load, signIn, signUp, sendVerification, refresh, resetPassword, signOut, deleteAccount, friendlyError,
  };
})();

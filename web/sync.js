/* Cloud account for sync: create an account, sign in, sign out, reset a password, delete the account.
 *
 * Safety rules (the app must work exactly as before for people who never sign in):
 *   - Firebase is loaded only when someone opens the sign-in form, or has signed in on this device before.
 *   - Every Firebase call is wrapped: if it fails (no internet, blocked, a bug), the app keeps working.
 *   - app.js only talks to window.PocketCloud. If this file is missing, the Sync section simply isn't shown.
 *
 * Phase 2: accounts only. Phase 3 adds the data sync itself (using sync-core.js).
 */
(function () {
  const FLAG = 'pocket-ledger-cloud'; // in localStorage: "1" once someone signed in on this device
  const config = window.FIREBASE_CONFIG;

  let fb = null;        // { auth, A } once Firebase is loaded; A = the Firebase Auth functions
  let loading = null;   // the Promise while loading, so two callers don't load it twice
  let user = null;      // the signed-in Firebase user, or null
  let status = 'off';   // 'off' (never loaded) | 'loading' | 'ready' | 'error'
  const listeners = new Set();

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
        A.onAuthStateChanged(auth, (u) => { user = u; flag.set(!!u); emit(); });
        fb = { app, auth, A };
        status = 'ready'; emit();
        return fb;
      })
      .catch((e) => { console.error('Could not load Firebase', e); status = 'error'; loading = null; emit(); throw e; });
    return loading;
  }

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
    await A.signOut(auth);
  }
  /* Deleting an account needs a fresh sign-in, so we ask for the password again first. */
  async function deleteAccount(password) {
    const { auth, A } = await load();
    const u = auth.currentUser; if (!u) return;
    await A.reauthenticateWithCredential(u, A.EmailAuthProvider.credential(u.email, password));
    await A.deleteUser(u);
  }

  window.PocketCloud = {
    available: !!config,
    /* What the Settings page shows. */
    info: () => ({ status, signedIn: !!user, email: user ? user.email : '', verified: !!(user && user.emailVerified) }),
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    /* Called once when the app starts: only loads Firebase if someone signed in here before. */
    start: () => { if (config && flag.get()) load().catch(() => {}); },
    load, signIn, signUp, sendVerification, refresh, resetPassword, signOut, deleteAccount, friendlyError,
  };
})();

/* The account page (account.html):
 *   ?mode=resetPassword&oobCode=...  choose a new password      (link in Firebase's email)
 *   ?mode=verifyEmail&oobCode=...    confirm the email address  (link in Firebase's email)
 *   ?mode=deleteAccount              delete the account and its synced data, without the app
 *                                    (Google Play asks apps with accounts for such a web page)
 * "oobCode" is a one-time code from the email. It is only sent to Firebase, never shown or stored.
 * Firebase is told to use this page in the console: Authentication > Templates > Customize action URL.
 */
import { initializeApp } from './vendor/firebase/firebase-app.js';
import {
  initializeAuth, inMemoryPersistence, verifyPasswordResetCode, confirmPasswordReset, applyActionCode,
  signInWithEmailAndPassword, sendPasswordResetEmail, deleteUser,
} from './vendor/firebase/firebase-auth.js';

const box = document.getElementById('box');
const params = new URLSearchParams(location.search);
const mode = params.get('mode');
const code = params.get('oobCode');

// Same rules as the "Create an account" form in app.js. Firebase checks them again (password policy).
const PW_RULES = [
  ['8 or more characters', (p) => p.length >= 8],
  ['a letter', (p) => /\p{L}/u.test(p)],
  ['a number', (p) => /\d/.test(p)],
];
const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/>',
  bad: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel) => box.querySelector(sel);

/* After the code has been used, drop it from the address bar so it isn't left in the browser history. */
const forgetCode = () => history.replaceState(null, '', location.pathname);

function done(ok, title, text) {
  box.innerHTML = `<div class="acct-done ${ok ? 'good' : 'bad'}">${icon(ok ? 'ok' : 'bad')}<div><h1>${title}</h1><p>${text}</p></div></div>`;
}
const LINK_PROBLEM = {
  'auth/expired-action-code': 'This link has expired. Ask for a new one in Pocket Ledger: Settings › Sync & account.',
  'auth/invalid-action-code': 'This link has already been used, or it was cut short when copied. Ask for a new one in Pocket Ledger.',
  'auth/user-disabled': 'This account has been turned off.',
  'auth/user-not-found': 'This account no longer exists.',
  'auth/network-request-failed': 'No internet connection. Check it and reload this page.',
  'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
  'auth/weak-password': 'That password is too weak. Use 8 or more characters with a letter and a number.',
  'auth/password-does-not-meet-requirements': 'That password is too weak. Use 8 or more characters with a letter and a number.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-email': 'That email address doesn’t look right.',
};
const problem = (e) => LINK_PROBLEM[e?.code] || 'Something went wrong. Reload this page, or ask for a new link in Pocket Ledger.';

/* ----- choose a new password ----- */
function passwordField(id, label) {
  return `<div class="field"><label class="field-label" for="${id}">${label}</label>
    <div class="pw-wrap"><input class="input" id="${id}" type="password" autocomplete="new-password" maxlength="128" aria-describedby="${id}-err">
    <button type="button" class="icon-btn pw-eye" data-eye="${id}" aria-label="Show password" aria-pressed="false">${icon('eye')}</button></div>
    <p class="field-error" id="${id}-err" hidden></p></div>`;
}
function fieldError(id, msg) {
  const inp = $('#' + id); const el = $('#' + id + '-err');
  if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
  el.textContent = msg || ''; el.hidden = !msg;
  if (msg) el.setAttribute('role', 'alert'); else el.removeAttribute('role');
}
function formMsg(msg) { const el = $('.form-error'); el.textContent = msg || ''; el.hidden = !msg; }

function resetForm(auth, email) {
  box.innerHTML = `<form class="stack" novalidate>
    <div><h1>Choose a new password</h1><p class="hint" style="margin:0">for <b>${esc(email)}</b></p></div>
    <input type="email" autocomplete="username" value="${esc(email)}" hidden>
    ${passwordField('np', 'New password')}
    <ul class="pw-rules" id="pwRules" aria-label="Password needs">${PW_RULES.map(([l]) => `<li>${icon('check')}${l}</li>`).join('')}</ul>
    ${passwordField('np2', 'Type it again')}
    <p class="form-error" role="alert" hidden></p>
    <button class="btn primary" type="submit" id="save">Save new password</button>
  </form>`;
  const form = $('form'); const save = $('#save');
  const val = (id) => $('#' + id).value;
  const tick = (showBad) => box.querySelectorAll('#pwRules li').forEach((li, n) => {
    const ok = PW_RULES[n][1](val('np'));
    li.classList.toggle('ok', ok); li.classList.toggle('bad', !ok && showBad);
  });
  box.querySelectorAll('.input').forEach((inp) => inp.addEventListener('input', () => {
    fieldError(inp.id, ''); formMsg('');
    if (inp.id === 'np') tick(false);
  }));
  box.querySelectorAll('[data-eye]').forEach((b) => b.onclick = () => {
    const inp = $('#' + b.dataset.eye); const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', show); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    b.innerHTML = icon(show ? 'eyeOff' : 'eye'); inp.focus();
  });
  $('#np').focus();

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (save.disabled) return;
    const pw = val('np');
    fieldError('np', ''); fieldError('np2', ''); formMsg('');
    if (!pw) fieldError('np', 'Choose a new password.');
    else if (PW_RULES.some(([, ok]) => !ok(pw))) { fieldError('np', 'Your password doesn’t meet the rules below yet.'); tick(true); }
    if (pw && val('np2') !== pw) fieldError('np2', val('np2') ? 'The two passwords don’t match.' : 'Type your password again.');
    const bad = box.querySelector('[aria-invalid="true"]'); if (bad) return bad.focus();

    save.disabled = true; save.textContent = 'Saving…';
    try {
      await confirmPasswordReset(auth, code, pw);
      forgetCode();
      done(true, 'Password changed', 'Go back to Pocket Ledger and sign in with your new password. You can close this page.');
    } catch (err) {
      save.disabled = false; save.textContent = 'Save new password';
      if (/weak-password|password-does-not-meet/.test(err?.code)) { fieldError('np', problem(err)); $('#np').focus(); } else formMsg(problem(err));
    }
  };
}

/* ----- delete the account, without the app ----- */
function emailField() {
  return `<div class="field"><label class="field-label" for="em">Email</label>
    <input class="input" id="em" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="254" aria-describedby="em-err">
    <p class="field-error" id="em-err" hidden></p></div>`;
}
function deleteForm(auth) {
  box.innerHTML = `<form class="stack" novalidate>
    <div><h1>Delete your account</h1>
      <p class="hint" style="margin:0">This deletes your Pocket Ledger account and everything synced to it, for good. Money history saved on your own devices stays there (remove it in the app with Settings › Erase all data).</p></div>
    ${emailField()}
    ${passwordField('pw', 'Password').replace('autocomplete="new-password"', 'autocomplete="current-password"')}
    <button class="link-btn" type="button" id="forgot" style="align-self:flex-start;font-size:12.5px">Forgot your password? Send me a reset link</button>
    <p class="form-error" role="alert" hidden></p>
    <button class="btn danger" type="submit" id="go">Delete my account and its data</button>
  </form>`;
  const form = $('form'); const go = $('#go');
  box.querySelectorAll('.input').forEach((inp) => inp.addEventListener('input', () => { fieldError(inp.id, ''); formMsg(''); }));
  box.querySelectorAll('[data-eye]').forEach((b) => b.onclick = () => {
    const inp = $('#' + b.dataset.eye); const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', show); b.innerHTML = icon(show ? 'eyeOff' : 'eye'); inp.focus();
  });
  const email = () => $('#em').value.trim();
  const emailOk = () => {
    if (!email()) { fieldError('em', 'Enter your email address.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email())) { fieldError('em', 'That email address doesn’t look right.'); return false; }
    return true;
  };
  $('#em').focus();
  $('#forgot').onclick = async () => {
    fieldError('em', ''); formMsg('');
    if (!emailOk()) return $('#em').focus();
    try { await sendPasswordResetEmail(auth, email()); } catch (err) { if (err?.code !== 'auth/user-not-found') return formMsg(problem(err)); }
    const el = $('.form-error'); el.textContent = `If ${email()} has an account, a reset link is on its way.`; el.hidden = false; el.classList.add('ok');
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (go.disabled) return;
    fieldError('em', ''); fieldError('pw', ''); formMsg('');
    const okEmail = emailOk();
    if (!$('#pw').value) fieldError('pw', 'Enter your password.');
    const bad = box.querySelector('[aria-invalid="true"]'); if (bad || !okEmail) return (bad || $('#em')).focus();
    go.disabled = true; go.textContent = 'Deleting…';
    try {
      const { user } = await signInWithEmailAndPassword(auth, email(), $('#pw').value);
      // Everything synced to the account first, then the account itself.
      const F = await import('./vendor/firebase/firebase-firestore.js');
      const db = F.initializeFirestore(auth.app, { ignoreUndefinedProperties: true });
      await window.PocketSync.makeFirestoreAdapter(F, db, user.uid, 'web-delete').deleteAll();
      await deleteUser(user);
      done(true, 'Account deleted', 'Your account and everything synced to it have been deleted. You can close this page.');
    } catch (err) {
      go.disabled = false; go.textContent = 'Delete my account and its data';
      if (/invalid-credential|wrong-password|user-not-found/.test(err?.code)) { fieldError('em', ' '); fieldError('pw', 'Wrong email or password.'); $('#pw').focus(); } else formMsg(problem(err));
    }
  };
}

/* ----- start ----- */
async function main() {
  const known = mode === 'deleteAccount' || (code && ['resetPassword', 'verifyEmail'].includes(mode));
  if (!window.FIREBASE_CONFIG || !known) {
    return done(false, 'Nothing to do here', 'This page opens from the links in Pocket Ledger’s emails. If you copied a link, make sure you copied all of it.');
  }
  // No sign-in is kept on this page: nothing is remembered after it is closed.
  const auth = initializeAuth(initializeApp(window.FIREBASE_CONFIG), { persistence: inMemoryPersistence });
  if (mode === 'deleteAccount') return deleteForm(auth);
  try {
    if (mode === 'verifyEmail') {
      await applyActionCode(auth, code);
      forgetCode();
      return done(true, 'Email confirmed', 'Thank you! In Pocket Ledger, tap “I’ve confirmed it” in Settings › Sync & account. You can close this page.');
    }
    const email = await verifyPasswordResetCode(auth, code); // checks the link and tells us whose password it is
    resetForm(auth, email);
  } catch (err) {
    done(false, 'This link didn’t work', problem(err));
  }
}
main().catch((err) => { console.error(err); done(false, 'Something went wrong', 'Reload this page, or ask for a new link in Pocket Ledger.'); });

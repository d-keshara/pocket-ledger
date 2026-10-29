/* Pocket Ledger — app logic. Plain JS, no dependencies. */
(() => {
'use strict';

/* ================= constants ================= */
const APP_VERSION = '1.9.1';
const AUTHOR = 'D. Kezara';
const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948', '#5f6b66', '#0f6b5c'];
const CURRENCIES = [
  ['LKR', 'Rs'], ['USD', '$'], ['EUR', '€'], ['GBP', '£'], ['INR', '₹'], ['AUD', 'A$'], ['CAD', 'C$'],
  ['SGD', 'S$'], ['AED', 'AED'], ['SAR', 'SAR'], ['QAR', 'QAR'], ['JPY', '¥'], ['MYR', 'RM'], ['PKR', 'Rs'],
  ['BDT', '৳'], ['NPR', 'Rs'], ['ZAR', 'R'], ['NZD', 'NZ$'], ['PHP', '₱'], ['NGN', '₦'], ['KES', 'KSh'],
];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ICONS = {
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16" cy="14" r="1.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  swap: '<path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  minus: '<path d="M5 12h14"/>',
  cloud: '<path d="M17.5 19H7a5 5 0 1 1 .9-9.92A6 6 0 0 1 19 10.5a4.25 4.25 0 0 1-1.5 8.5z"/>',
  cloudOk: '<path d="M17.5 19H7a5 5 0 1 1 .9-9.92A6 6 0 0 1 19 10.5a4.25 4.25 0 0 1-1.5 8.5z"/><path d="m9 13.5 2 2 4-4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  calc: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
  auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

/* ================= utilities ================= */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const round2 = (n) => Math.round((+n || 0) * 100) / 100 || 0; // `|| 0` turns -0 into 0
const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const now = () => (window.__LEDGER_NOW__ ? new Date(window.__LEDGER_NOW__) : new Date());
const today = () => toISO(now());
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
const addMonths = (iso, n, anchorDay) => {
  const d = parseISO(iso); const day = anchorDay || d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(day, last)); return toISO(t);
};
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const monthStart = (iso) => iso.slice(0, 8) + '01';
const monthEnd = (iso) => { const d = parseISO(iso); return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
const weekStartOf = (iso) => { const d = parseISO(iso); const diff = (d.getDay() - S().settings.weekStart + 7) % 7; return addDays(iso, -diff); };
const fmtDate = (iso, opts = {}) => {
  const d = parseISO(iso); const t = today();
  if (!opts.full) { if (iso === t) return 'Today'; if (iso === addDays(t, -1)) return 'Yesterday'; if (iso === addDays(t, 1)) return 'Tomorrow'; }
  const sameYear = d.getFullYear() === now().getFullYear();
  return `${opts.noDay ? '' : DAY_SHORT[d.getDay()] + ', '}${d.getDate()} ${MONTH_SHORT[d.getMonth()]}${sameYear ? '' : ' ' + d.getFullYear()}`;
};

/* ================= state & storage ================= */
let state = null;
const S = () => state;
const ui = {
  view: 'dashboard',
  tx: { q: '', type: 'all', cat: 'all', acc: 'all', period: 'month', from: '', to: '' },
  reportPeriod: 'month',
  tools: {}, // what's typed on the Calculator page, so a redraw doesn't clear it
};

// True inside the Android app built with Capacitor (see capacitor.config.json).
const isNativeApp = () => !!window.Capacitor?.isNativePlatform?.();
// Lets styles.css give Android its own spacing above the phone's navigation buttons.
if (window.Capacitor?.getPlatform?.() === 'android') document.documentElement.classList.add('android');
const hasApi = () => !!(window.pywebview && window.pywebview.api && window.pywebview.api.save_data);
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      if (hasApi()) await window.pywebview.api.save_data(state);
      else localStorage.setItem('pocket-ledger', JSON.stringify(state));
    } catch (e) { toast('Could not save your data: ' + e); }
    try { cloud()?.changed(); } catch (e) { console.error('Sync', e); } // signed in: send the change to the cloud
  }, 150);
}
async function loadState() {
  try {
    if (hasApi()) return await window.pywebview.api.load_data();
    const raw = localStorage.getItem('pocket-ledger');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function defaultState() {
  const exp = [
    ['Food & groceries', true], ['Eating out', true], ['Transport', true], ['Shopping', true],
    ['Entertainment', true], ['Phone & internet', true], ['Health', true], ['Gifts & family', true],
    ['Education', true], ['Bills & utilities', false], ['Rent & housing', false], ['Other', true],
  ];
  const inc = ['Salary', 'Freelance & side work', 'Pocket money', 'Gifts received', 'Other income'];
  return {
    version: 1,
    settings: { name: '', currency: 'LKR', symbol: 'Rs', decimals: true, weekStart: 1, weeklyBudget: 0, theme: 'system', onboarded: false,
      lastBackup: '', backupSnoozeUntil: '' },
    accounts: [
      { id: uid(), name: 'Cash', initial: 0, color: PALETTE[2] },
      { id: uid(), name: 'Bank account', initial: 0, color: PALETTE[0] },
    ],
    categories: [
      ...exp.map(([name, weekly], i) => ({ id: uid(), name, type: 'expense', color: PALETTE[i % PALETTE.length], weekly })),
      ...inc.map((name, i) => ({ id: uid(), name, type: 'income', color: PALETTE[(i + 5) % PALETTE.length], weekly: false })),
    ],
    transactions: [], budgets: [], goals: [], recurring: [],
  };
}

/* ================= lookups & money ================= */
const cat = (id) => state.categories.find((c) => c.id === id);
const acc = (id) => state.accounts.find((a) => a.id === id);
const catName = (id) => cat(id)?.name || 'Uncategorised';
function money(n, opts = {}) {
  const s = state.settings; const dec = s.decimals && s.currency !== 'JPY' ? 2 : 0;
  const v = Math.abs(n);
  const d = opts.short ? 0 : dec;
  let str = v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  if (opts.compact && v >= 10000) str = v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.round(v / 1000) + 'k';
  const sign = n < 0 ? '−' : (opts.sign && n > 0 ? '+' : '');
  return `${sign}${s.symbol} ${str}`;
}
/* Same as money(), as HTML for amounts that should stand out: the currency symbol and the cents
   are drawn smaller so the main digits are what the eye reads first ("Rs 12,500.00"). */
const NNBSP = ' '; // the narrow no-break space money() puts after the symbol
function moneyHtml(n, opts = {}) {
  const sym = state.settings.symbol; const s = money(n, opts); const at = s.indexOf(sym + NNBSP);
  const sign = s.slice(0, at); const digits = s.slice(at + sym.length + 1);
  const dot = opts.compact ? -1 : digits.indexOf('.');
  const main = dot < 0 ? digits : digits.slice(0, dot);
  return `<span class="money">${sign}<span class="cur">${esc(sym)}</span>${main}${dot < 0 ? '' : `<span class="dec">${digits.slice(dot)}</span>`}</span>`;
}
/* Newest date first; on the same day, the one added last comes first. */
const newestFirst = (list) => [...list].reverse().sort((a, b) => b.date.localeCompare(a.date));
const inRange = (t, from, to) => (!from || t.date >= from) && (!to || t.date <= to);
const expensesIn = (from, to) => state.transactions.filter((t) => t.type === 'expense' && inRange(t, from, to));
const incomeIn = (from, to) => state.transactions.filter((t) => t.type === 'income' && inRange(t, from, to));
function accountBalance(a) {
  let b = +a.initial || 0;
  for (const t of state.transactions) {
    if (t.type === 'income' && t.accountId === a.id) b += t.amount;
    else if (t.type === 'expense' && t.accountId === a.id) b -= t.amount;
    else if (t.type === 'transfer') { if (t.accountId === a.id) b -= t.amount; if (t.toAccountId === a.id) b += t.amount; }
  }
  return round2(b);
}
const totalBalance = () => round2(sum(state.accounts, accountBalance));

/* ================= recurring ================= */
function nextOccurrence(r, iso) {
  if (r.frequency === 'daily') return addDays(iso, 1);
  if (r.frequency === 'weekly') return addDays(iso, 7);
  if (r.frequency === 'biweekly') return addDays(iso, 14);
  if (r.frequency === 'yearly') return addMonths(iso, 12, r.anchorDay);
  return addMonths(iso, 1, r.anchorDay);
}
function postDueRecurring() {
  const t = today(); let n = 0;
  for (const r of state.recurring) {
    let guard = 0;
    while (r.active && r.nextDate <= t && guard++ < 400) {
      // The id comes from the payment and its date, not uid(): two synced devices posting the same rent
      // on the same day then make the same transaction instead of two.
      const id = `${r.id}-${r.nextDate}`;
      // Already posted (e.g. "Next date" was moved back to a date that was posted before)? Don't add it twice.
      // auto: posted by the app and not edited since (editing it builds a new record without this flag).
      if (!state.transactions.some((x) => x.id === id)) {
        state.transactions.push({ id, type: r.type, amount: r.amount, date: r.nextDate, categoryId: r.categoryId, accountId: r.accountId, note: r.note, recurringId: r.id, auto: true });
        n++;
      }
      r.nextDate = nextOccurrence(r, r.nextDate);
    }
  }
  if (n) { save(); setTimeout(() => toast(`Added ${n} scheduled transaction${n > 1 ? 's' : ''}`), 400); }
}
const FREQ = { daily: 'Every day', weekly: 'Every week', biweekly: 'Every 2 weeks', monthly: 'Every month', yearly: 'Every year' };

/* ================= weekly runway ================= */
function weekInfo(refIso = today()) {
  const start = weekStartOf(refIso); const end = addDays(start, 6);
  const t = today();
  const B = +state.settings.weeklyBudget || 0;
  const counted = (tx) => cat(tx.categoryId)?.weekly !== false;
  const ex = expensesIn(start, end).filter(counted);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, spent: round2(sum(ex.filter((x) => x.date === date), (x) => x.amount)) };
  });
  const spent = round2(sum(days, (d) => d.spent));
  const todayIdx = clamp(daysBetween(start, t), 0, 6);
  const isCurrent = t >= start && t <= end;
  const before = round2(sum(days.slice(0, todayIdx), (d) => d.spent));
  const daysLeft = 7 - todayIdx;
  const allowanceToday = B ? Math.max(0, B - before) / daysLeft : 0;
  const spentToday = days[todayIdx].spent;
  const leftToday = round2(allowanceToday - spentToday);
  const remaining = round2(B - spent);
  // Future days share what is left once today's share is used up.
  const perDayAfter = daysLeft > 1 ? Math.max(0, remaining - Math.max(0, leftToday)) / (daysLeft - 1) : 0;
  return { start, end, days, spent, B, todayIdx, isCurrent, daysLeft, allowanceToday, spentToday, leftToday, remaining, perDayAfter, counted };
}

/* ================= tooltip ================= */
/* Mouse: show while hovering, follow the cursor.
   Touch: fingers can't hover, so show on tap above the tapped item, and hide after
   a moment, on scroll, on a tap elsewhere, or when the page changes. */
const TIP_TOUCH_MS = 2500;
const tip = () => $('#tip');
let tipTimer = null;
let lastPointer = 'mouse';
function hideTip() {
  clearTimeout(tipTimer);
  tip()?.classList.remove('show');
}
function showTip(el, place) {
  const t = tip(); if (!t) return;
  t.innerHTML = el.getAttribute('data-tip');
  t.classList.add('show');
  const w = t.offsetWidth, h = t.offsetHeight;
  let x, y;
  if (place.mouseX !== undefined) {           // next to the cursor
    x = place.mouseX + 14; y = place.mouseY - h - 10;
    if (x + w > innerWidth - 8) x = place.mouseX - w - 14;
    if (y < 8) y = place.mouseY + 16;
  } else {                                     // centred above the tapped item
    const r = el.getBoundingClientRect();
    x = clamp(r.left + r.width / 2 - w / 2, 8, Math.max(8, innerWidth - w - 8));
    y = r.top - h - 8;
    if (y < 8) y = r.bottom + 8;
  }
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
document.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; }, true);
document.addEventListener('pointermove', (e) => {
  if (e.pointerType && e.pointerType !== 'mouse') return; // ignore fingers and pens moving
  const el = e.target.closest?.('[data-tip]');
  if (el) showTip(el, { mouseX: e.clientX, mouseY: e.clientY }); else hideTip();
});
document.addEventListener('click', (e) => {
  if (lastPointer === 'mouse') return;
  const el = e.target.closest?.('[data-tip]');
  if (!el) { hideTip(); return; }
  showTip(el, {});
  clearTimeout(tipTimer);
  tipTimer = setTimeout(hideTip, TIP_TOUCH_MS);
});
document.addEventListener('scroll', hideTip, true); // `true` also catches scrolling inside .main

/* ================= toast ================= */
function toast(msg, action) {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) {
    const b = document.createElement('button'); b.textContent = action.label;
    b.onclick = () => { action.run(); el.remove(); }; el.appendChild(b);
  }
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), action ? 6000 : 3200);
}

/* ================= modal ================= */
function openModal({ title, body, foot, onMount, wide, onClose }) {
  closeModal();
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'overlay'; ov._onClose = onClose;
  ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}" ${wide ? 'style="width:min(680px,100%)"' : ''}>
    <div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Close">${icon('x')}</button></div>
    <div class="modal-body">${body}</div>
    ${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeModal(); });
  ov.querySelectorAll('[data-close]').forEach((b) => b.onclick = closeModal);
  document.body.appendChild(ov);
  onMount?.(ov);
  const f = ov.querySelector('[autofocus]') || ov.querySelector('input, select, button');
  f?.focus(); f?.select?.();
  return ov;
}
function closeModal() {
  const ov = $('#overlay'); if (!ov) return;
  ov.remove(); ov._onClose?.();
  // Data that arrived from another device while this was open: show it now.
  if (ui.renderLater) { ui.renderLater = false; render(); }
}
function confirmBox(title, text, okLabel, onOk) {
  openModal({
    title, body: `<p style="margin:0">${text}</p>`,
    foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="okb">${esc(okLabel)}</button>`,
    onMount: (m) => { $('#okb', m).onclick = () => { closeModal(); onOk(); }; },
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { setFab(false); closeModal(); }
  const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName);
  if (!state?.settings.onboarded || $('#overlay')) return;
  if ((e.ctrlKey && e.key.toLowerCase() === 'n') || (!typing && e.key.toLowerCase() === 'n')) { e.preventDefault(); txForm({ type: 'expense' }); }
  if (!typing && e.key.toLowerCase() === 'i') { e.preventDefault(); txForm({ type: 'income' }); }
});

/* ================= shared fragments ================= */
const catOptions = (type, sel) => state.categories.filter((c) => c.type === type)
  .map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
const accOptions = (sel) => state.accounts.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
const swatches = (sel) => `<div class="swatches">${PALETTE.map((c) => `<button type="button" class="swatch ${c === sel ? 'on' : ''}" data-color="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div>`;
function bindSwatches(m) {
  $$('.swatch', m).forEach((b) => b.onclick = () => { $$('.swatch', m).forEach((x) => x.classList.remove('on')); b.classList.add('on'); });
  return () => $('.swatch.on', m)?.dataset.color || PALETTE[0];
}
const empty = (ic, title, text, btn) => `<div class="empty">${icon(ic)}<h3>${title}</h3><p>${text}</p>${btn || ''}</div>`;

function txRow(t) {
  const c = cat(t.categoryId);
  let title, sub, glyphColor, letter, amtCls, amt;
  if (t.type === 'transfer') {
    const goalName = (id) => state.goals.find((g) => g.id === id)?.name || 'Goal';
    const from = t.fromGoalId ? goalName(t.fromGoalId) : (acc(t.accountId)?.name || 'Account');
    const to = t.goalId ? goalName(t.goalId) : (acc(t.toAccountId)?.name || 'Account');
    title = t.note || 'Transfer'; sub = `${esc(from)} to ${esc(to)}`; glyphColor = '#5f6b66'; letter = '⇄'; amtCls = ''; amt = moneyHtml(t.amount);
  } else {
    title = t.note || c?.name || 'Uncategorised';
    sub = `${esc(c?.name || 'Uncategorised')} · ${esc(acc(t.accountId)?.name || '')}`;
    glyphColor = c?.color || '#5f6b66'; letter = (c?.name || '?')[0];
    amtCls = t.type === 'income' ? 'pos' : ''; amt = moneyHtml(t.type === 'income' ? t.amount : -t.amount, { sign: true });
  }
  return `<div class="tx">
    <div class="glyph" style="background:${glyphColor}">${esc(letter)}</div>
    <div style="min-width:0"><div class="t1">${esc(title)}${t.recurringId ? '<span class="tag">Scheduled</span>' : ''}</div><div class="t2">${sub}</div></div>
    <div class="amt ${amtCls}">${amt}</div>
    <div class="row-actions"><button class="icon-btn" data-edit-tx="${t.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-del-tx="${t.id}" aria-label="Delete">${icon('trash')}</button></div>
  </div>`;
}
function txListGrouped(list) {
  const groups = {};
  for (const t of list) (groups[t.date] ||= []).push(t);
  return `<div class="tx-list">${Object.keys(groups).sort().reverse().map((d) => {
    const g = groups[d];
    const net = sum(g, (t) => t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0);
    return `<div class="tx-day"><span>${fmtDate(d)}</span><span class="num">${net ? money(net, { sign: true }) : ''}</span></div>${g.map(txRow).join('')}`;
  }).join('')}</div>`;
}
function bindTxRows(root) {
  $$('[data-edit-tx]', root).forEach((b) => b.onclick = () => txForm(state.transactions.find((t) => t.id === b.dataset.editTx)));
  $$('[data-del-tx]', root).forEach((b) => b.onclick = () => deleteTx(b.dataset.delTx));
}
/* Money moved into a goal (goalId) or out of one (fromGoalId) also changes the goal's saved amount. */
function goalEffect(t, factor) {
  const g = state.goals.find((x) => x.id === (t.goalId || t.fromGoalId)); if (!g) return;
  g.saved = round2(g.saved + factor * (t.goalId ? t.amount : -t.amount));
}
function deleteTx(id) {
  const i = state.transactions.findIndex((t) => t.id === id); if (i < 0) return;
  const [t] = state.transactions.splice(i, 1);
  goalEffect(t, -1);
  save(); render();
  toast('Transaction deleted', { label: 'Undo', run: () => { state.transactions.push(t); goalEffect(t, 1); save(); render(); } });
}

/* ================= transaction form ================= */
function txForm(existing = {}) {
  const isEdit = !!existing.id;
  let type = existing.type || 'expense';
  const draft = { amount: existing.amount || '', date: existing.date || today(), note: existing.note || '', categoryId: existing.categoryId, accountId: existing.accountId || state.accounts[0]?.id, toAccountId: existing.toAccountId || state.accounts[1]?.id };
  if (!state.accounts.length) { toast('Add an account first'); ui.view = 'accounts'; render(); return; }
  const lockType = isEdit && !!(existing.goalId || existing.fromGoalId);
  if (existing.fromGoalId) draft.accountId = existing.toAccountId;
  const body = () => `
    <div class="stack">
      ${lockType ? '' : `<div class="seg type" id="typeSeg">${['expense', 'income', 'transfer'].map((v) => `<button type="button" data-v="${v}" class="${v === type ? 'on' : ''}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>`}
      <label class="field"><span>Amount (${esc(state.settings.symbol)})</span><input class="input amount calc" id="fAmount" type="text" inputmode="decimal" autocomplete="off" value="${draft.amount}" placeholder="0" autofocus></label>
      ${type === 'transfer' ? '' : `<div class="field"><span>Category</span><div class="chips" id="fCats">${state.categories.filter((c) => c.type === type).map((c) => `<button type="button" class="chip ${c.id === draft.categoryId ? 'on' : ''}" data-id="${c.id}"><i class="dot" style="background:${c.color}"></i>${esc(c.name)}</button>`).join('')}</div></div>`}
      <div class="grid2">
        <label class="field"><span>${lockType ? 'Account' : type === 'transfer' ? 'From account' : 'Account'}</span><select class="input" id="fAcc">${accOptions(draft.accountId)}</select></label>
        ${type === 'transfer' && !lockType ? `<label class="field"><span>To account</span><select class="input" id="fTo">${accOptions(draft.toAccountId)}</select></label>` : `<label class="field"><span>Date</span><input class="input" type="date" id="fDate" value="${draft.date}"></label>`}
      </div>
      ${type === 'transfer' && !lockType ? `<label class="field"><span>Date</span><input class="input" type="date" id="fDate" value="${draft.date}"></label>` : ''}
      <label class="field"><span>Note <span class="muted" style="font-weight:400">(optional)</span></span><input class="input" id="fNote" value="${esc(draft.note)}" placeholder="${type === 'expense' ? 'e.g. Lunch with friends' : type === 'income' ? 'e.g. October salary' : 'e.g. ATM withdrawal'}" maxlength="120"></label>
    </div>`;
  const foot = `${isEdit ? `<button class="btn danger left" id="fDel">${icon('trash')}Delete</button>` : ''}
    ${isEdit ? '' : '<button class="btn" id="fAgain">Save and add another</button>'}
    <button class="btn primary" id="fSave">${isEdit ? 'Save changes' : 'Add ' + type}</button>`;
  const title = isEdit ? 'Edit transaction' : 'New transaction';

  const capture = (m) => {
    draft.amount = $('#fAmount', m).value; draft.note = $('#fNote', m).value;
    draft.accountId = $('#fAcc', m).value; draft.date = $('#fDate', m)?.value || draft.date;
    if ($('#fTo', m)) draft.toAccountId = $('#fTo', m).value;
  };
  const mount = (m) => {
    $$('#typeSeg button', m).forEach((b) => b.onclick = () => {
      capture(m); type = b.dataset.v; draft.categoryId = undefined;
      $('.modal-body', m).innerHTML = body(); $('#fSave', m).textContent = isEdit ? 'Save changes' : 'Add ' + type; mount(m); $('#fAmount', m).focus();
    });
    $$('#fCats .chip', m).forEach((b) => b.onclick = () => { $$('#fCats .chip', m).forEach((x) => x.classList.remove('on')); b.classList.add('on'); draft.categoryId = b.dataset.id; });
    $$('input', m).forEach((i) => i.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#fSave', m).click(); } });
  };
  const commit = (m, again) => {
    capture(m);
    const amount = round2(parseFloat(draft.amount));
    if (!(amount > 0)) { toast('Enter an amount greater than zero'); $('#fAmount', m).focus(); return; }
    if (type !== 'transfer' && !draft.categoryId) {
      const other = state.categories.find((c) => c.type === type && /other/i.test(c.name)) || state.categories.find((c) => c.type === type);
      draft.categoryId = other?.id;
    }
    if (type === 'transfer' && !lockType && draft.accountId === draft.toAccountId) { toast('Pick two different accounts'); return; }
    const rec = { id: existing.id || uid(), type, amount, date: draft.date || today(), note: draft.note.trim(), accountId: draft.accountId };
    if (type === 'transfer') {
      if (existing.goalId) rec.goalId = existing.goalId;
      else if (existing.fromGoalId) { rec.fromGoalId = existing.fromGoalId; rec.accountId = null; rec.toAccountId = draft.accountId; }
      else rec.toAccountId = draft.toAccountId;
    } else rec.categoryId = draft.categoryId;
    if (existing.recurringId) rec.recurringId = existing.recurringId;
    if (isEdit) {
      const cur = state.transactions.find((t) => t.id === existing.id);
      // Replace every field, so switching type (e.g. transfer -> expense) leaves no stale toAccountId/categoryId behind.
      goalEffect(cur, -1); for (const k of Object.keys(cur)) delete cur[k]; Object.assign(cur, rec); goalEffect(cur, 1);
    } else state.transactions.push(rec);
    save();
    if (again) {
      toast(`Added ${money(amount)} ${type}`);
      draft.amount = ''; draft.note = '';
      $('.modal-body', m).innerHTML = body(); mount(m); $('#fAmount', m).focus(); render();
    } else { closeModal(); render(); toast(isEdit ? 'Changes saved' : `Added ${money(amount)} ${type}`); }
  };
  openModal({
    title, body: body(), foot,
    onMount: (m) => {
      mount(m);
      $('#fSave', m).onclick = () => commit(m, false);
      $('#fAgain', m) && ($('#fAgain', m).onclick = () => commit(m, true));
      $('#fDel', m) && ($('#fDel', m).onclick = () => { closeModal(); deleteTx(existing.id); });
    },
  });
}

/* ================= charts ================= */
function roundTopRect(x, y, w, h, r = 4) {
  if (h <= 0) return '';
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}
/* Grouped (income vs expense) or single-series vertical bars. groups: [{label, tipTitle, values:[{v, cls, name}]}] */
/* Charts are drawn after layout at the panel's real width, so text stays at its true size. */
const chartSpecs = [];
function barChart(groups, opts = {}) {
  chartSpecs.push([groups, opts]);
  return `<div class="chart-host" data-chart="${chartSpecs.length - 1}" style="height:${opts.height || 220}px"></div>`;
}
function drawCharts() {
  $$('.chart-host').forEach((h) => { const spec = chartSpecs[h.dataset.chart]; if (spec) h.innerHTML = drawBarChart(spec[0], { ...spec[1], width: h.clientWidth }); });
}
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawCharts, 80); });
function drawBarChart(groups, { height = 220, width = 640 } = {}) {
  const W = Math.max(240, width), H = height, L = 52, R = 8, T = 10, B = 26;
  const max = niceMax(Math.max(1, ...groups.flatMap((g) => g.values.map((x) => x.v))));
  const iw = W - L - R, ih = H - T - B, gw = iw / Math.max(1, groups.length);
  const n = groups[0]?.values.length || 1;
  const bw = Math.min(28, (gw * 0.72) / n);
  const ticks = [0, .25, .5, .75, 1].map((f) => max * f);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  for (const t of ticks) { const y = T + ih - (t / max) * ih; s += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="axis" x="${L - 8}" y="${y + 4}" text-anchor="end">${esc(money(t, { compact: true, short: true }))}</text>`; }
  const every = Math.ceil(groups.length / Math.max(2, Math.floor(iw / 56)));
  groups.forEach((g, i) => {
    const gx = L + i * gw; const totalW = n * bw + (n - 1) * 2; const x0 = gx + (gw - totalW) / 2;
    const tipHtml = `${esc(g.tipTitle || g.label)}<br>${g.values.map((x) => `${esc(x.name)}: <b>${esc(money(x.v))}</b>`).join('<br>')}`;
    s += `<g class="grp" data-tip="${esc(tipHtml)}"><rect class="hit" x="${gx}" y="${T}" width="${gw}" height="${ih}"/>`;
    g.values.forEach((x, j) => { const h = (x.v / max) * ih; s += `<path class="${x.cls}" d="${roundTopRect(x0 + j * (bw + 2), T + ih - h, bw, h)}"/>`; });
    s += '</g>';
    if (i % every === 0) s += `<text class="axis" x="${gx + gw / 2}" y="${H - 8}" text-anchor="middle">${esc(g.label)}</text>`;
  });
  s += `<line class="baseline" x1="${L}" x2="${W - R}" y1="${T + ih}" y2="${T + ih}"/></svg>`;
  return s;
}
function hbars(rows, total) {
  if (!rows.length) return '';
  const max = Math.max(...rows.map((r) => r.v));
  return `<div class="hbars">${rows.map((r) => `<div class="hbar" data-tip="${esc(`${esc(r.name)}<br><b>${esc(money(r.v))}</b> · ${total ? Math.round(r.v / total * 100) : 0}% of spending${r.n ? `<br>${r.n} transaction${r.n > 1 ? 's' : ''}` : ''}`)}">
    <div class="lbl"><i class="dot" style="background:${r.color}"></i>${esc(r.name)}</div>
    <div class="track"><i style="width:${(r.v / max) * 100}%"></i></div>
    <div class="v">${moneyHtml(r.v, { short: true })}<small>${total ? Math.round(r.v / total * 100) : 0}%</small></div></div>`).join('')}</div>`;
}
function categoryRows(list) {
  const by = {};
  for (const t of list) { const k = t.categoryId || '_'; (by[k] ||= { v: 0, n: 0 }); by[k].v += t.amount; by[k].n++; }
  return Object.entries(by).map(([id, x]) => ({ id, name: catName(id), color: cat(id)?.color || '#5f6b66', v: round2(x.v), n: x.n })).sort((a, b) => b.v - a.v);
}
function ring(pct) {
  const r = 26, c = 2 * Math.PI * r, p = clamp(pct, 0, 1);
  return `<svg class="ring" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="${r}"/><circle class="fg" cx="32" cy="32" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/><text x="32" y="33">${Math.round(pct * 100)}%</text></svg>`;
}

/* ================= calculator ================= */
/* Works out a sum like "1200+350*2", "1000-10%" or "(450+120)/3". No eval(): a small parser that only
   knows numbers, + − × ÷, % and brackets. "x+10%" adds 10% of x, like a shop calculator; "15%" alone is 0.15.
   Returns the answer rounded to cents, or null if it isn't a sum it understands. */
function calcEval(text) {
  let s = String(text ?? '').replace(/[,\s]/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/[+\-*/]+$/, '');
  if (!s) return null;
  s += ')'.repeat(Math.max(0, (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length)); // close forgotten brackets
  let i = 0;
  const fail = () => { throw new Error('not a sum'); };
  const num = () => { const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)); if (!m) fail(); i += m[0].length; return parseFloat(m[0]); };
  // One number or bracket. pct: it was written as a percentage ("10%").
  const factor = () => {
    if (s[i] === '-') { i++; const f = factor(); return { v: -f.v, pct: f.pct }; }
    if (s[i] === '+') { i++; return factor(); }
    let v;
    if (s[i] === '(') { i++; v = expr(); if (s[i] !== ')') fail(); i++; } else v = num();
    if (s[i] === '%') { i++; return { v: v / 100, pct: true }; }
    return { v, pct: false };
  };
  const term = () => {
    let { v, pct } = factor();
    while (s[i] === '*' || s[i] === '/') {
      const op = s[i++]; const g = factor(); pct = false;
      if (op === '*') v *= g.v; else { if (!g.v) fail(); v /= g.v; }
    }
    return { v, pct };
  };
  function expr() {
    let v = term().v;
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++]; const t = term(); const rhs = t.pct ? v * t.v : t.v;
      v = op === '+' ? v + rhs : v - rhs;
    }
    return v;
  }
  try { const v = expr(); return i === s.length && Number.isFinite(v) ? round2(v) : null; } catch { return null; }
}
/* Amount boxes (class "calc") take sums: the answer replaces the sum when you leave the box, press Enter
   or tap Save. A sum that can't be worked out is marked red and the Save button waits. */
const PLAIN_NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;
function settleCalc(input) {
  const v = input.value.trim();
  if (!v || PLAIN_NUMBER.test(v)) { input.removeAttribute('aria-invalid'); return true; }
  const r = calcEval(v);
  if (r === null) { input.setAttribute('aria-invalid', 'true'); return false; }
  input.value = String(r); input.removeAttribute('aria-invalid');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}
document.addEventListener('focusout', (e) => { if (e.target.matches?.('input.calc')) settleCalc(e.target); }, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches?.('input.calc')) settleCalc(e.target); }, true);
// Runs before any button's own click, so Save always sees the answer, never "1200+350".
document.addEventListener('click', (e) => {
  if (e.target.closest?.('#calcPad')) return;
  const bad = $$('input.calc').filter((x) => !settleCalc(x));
  const btn = e.target.closest?.('.btn.primary');
  const box = btn?.closest('.modal, .page');
  const mine = box && bad.find((x) => box.contains(x));
  if (mine) { e.preventDefault(); e.stopPropagation(); toast('That amount isn’t a sum the calculator understands'); mine.focus(); }
}, true);

/* A calculator button inside every amount box opens the keypad. Added to boxes as they appear on screen. */
function addCalcButtons(root = document) {
  $$('input.calc:not([data-calc-ready])', root).forEach((input) => {
    input.dataset.calcReady = '1';
    const focused = document.activeElement === input; // moving a box loses its focus: give it back
    const wrap = document.createElement('span'); wrap.className = 'calc-wrap';
    input.replaceWith(wrap); wrap.appendChild(input);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'calc-btn'; b.setAttribute('aria-label', 'Open calculator'); b.innerHTML = icon('calc');
    b.onclick = (e) => { e.preventDefault(); calcPad(input); };
    wrap.appendChild(b);
    if (focused) { input.focus(); input.select?.(); }
  });
}
if (typeof MutationObserver !== 'undefined') new MutationObserver(() => addCalcButtons()).observe(document.body, { childList: true, subtree: true });

/* The keypad. With an amount box, "Use" puts the answer into it; on its own (Calculator page) it's just a calculator. */
const CALC_KEYS = ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '00', '0', '.', '='];
const CALC_OPS = '+−×÷';
function calcPad(input = null) {
  closeCalcPad();
  const start = input ? input.value.trim() : '';
  let expr = calcEval(start) === null ? '' : start.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
  const ov = document.createElement('div'); ov.className = 'calc-ov'; ov.id = 'calcPad';
  ov.innerHTML = `<div class="calc-pad" role="dialog" aria-modal="true" aria-label="Calculator">
    <div class="calc-screen"><div class="calc-expr" aria-live="polite"></div><div class="calc-res"></div></div>
    <div class="calc-keys">${CALC_KEYS.map((k) => `<button type="button" data-k="${k}" class="${CALC_OPS.includes(k) || k === '%' ? 'op' : ''} ${k === '=' ? 'eq' : ''}" aria-label="${{ '⌫': 'Delete', C: 'Clear', '−': 'Minus', '×': 'Times', '÷': 'Divide by' }[k] || k}">${k}</button>`).join('')}</div>
    <div class="calc-foot"><button type="button" class="btn" data-calc-close>${input ? 'Cancel' : 'Close'}</button>${input ? '<button type="button" class="btn primary" id="calcUse"></button>'
      : '<button type="button" class="btn" data-calc-add="income">+ Income</button><button type="button" class="btn primary" data-calc-add="expense">+ Expense</button>'}</div></div>`;
  const show = () => {
    const r = calcEval(expr);
    $('.calc-expr', ov).textContent = expr || '0';
    $('.calc-res', ov).textContent = r !== null && !PLAIN_NUMBER.test(expr.replace(/−/g, '-')) ? '= ' + money(r) : '';
    const use = $('#calcUse', ov); if (use) { use.textContent = r !== null ? `Use ${money(r)}` : 'Use'; use.disabled = r === null; }
    $$('[data-calc-add]', ov).forEach((b) => { b.disabled = !(r > 0); });
  };
  const press = (k) => {
    const last = expr.slice(-1);
    if (k === 'C') expr = '';
    else if (k === '⌫') expr = expr.slice(0, -1);
    else if (k === '=') { const r = calcEval(expr); if (r !== null) expr = String(r).replace('-', '−'); }
    else if (CALC_OPS.includes(k)) {
      if (!expr) { if (k === '−') expr = '−'; }
      else if (CALC_OPS.includes(last)) expr = expr.slice(0, -1) + k; // changed their mind: swap the sign
      else expr += k;
    } else if (k === '%') { if (/[\d.]/.test(last)) expr += '%'; }
    else if (k === '.') { const n = expr.split(/[+−×÷%]/).pop(); if (!n.includes('.')) expr += n ? '.' : '0.'; }
    else if (last !== '%' && expr.length < 40) expr += k;
    show();
  };
  const use = () => {
    const r = calcEval(expr); if (r === null) return;
    input.value = String(r); input.removeAttribute('aria-invalid');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    closeCalcPad();
  };
  // Typing works too. Keys go to the keypad only, so the app's own shortcuts (N, I, Esc) don't fire behind it.
  const KEYMAP = { '*': '×', x: '×', '/': '÷', '-': '−', Backspace: '⌫', Delete: 'C', ',': '.' };
  ov._keys = (e) => {
    if (e.key === 'Escape') closeCalcPad();
    else if (e.key === 'Enter') { if (input) use(); else press('='); }
    else { const k = KEYMAP[e.key] || e.key; if (CALC_KEYS.includes(k)) press(k); else return; }
    e.preventDefault(); e.stopPropagation();
  };
  window.addEventListener('keydown', ov._keys, true);
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeCalcPad(); });
  $$('[data-k]', ov).forEach((b) => b.onclick = () => press(b.dataset.k));
  $('[data-calc-close]', ov).onclick = closeCalcPad;
  if (input) $('#calcUse', ov).onclick = use;
  // On its own: the answer can go straight into a new income or expense.
  $$('[data-calc-add]', ov).forEach((b) => b.onclick = () => { const r = calcEval(expr); if (!(r > 0)) return; closeCalcPad(); txForm({ type: b.dataset.calcAdd, amount: r }); });
  document.activeElement?.blur?.(); // on phones: hide the typing keyboard, the keypad replaces it
  document.body.appendChild(ov);
  show();
  return ov;
}
function closeCalcPad() {
  const ov = $('#calcPad'); if (!ov) return;
  window.removeEventListener('keydown', ov._keys, true); ov.remove();
}

/* Money tools (the Calculator page). Plain sums, kept apart so the tests can check them. */
const toolMath = {
  discount: (price, pct) => { const off = round2(price * pct / 100); return { off, pay: round2(price - off) }; },
  split: (total, people, extraPct = 0) => { const all = round2(total * (1 + extraPct / 100)); return { all, each: round2(all / people) }; },
  // Monthly payment of a loan or lease: amount × r / (1 − (1 + r)^−months), r = yearly rate ÷ 12.
  loan: (amount, yearRate, months) => {
    const r = yearRate / 1200; const pay = r ? amount * r / (1 - Math.pow(1 + r, -months)) : amount / months;
    return { monthly: round2(pay), total: round2(pay * months), interest: round2(pay * months - amount) };
  },
  saving: (target, saved, days) => {
    const left = round2(Math.max(0, target - saved));
    return { left, perWeek: round2(left / Math.max(1, days / 7)), perMonth: round2(left / Math.max(1, days / 30.4375)) };
  },
};
const TOOLS = [
  ['discount', 'Discount or percentage', [['price', 'Price'], ['pct', 'Discount %', 'e.g. 15']]],
  ['split', 'Split a bill', [['total', 'Bill total'], ['people', 'People', 'e.g. 4'], ['extra', 'Service charge or tip %', 'optional']]],
  ['loan', 'Loan or lease: monthly payment', [['amount', 'Loan amount'], ['rate', 'Interest % per year', 'e.g. 12'], ['months', 'Months', 'e.g. 24']]],
  ['saving', 'Saving for something', [['target', 'Target amount'], ['saved', 'Already saved', 'optional'], ['date', 'By date']]],
];
function toolResult(tool) {
  const v = ui.tools[tool] || {};
  const n = (k) => calcEval(v[k]);
  const row = (label, value, strong) => `<div class="tool-row ${strong ? 'strong' : ''}"><span>${label}</span><b>${moneyHtml(value)}</b></div>`;
  const wait = (text) => `<p class="hint">${text}</p>`;
  if (tool === 'discount') {
    if (!(n('price') > 0) || n('pct') === null) return wait('Enter a price and a percentage.');
    const r = toolMath.discount(n('price'), n('pct'));
    return row('You save', r.off) + row('You pay', r.pay, true) + `<button class="btn small" data-tool-add="${r.pay}">${icon('plus')}Add as expense</button>`;
  }
  if (tool === 'split') {
    const people = Math.round(n('people') || 0);
    if (!(n('total') > 0) || people < 1) return wait('Enter the bill total and how many people.');
    const r = toolMath.split(n('total'), people, n('extra') || 0);
    return row('Total to pay', r.all) + row('Each person pays', r.each, true) + `<button class="btn small" data-tool-add="${r.each}">${icon('plus')}Add my share as expense</button>`;
  }
  if (tool === 'loan') {
    const months = Math.round(n('months') || 0);
    if (!(n('amount') > 0) || n('rate') === null || n('rate') < 0 || months < 1) return wait('Enter the amount, the yearly interest and the number of months.');
    const r = toolMath.loan(n('amount'), n('rate'), months);
    return row('Each month', r.monthly, true) + row('Interest in total', r.interest) + row('You pay back', r.total);
  }
  if (tool === 'saving') {
    if (!(n('target') > 0) || !v.date) return wait('Enter what you need and by when.');
    const days = daysBetween(today(), v.date);
    if (days < 1) return wait('Pick a date after today.');
    const r = toolMath.saving(n('target'), n('saved') || 0, days);
    if (!r.left) return wait('You already have enough. Well done!');
    return row('Still needed', r.left) + row('Put aside each week', r.perWeek, true) + row('or each month', r.perMonth)
      + `<button class="btn small" data-tool-goal="${n('target')}" data-tool-saved="${n('saved') || 0}" data-tool-date="${esc(v.date)}">${icon('flag')}Make it a savings goal</button>`;
  }
  return '';
}
function viewTools() {
  const sym = esc(state.settings.symbol);
  const isMoney = new Set(['price', 'total', 'amount', 'target', 'saved']);
  const cards = TOOLS.map(([tool, title, fields]) => `<div class="panel tool"><h2>${title}</h2><div class="tool-fields">${fields.map(([k, label, ph]) => {
    const value = esc(ui.tools[tool]?.[k] ?? '');
    return `<label class="field"><span>${label}${isMoney.has(k) ? ` (${sym})` : ''}</span>${k === 'date'
      ? `<input class="input" type="date" data-tool="${tool}" data-f="${k}" min="${addDays(today(), 1)}" value="${value}">`
      : `<input class="input${isMoney.has(k) ? ' calc' : ''}" type="text" inputmode="decimal" autocomplete="off" data-tool="${tool}" data-f="${k}" placeholder="${ph || '0'}" value="${value}">`}</label>`;
  }).join('')}</div><div class="tool-out" id="out-${tool}">${toolResult(tool)}</div></div>`).join('');
  return `<div class="head"><div><h1>Calculator</h1><p>Quick money sums. You can also type a sum like 1200+350 in any amount box, or tap the ${icon('calc')} button in it.</p></div>
    <div class="actions"><button class="btn primary" id="openPad">${icon('calc')}Open calculator</button></div></div>
    <div class="tools">${cards}</div>`;
}
function bindTools(root) {
  $('#openPad', root).onclick = () => calcPad();
  const bindOut = (out) => {
    $$('[data-tool-add]', out).forEach((b) => b.onclick = () => txForm({ type: 'expense', amount: +b.dataset.toolAdd }));
    $$('[data-tool-goal]', out).forEach((b) => b.onclick = () => goalForm({ target: +b.dataset.toolGoal, saved: +b.dataset.toolSaved, deadline: b.dataset.toolDate }));
  };
  $$('.tool-out', root).forEach(bindOut);
  $$('[data-tool]', root).forEach((input) => input.oninput = () => {
    const tool = input.dataset.tool;
    (ui.tools[tool] ||= {})[input.dataset.f] = input.value;
    const out = $('#out-' + tool, root); out.innerHTML = toolResult(tool); bindOut(out);
  });
}

/* ================= views ================= */
/* On phones only the first four pages fit in the bottom bar; the rest live behind "More". */
const PHONE_BAR = ['dashboard', 'transactions', 'budgets', 'reports'];
const NAV = [
  ['dashboard', 'This week', 'home'], ['transactions', 'Transactions', 'list'], ['budgets', 'Budgets', 'target'],
  ['goals', 'Savings goals', 'flag'], ['recurring', 'Scheduled', 'repeat'], ['reports', 'Reports', 'chart'],
  ['accounts', 'Accounts', 'wallet'], ['tools', 'Calculator', 'calc'], ['settings', 'Settings', 'gear'],
];

function greeting() {
  const h = now().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return state.settings.name ? `${part}, ${state.settings.name}` : part;
}

function viewDashboard() {
  const w = weekInfo(); const s = state.settings; const t = today();
  const mFrom = monthStart(t), mTo = monthEnd(t);
  const mInc = sum(incomeIn(mFrom, mTo), (x) => x.amount), mExp = sum(expensesIn(mFrom, mTo), (x) => x.amount);
  const lastW = weekInfo(addDays(w.start, -7));
  const lastWSamePoint = sum(lastW.days.slice(0, w.todayIdx + 1), (d) => d.spent);
  const elapsed = w.todayIdx + 1;
  const projected = round2((w.spent / elapsed) * 7);
  const noSpend = w.days.slice(0, w.todayIdx).filter((d) => d.spent === 0).length;

  /* The big number: what's left to spend today (with a weekly limit) or what was spent this week (without one).
     Under it, today's money in two boxes; the week in one row of chips below the bars. */
  const incomeToday = round2(sum(incomeIn(t, t), (x) => x.amount));
  const mini = (label, value, cls = '') => `<div class="mini"><span>${label}</span><b class="${cls}">${value}</b></div>`;
  const incomeMini = mini('Income today', incomeToday ? '+' + moneyHtml(incomeToday) : moneyHtml(0), 'pos');
  let lead;
  if (!w.B) {
    const expensesToday = round2(sum(expensesIn(t, t), (x) => x.amount)); // every expense today, also rent and bills
    lead = `<div class="runway-lead"><div class="label">Spent this week</div><div class="big plain">${moneyHtml(w.spent)}</div>
      <div class="today-pair">${incomeMini}${mini('Expenses today', moneyHtml(expensesToday), 'neg')}</div>
      <button class="link-btn" id="setBudget">Set a weekly limit →</button></div>`;
  } else {
    const over = w.leftToday < 0;
    lead = `<div class="runway-lead">
      <div class="label">${over ? 'Over today’s share by' : 'Left to spend today'}</div>
      <div class="big ${over ? 'over' : ''}">${moneyHtml(Math.abs(w.leftToday))}</div>
      <div class="today-pair">${mini('Spent today', moneyHtml(w.spentToday), 'neg')}${incomeMini}</div>
      <button class="link-btn" id="setBudget">Change weekly limit (${esc(money(w.B, { short: true }))})</button></div>`;
  }
  const even = w.B / 7;
  // Today's and the coming days' shares count too (with room above), so their dashed lines sit inside the bars, not off the top.
  const scaleMax = Math.max(even * 1.5, ...w.days.map((d) => d.spent), w.allowanceToday * 1.15, w.perDayAfter * 1.15, 1);
  const daysHtml = w.days.map((d, i) => {
    const dt = parseISO(d.date); const future = i > w.todayIdx; const isToday = i === w.todayIdx;
    const allowance = future ? w.perDayAfter : (isToday ? w.allowanceToday : even);
    const h = (d.spent / scaleMax) * 100; const ah = w.B ? Math.min(97, (allowance / scaleMax) * 100) : 0;
    const over = w.B && d.spent > allowance + 0.001;
    const tipTxt = `${fmtDate(d.date, { full: true })}<br>${future ? `Plan up to <b>${esc(money(allowance))}</b>` : `Spent <b>${esc(money(d.spent))}</b>${w.B ? `<br>Daily share ${esc(money(allowance))}` : ''}`}`;
    return `<div class="day ${future ? 'future' : ''} ${isToday ? 'today' : ''}" data-tip="${esc(tipTxt)}">
      <div class="amt">${future ? (w.B && allowance > 0 ? moneyHtml(allowance, { short: true }) : '&nbsp;') : (d.spent > 0 ? moneyHtml(d.spent, { short: true }) : '&nbsp;')}</div>
      <div class="col">${future ? '' : `<div class="fill ${over ? 'over' : ''}" style="height:${h}%"></div>`}${w.B ? `<div class="allow" style="bottom:${ah}%"></div>` : ''}</div>
      <div class="dn">${isToday ? 'Today' : DAY_SHORT[dt.getDay()]}</div></div>`;
  }).join('');
  const diff = w.spent - lastWSamePoint;
  const chip = (html, cls = '') => `<span class="chip ${cls}">${html}</span>`;
  const notes = `<div class="runway-note">
    ${w.B ? chip(w.remaining >= 0 ? `<b>${money(w.remaining, { short: true })}</b> left this week` : `<b>${money(-w.remaining, { short: true })}</b> over this week`, w.remaining >= 0 ? '' : 'neg') : ''}
    ${w.spent ? chip(`On pace for <b>${money(projected, { short: true })}</b>`, w.B && projected > w.B ? 'neg' : '') : ''}
    ${round2(diff) ? chip(`<b>${money(diff, { sign: true, short: true })}</b> vs last week`, diff > 0 ? 'neg' : 'pos') : ''}
    ${chip(`<b>${noSpend}</b> no-spend day${noSpend === 1 ? '' : 's'}`)}
  </div>`;

  // budget alerts
  const alerts = budgetStatus().filter((b) => b.ratio >= .9);
  const alertHtml = alerts.length ? `<div class="alert ${alerts.some((a) => a.ratio > 1) ? 'over' : 'warn'}">${icon('alert')}<div>${alerts.map((a) => `<b>${esc(a.name)}</b> ${a.ratio > 1 ? `is ${money(a.spent - a.amount)} over its ${a.period} budget` : `has ${money(a.amount - a.spent)} left this ${a.period === 'weekly' ? 'week' : 'month'}`}`).join(' · ')}</div></div>` : '';

  const weekEx = expensesIn(w.start, w.end);
  const recent = newestFirst(state.transactions).slice(0, 7);
  const upcoming = state.recurring.filter((r) => r.active && r.nextDate <= addDays(t, 14)).sort((a, b) => a.nextDate.localeCompare(b.nextDate)).slice(0, 5);
  const saved = mInc - mExp;

  return `<div class="head home-head"><div class="head-title"><h1>${esc(greeting())}</h1><p>${DAY_LONG[parseISO(t).getDay()]}, ${parseISO(t).getDate()} ${MONTH_LONG[parseISO(t).getMonth()]}</p></div>
    <div class="head-tools">${cloudButton()}${themeToggle()}</div>
    <div class="actions"><button class="btn" data-add="income">${icon('plus')}Income</button><button class="btn primary" data-add="expense">${icon('plus')}Expense</button><button class="btn calc-open" data-calc-pad aria-label="Calculator" title="Calculator">${icon('calc')}</button></div></div>
    <section class="runway" aria-label="Today and this week">${lead}<div class="days">${daysHtml}</div>${notes}</section>
    ${alertHtml}
    ${backupCard()}
    <div class="stats">
      <div class="stat"><div class="k">Total balance</div><div class="v ${totalBalance() < 0 ? 'neg' : ''}">${moneyHtml(totalBalance())}</div><div class="d">${state.accounts.length} account${state.accounts.length === 1 ? '' : 's'}</div></div>
      <div class="stat"><div class="k">Income in ${MONTH_SHORT[now().getMonth()]}</div><div class="v pos">${moneyHtml(mInc)}</div><div class="d">${plural(incomeIn(mFrom, mTo).length, 'payment')}</div></div>
      <div class="stat"><div class="k">Spent in ${MONTH_SHORT[now().getMonth()]}</div><div class="v neg">${moneyHtml(mExp)}</div><div class="d">${money(mExp / Math.max(1, parseISO(t).getDate()), { short: true })} a day on average</div></div>
      <div class="stat"><div class="k">Kept this month</div><div class="v ${saved < 0 ? 'neg' : ''}">${moneyHtml(saved)}</div><div class="d">${mInc ? `<span class="${saved > 0 ? 'pos' : saved < 0 ? 'neg' : ''}">${Math.round(saved / mInc * 100)}% of income</span>` : 'Add income to see your savings rate'}</div></div>
    </div>
    <div class="cols">
      <div class="panel"><h2>Where this week’s money went <small>${money(sum(weekEx, (x) => x.amount))}</small></h2>
        ${weekEx.length ? hbars(categoryRows(weekEx), sum(weekEx, (x) => x.amount)) : empty('chart', 'Nothing spent yet this week', 'Log each expense as it happens. Press N to add one quickly.')}</div>
      <div class="panel"><h2>Recent <button class="btn small ghost" data-go="transactions">See all</button></h2>
        ${recent.length ? `<div class="tx-list">${recent.map(txRow).join('')}</div>` : empty('list', 'No transactions yet', 'Your latest income and spending will show here.', `<button class="btn primary" data-add="expense">${icon('plus')}Add your first expense</button>`)}</div>
    </div>
    <div class="cols">
      <div class="panel"><h2>Budgets <button class="btn small ghost" data-go="budgets">Manage</button></h2>${budgetMeters(4) || empty('target', 'No category budgets', 'Cap the categories that drain you most, like eating out.', `<button class="btn" data-go="budgets">Create a budget</button>`)}</div>
      <div class="panel"><h2>Coming up <button class="btn small ghost" data-go="recurring">Manage</button></h2>
        ${upcoming.length ? `<div class="tx-list">${upcoming.map((r) => `<div class="tx"><div class="glyph" style="background:${cat(r.categoryId)?.color || '#5f6b66'}">${esc(catName(r.categoryId)[0])}</div><div style="min-width:0"><div class="t1">${esc(r.note || catName(r.categoryId))}</div><div class="t2">${fmtDate(r.nextDate)} · ${FREQ[r.frequency]}</div></div><div class="amt ${r.type === 'income' ? 'pos' : ''}">${moneyHtml(r.type === 'income' ? r.amount : -r.amount, { sign: true })}</div><div></div></div>`).join('')}</div>`
        : empty('repeat', 'Nothing scheduled', 'Add salary, rent or subscriptions once and they’ll be logged automatically.', `<button class="btn" data-go="recurring">Schedule a payment</button>`)}</div>
    </div>`;
}

function backupCard() {
  const days = backupDue();
  if (!days) return '';
  const why = state.settings.lastBackup ? `It’s been ${days} days since your last backup.` : 'You haven’t saved a backup yet.';
  return `<div class="alert backup" role="status">${icon('download')}
    <div><b>Back up your money history.</b> ${why} If your phone is reset or the app is deleted, a backup is the only way to get it back.</div>
    <div class="alert-actions"><button class="btn small primary" id="backupNow">Save backup</button><button class="btn small ghost" id="backupLater">Remind me in 7 days</button></div></div>`;
}

/* ---------- transactions ---------- */
function periodRange(p, from, to) {
  const t = today();
  switch (p) {
    case 'week': return [weekStartOf(t), addDays(weekStartOf(t), 6)];
    case 'month': return [monthStart(t), monthEnd(t)];
    case 'lastmonth': { const d = addMonths(monthStart(t), -1); return [d, monthEnd(d)]; }
    case '30': return [addDays(t, -29), t];
    case '3m': return [addMonths(monthStart(t), -2), monthEnd(t)];
    case 'year': return [t.slice(0, 4) + '-01-01', t.slice(0, 4) + '-12-31'];
    case 'custom': return [from || '', to || ''];
    default: return ['', ''];
  }
}
function filteredTx() {
  const f = ui.tx;
  if (f.cat !== 'all' && !cat(f.cat)) f.cat = 'all';
  if (f.acc !== 'all' && !acc(f.acc)) f.acc = 'all'; const [from, to] = periodRange(f.period, f.from, f.to); const q = f.q.trim().toLowerCase();
  return newestFirst(state.transactions.filter((t) => inRange(t, from, to)
    && (f.type === 'all' || t.type === f.type)
    && (f.cat === 'all' || t.categoryId === f.cat)
    && (f.acc === 'all' || t.accountId === f.acc || t.toAccountId === f.acc)
    && (!q || (t.note || '').toLowerCase().includes(q) || catName(t.categoryId).toLowerCase().includes(q) || String(t.amount).includes(q))));
}
function viewTransactions() {
  const f = ui.tx; const list = filteredTx();
  const inc = sum(list.filter((t) => t.type === 'income'), (t) => t.amount), ex = sum(list.filter((t) => t.type === 'expense'), (t) => t.amount);
  const periods = [['week', 'This week'], ['month', 'This month'], ['lastmonth', 'Last month'], ['30', 'Last 30 days'], ['3m', 'Last 3 months'], ['year', 'This year'], ['all', 'All time'], ['custom', 'Custom dates']];
  return `<div class="head"><div><h1>Transactions</h1><p>Search, filter and edit everything you’ve logged.</p></div>
    <div class="actions"><button class="btn" id="exportCsv">${icon('download')}Export CSV</button><button class="btn" data-add="income">${icon('plus')}Income</button><button class="btn primary" data-add="expense">${icon('plus')}Expense</button></div></div>
    <div class="panel">
      <div class="filters">
        <input class="input search" id="fq" placeholder="Search notes, categories or amounts" value="${esc(f.q)}">
        <select class="input" id="fperiod">${periods.map(([v, l]) => `<option value="${v}" ${f.period === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${f.period === 'custom' ? `<input class="input" type="date" id="ffrom" value="${f.from}"><input class="input" type="date" id="fto" value="${f.to}">` : ''}
        <select class="input" id="ftype">${[['all', 'All types'], ['expense', 'Expenses'], ['income', 'Income'], ['transfer', 'Transfers']].map(([v, l]) => `<option value="${v}" ${f.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select class="input" id="fcat"><option value="all">All categories</option>${state.categories.map((c) => `<option value="${c.id}" ${f.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <select class="input" id="facc"><option value="all">All accounts</option>${accOptions(f.acc)}</select>
      </div>
      <div class="summary-bar"><span>Income <b class="pos">${moneyHtml(inc)}</b></span><span>Expenses <b>${moneyHtml(ex)}</b></span><span>Net <b class="${inc - ex < 0 ? 'neg' : ''}">${moneyHtml(inc - ex, { sign: true })}</b></span><span>${list.length} transaction${list.length === 1 ? '' : 's'}</span></div>
      ${list.length ? txListGrouped(list) : empty('search', state.transactions.length ? 'No matches' : 'No transactions yet', state.transactions.length ? 'Try a different period or clear the search.' : 'Add income and expenses to start tracking.', state.transactions.length ? '' : `<button class="btn primary" data-add="expense">${icon('plus')}Add expense</button>`)}
    </div>`;
}
function bindTransactions(root) {
  const f = ui.tx;
  const rerender = () => { render(); };
  const q = $('#fq', root);
  q.oninput = () => { f.q = q.value; const pos = q.selectionStart; render(); const n = $('#fq'); n.focus(); n.setSelectionRange(pos, pos); };
  $('#fperiod', root).onchange = (e) => { f.period = e.target.value; rerender(); };
  $('#ftype', root).onchange = (e) => { f.type = e.target.value; rerender(); };
  $('#fcat', root).onchange = (e) => { f.cat = e.target.value; rerender(); };
  $('#facc', root).onchange = (e) => { f.acc = e.target.value; rerender(); };
  $('#ffrom', root) && ($('#ffrom', root).onchange = (e) => { f.from = e.target.value; rerender(); });
  $('#fto', root) && ($('#fto', root).onchange = (e) => { f.to = e.target.value; rerender(); });
  $('#exportCsv', root).onclick = () => exportCsv(filteredTx());
}
async function exportCsv(list) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'To account', 'Note']];
  for (const t of [...list].sort((a, b) => a.date.localeCompare(b.date)))
    rows.push([t.date, t.type, t.amount.toFixed(2), state.settings.currency, t.type === 'transfer' ? '' : catName(t.categoryId), acc(t.accountId)?.name || '', t.toAccountId ? acc(t.toAccountId)?.name : (t.goalId ? 'Goal: ' + (state.goals.find((g) => g.id === t.goalId)?.name || '') : ''), t.note]);
  const csv = rows.map((r) => r.map(q).join(',')).join('\r\n');
  await saveText(`transactions-${today()}.csv`, csv, 'text/csv');
}
/* Saves a text file and returns true if it was saved, false if the person cancelled. */
async function saveText(name, text, mime) {
  if (hasApi()) {
    const p = await window.pywebview.api.save_file(name, text);
    if (p) toast('Saved to ' + p);
    return !!p;
  }
  // Android app (.apk): the WebView can't download, so write the file to the app's cache and open the share sheet.
  if (isNativeApp()) {
    const { Filesystem, Share } = window.Capacitor.Plugins;
    try {
      const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
      await Share.share({ title: name, files: [uri] });
      return true;
    } catch (e) {
      if (/cancel/i.test(String(e?.message || e))) return false;
      toast('Could not save ' + name); return false;
    }
  }
  // Phones: open the share sheet, which offers "Save to Files", Drive, WhatsApp...
  const file = typeof File === 'function' ? new File([text], name, { type: mime }) : null;
  if (file && navigator.canShare?.({ files: [file] }) && matchMedia('(hover: none)').matches) {
    try { await navigator.share({ files: [file], title: name }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; } // cancelled; other errors fall back to download
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click();
  toast('Downloaded ' + name);
  return true;
}

/* ---------- backups ---------- */
const BACKUP_EVERY_DAYS = 14;
/* Returns how many days since the last backup if a reminder is due, otherwise 0. */
function backupDue(st = state, t = today()) {
  if (st.transactions.length < 5) return 0;                                   // nothing much to lose yet
  if (st.settings.backupSnoozeUntil && t < st.settings.backupSnoozeUntil) return 0; // "remind me later"
  const since = st.settings.lastBackup || st.transactions.map((x) => x.date).sort()[0];
  const days = daysBetween(since, t);
  return days >= BACKUP_EVERY_DAYS ? days : 0;
}
async function saveBackup() {
  const ok = await saveText(`pocket-ledger-backup-${today()}.json`, JSON.stringify(state, null, 1), 'application/json');
  if (!ok) return;
  state.settings.lastBackup = today();
  state.settings.backupSnoozeUntil = '';
  save(); render();
  toast('Backup saved');
}
function snoozeBackup() {
  state.settings.backupSnoozeUntil = addDays(today(), 7);
  save(); render();
  toast('We’ll remind you in 7 days');
}
function lastBackupText() {
  const lb = state.settings.lastBackup;
  if (!lb) return 'No backup saved yet.';
  const d = daysBetween(lb, today());
  return `Last backup: ${fmtDate(lb, { full: true })}${d ? ` (${plural(d, 'day')} ago)` : ' (today)'}.`;
}

/* ---------- budgets ---------- */
function budgetStatus() {
  const t = today();
  return state.budgets.map((b) => {
    const [from, to] = b.period === 'weekly' ? [weekStartOf(t), addDays(weekStartOf(t), 6)] : [monthStart(t), monthEnd(t)];
    const spent = round2(sum(expensesIn(from, to).filter((x) => x.categoryId === b.categoryId), (x) => x.amount));
    const daysLeft = daysBetween(t, to) + 1;
    return { ...b, name: catName(b.categoryId), color: cat(b.categoryId)?.color, spent, ratio: b.amount ? spent / b.amount : 0, daysLeft };
  });
}
function meter(b, withActions) {
  const cls = b.ratio > 1 ? 'over' : b.ratio >= .8 ? 'warn' : '';
  const status = b.ratio > 1 ? `<span class="status over">${icon('alert').replace('<svg', '<svg width="14" height="14"')}Over by ${money(b.spent - b.amount)}</span>`
    : b.ratio >= .8 ? `<span class="status warn">Almost used</span>` : `<span class="status ok">On track</span>`;
  const left = b.amount - b.spent;
  return `<div class="meter"><div class="meter-top"><span class="name"><i class="dot" style="background:${b.color || '#5f6b66'}"></i>${esc(b.name)} <span class="tag">${b.period === 'weekly' ? 'Weekly' : 'Monthly'}</span></span>
    <span class="vals">${money(b.spent, { short: true })} / ${money(b.amount, { short: true })}${withActions ? ` <button class="icon-btn" data-edit-budget="${b.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-del-budget="${b.id}" aria-label="Delete">${icon('trash')}</button>` : ''}</span></div>
    <div class="bar ${cls}"><i style="width:${clamp(b.ratio * 100, 0, 100)}%"></i></div>
    <div class="meter-foot">${status}<span>${left > 0 ? `${money(left / b.daysLeft, { short: true })} a day for ${b.daysLeft} day${b.daysLeft > 1 ? 's' : ''}` : 'Nothing left this ' + (b.period === 'weekly' ? 'week' : 'month')}</span></div></div>`;
}
function budgetMeters(limit) {
  const list = budgetStatus().sort((a, b) => b.ratio - a.ratio).slice(0, limit || 99);
  return list.map((b) => meter(b, !limit)).join('');
}
function viewBudgets() {
  const w = weekInfo(); const s = state.settings;
  const excluded = state.categories.filter((c) => c.type === 'expense' && c.weekly === false).map((c) => c.name);
  return `<div class="head"><div><h1>Budgets</h1><p>Limits keep a good week from turning into an empty wallet on Friday.</p></div>
    <div class="actions"><button class="btn primary" id="addBudget">${icon('plus')}New category budget</button></div></div>
    <div class="cols" style="margin-top:0">
      <div class="panel"><h2>Weekly spending limit</h2>
        ${s.weeklyBudget ? `<div class="meter" style="padding-top:0"><div class="meter-top"><span class="name">All everyday spending</span><span class="vals">${money(w.spent, { short: true })} / ${money(w.B, { short: true })}</span></div>
          <div class="bar ${w.spent > w.B ? 'over' : w.spent / w.B > .8 ? 'warn' : ''}"><i style="width:${clamp(w.spent / w.B * 100, 0, 100)}%"></i></div>
          <div class="meter-foot"><span>${money(Math.max(0, w.remaining))} left</span><span>${w.daysLeft} day${w.daysLeft > 1 ? 's' : ''} to go</span></div></div>` : '<p class="hint" style="margin-bottom:12px">You haven’t set a weekly limit yet.</p>'}
        <button class="btn" id="setBudget">${icon('edit')}${s.weeklyBudget ? 'Change limit' : 'Set weekly limit'}</button>
        <p class="hint" style="margin-top:12px">${excluded.length ? `Fixed costs are left out of this limit: ${esc(excluded.join(', '))}. Change this per category in Settings.` : 'All expense categories count toward this limit.'}</p>
      </div>
      <div class="panel"><h2>How the daily amount works</h2>
        <p style="margin:0 0 10px;color:var(--ink-2)">Your weekly limit is shared across the days left in the week. Spend less today and tomorrow’s share grows; overspend and the rest of the week gets tighter. The amount on the dashboard is always what you can spend today without running dry before the week ends.</p>
        <p class="hint">Tip: a good starting limit is your weekly income minus fixed bills and what you want to save.</p></div>
    </div>
    <div class="panel" style="margin-top:18px"><h2>Category budgets</h2>
      ${state.budgets.length ? budgetMeters() : empty('target', 'No category budgets yet', 'Set a cap on any category, weekly or monthly, and get warned as you get close.', `<button class="btn primary" id="addBudget2">${icon('plus')}New category budget</button>`)}</div>`;
}
function weeklyLimitForm() {
  const s = state.settings;
  openModal({
    title: 'Weekly spending limit',
    body: `<div class="stack"><label class="field"><span>Most I want to spend per week (${esc(s.symbol)})</span><input class="input amount calc" id="wb" type="text" inputmode="decimal" autocomplete="off" value="${s.weeklyBudget || ''}" placeholder="0" autofocus></label>
      <p class="hint">Fixed costs like rent and bills don’t count toward this. Set it to 0 to turn the limit off.</p></div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="wbSave">Save limit</button>',
    onMount: (m) => {
      const go = () => { s.weeklyBudget = round2(Math.max(0, parseFloat($('#wb', m).value) || 0)); save(); closeModal(); render(); toast('Weekly limit saved'); };
      // Braces matter: an onkeydown that returns false cancels the key, which blocked typing any number.
      $('#wbSave', m).onclick = go; $('#wb', m).onkeydown = (e) => { if (e.key === 'Enter') go(); };
    },
  });
}
function budgetForm(b = {}) {
  openModal({
    title: b.id ? 'Edit budget' : 'New category budget',
    body: `<div class="stack"><label class="field"><span>Category</span><select class="input" id="bc">${catOptions('expense', b.categoryId)}</select></label>
      <div class="grid2"><label class="field"><span>Limit (${esc(state.settings.symbol)})</span><input class="input calc" id="ba" type="text" inputmode="decimal" autocomplete="off" value="${b.amount || ''}" autofocus></label>
      <label class="field"><span>Resets</span><select class="input" id="bp"><option value="weekly" ${b.period === 'weekly' ? 'selected' : ''}>Every week</option><option value="monthly" ${b.period !== 'weekly' ? 'selected' : ''}>Every month</option></select></label></div></div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="bs">Save budget</button>',
    onMount: (m) => $('#bs', m).onclick = () => {
      const amount = round2(parseFloat($('#ba', m).value));
      if (!(amount > 0)) return toast('Enter a limit greater than zero');
      const rec = { id: b.id || uid(), categoryId: $('#bc', m).value, amount, period: $('#bp', m).value };
      if (!b.id && state.budgets.some((x) => x.categoryId === rec.categoryId && x.period === rec.period)) return toast('That category already has a ' + rec.period + ' budget');
      if (b.id) Object.assign(state.budgets.find((x) => x.id === b.id), rec); else state.budgets.push(rec);
      save(); closeModal(); render(); toast('Budget saved');
    },
  });
}

/* ---------- goals ---------- */
function viewGoals() {
  const t = today();
  const cards = state.goals.map((g) => {
    const pct = g.target ? g.saved / g.target : 0; const left = Math.max(0, g.target - g.saved);
    let plan = '';
    if (left <= 0) plan = '<span class="pos">Goal reached. Well done.</span>';
    else if (g.deadline) {
      const days = daysBetween(t, g.deadline);
      plan = days > 0 ? `Save ${money(left / Math.max(1, days / 7), { short: true })} a week to reach it by ${fmtDate(g.deadline, { full: true, noDay: true })}` : `<span class="neg">Deadline passed, ${money(left)} to go</span>`;
    } else plan = `${money(left)} to go`;
    return `<div class="card"><div class="top"><div><h3>${esc(g.name)}</h3><div class="meta">Target ${money(g.target)}</div></div>${ring(pct)}</div>
      <div class="big">${moneyHtml(g.saved)}</div><div class="meta">${plan}</div>
      <div class="foot"><button class="btn small primary" data-goal-add="${g.id}">${icon('plus')}Add money</button><button class="btn small" data-goal-take="${g.id}">${icon('minus')}Take out</button>
      <button class="icon-btn" data-goal-edit="${g.id}" aria-label="Edit goal" style="margin-left:auto">${icon('edit')}</button><button class="icon-btn" data-goal-del="${g.id}" aria-label="Delete goal">${icon('trash')}</button></div></div>`;
  }).join('');
  const total = sum(state.goals, (g) => g.saved);
  return `<div class="head"><div><h1>Savings goals</h1><p>${state.goals.length ? `${money(total)} put aside across ${state.goals.length} goal${state.goals.length > 1 ? 's' : ''}.` : 'Give your savings a purpose: a phone, a trip, an emergency fund.'}</p></div>
    <div class="actions"><button class="btn primary" id="addGoal">${icon('plus')}New goal</button></div></div>
    ${state.goals.length ? `<div class="cards">${cards}</div>` : `<div class="panel">${empty('flag', 'No goals yet', 'Start with an emergency fund. Even a small weekly amount adds up.', `<button class="btn primary" id="addGoal2">${icon('plus')}Create a goal</button>`)}</div>`}`;
}
function goalForm(g = {}) {
  openModal({
    title: g.id ? 'Edit goal' : 'New savings goal',
    body: `<div class="stack"><label class="field"><span>What are you saving for?</span><input class="input" id="gn" value="${esc(g.name || '')}" placeholder="e.g. Emergency fund" autofocus maxlength="60"></label>
      <div class="grid2"><label class="field"><span>Target amount (${esc(state.settings.symbol)})</span><input class="input calc" id="gt" type="text" inputmode="decimal" autocomplete="off" value="${g.target || ''}"></label>
      <label class="field"><span>Target date <span class="muted" style="font-weight:400">(optional)</span></span><input class="input" id="gd" type="date" value="${g.deadline || ''}"></label></div>
      ${g.id ? '' : `<label class="field"><span>Already saved (${esc(state.settings.symbol)})</span><input class="input calc" id="gs" type="text" inputmode="decimal" autocomplete="off" value="${g.saved || 0}"></label>`}</div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="gsave">Save goal</button>',
    onMount: (m) => $('#gsave', m).onclick = () => {
      const name = $('#gn', m).value.trim(); const target = round2(parseFloat($('#gt', m).value));
      if (!name) return toast('Give the goal a name');
      if (!(target > 0)) return toast('Enter a target greater than zero');
      if (g.id) Object.assign(state.goals.find((x) => x.id === g.id), { name, target, deadline: $('#gd', m).value });
      else state.goals.push({ id: uid(), name, target, deadline: $('#gd', m).value, saved: round2(parseFloat($('#gs', m).value) || 0) });
      save(); closeModal(); render(); toast('Goal saved');
    },
  });
}
function goalMoney(g, dir) {
  openModal({
    title: dir > 0 ? `Add to ${g.name}` : `Take out of ${g.name}`,
    body: `<div class="stack"><label class="field"><span>Amount (${esc(state.settings.symbol)})</span><input class="input amount calc" id="ga" type="text" inputmode="decimal" autocomplete="off" autofocus></label>
      <label class="field"><span>${dir > 0 ? 'Take it from' : 'Put it back into'}</span><select class="input" id="gacc"><option value="">Don’t change any account</option>${accOptions()}</select></label>
      <p class="hint">Choosing an account moves the money out of that balance${dir > 0 ? ' and into the goal' : ''}.</p></div>`,
    foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="gok">${dir > 0 ? 'Add money' : 'Take out'}</button>`,
    onMount: (m) => $('#gok', m).onclick = () => {
      const a = round2(parseFloat($('#ga', m).value));
      if (!(a > 0)) return toast('Enter an amount greater than zero');
      if (dir < 0 && a > g.saved) return toast(`Only ${money(g.saved)} is in this goal`);
      g.saved = round2(g.saved + dir * a);
      const accId = $('#gacc', m).value;
      if (accId) {
        // A transfer into a goal reduces the account; taking out is an income back into the account.
        if (dir > 0) state.transactions.push({ id: uid(), type: 'transfer', amount: a, date: today(), accountId: accId, goalId: g.id, note: `Saved for ${g.name}` });
        else state.transactions.push({ id: uid(), type: 'transfer', amount: a, date: today(), toAccountId: accId, accountId: null, note: `Taken from ${g.name}`, fromGoalId: g.id });
      }
      save(); closeModal(); render();
      toast(g.saved >= g.target && dir > 0 ? `${g.name} is fully funded` : dir > 0 ? `Added ${money(a)} to ${g.name}` : `Took ${money(a)} out of ${g.name}`);
    },
  });
}

/* ---------- recurring ---------- */
function viewRecurring() {
  const list = [...state.recurring].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const monthlyCost = sum(list.filter((r) => r.active && r.type === 'expense'), (r) => r.amount * ({ daily: 30.4, weekly: 4.35, biweekly: 2.17, monthly: 1, yearly: 1 / 12 }[r.frequency]));
  return `<div class="head"><div><h1>Scheduled payments</h1><p>Salary, rent, subscriptions: set them once and they’re logged on the day they’re due.</p></div>
    <div class="actions"><button class="btn primary" id="addRec">${icon('plus')}Schedule a payment</button></div></div>
    <div class="panel">${list.length ? `<p class="hint" style="margin:0 0 6px">Scheduled expenses cost about <b class="head-total">${moneyHtml(monthlyCost)}</b> a month.</p>
    <table class="table rec-table"><thead><tr><th>Name</th><th>Category</th><th>Repeats</th><th>Next</th><th class="r">Amount</th><th></th></tr></thead><tbody>
    ${list.map((r) => `<tr style="${r.active ? '' : 'opacity:.5'}"><td><b>${esc(r.note || catName(r.categoryId))}</b><div class="muted" style="font-size:12.5px">${esc(acc(r.accountId)?.name || '')}<span class="phone-only"> · ${FREQ[r.frequency]}</span></div></td>
      <td><i class="dot" style="background:${cat(r.categoryId)?.color}"></i> ${esc(catName(r.categoryId))}</td><td>${FREQ[r.frequency]}</td><td>${r.active ? fmtDate(r.nextDate) : 'Paused'}</td>
      <td class="r amt-cell ${r.type === 'income' ? 'pos' : ''}">${moneyHtml(r.type === 'income' ? r.amount : -r.amount, { sign: true })}</td>
      <td class="r" style="white-space:nowrap"><button class="icon-btn" data-rec-toggle="${r.id}" aria-label="${r.active ? 'Pause' : 'Resume'}" data-tip="${r.active ? 'Pause' : 'Resume'}">${icon(r.active ? 'pause' : 'play')}</button><button class="icon-btn" data-rec-edit="${r.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-rec-del="${r.id}" aria-label="Delete">${icon('trash')}</button></td></tr>`).join('')}
    </tbody></table>` : empty('repeat', 'Nothing scheduled', 'Add your salary and regular bills so you never forget to log them.', `<button class="btn primary" id="addRec2">${icon('plus')}Schedule a payment</button>`)}</div>`;
}
function recForm(saved = {}) {
  const r = { ...saved }; // a copy: switching type must not change the real payment until Save
  let type = r.type || 'expense';
  const body = () => `<div class="stack"><div class="seg type" id="rtype">${['expense', 'income'].map((v) => `<button type="button" data-v="${v}" class="${v === type ? 'on' : ''}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>
    <label class="field"><span>Name</span><input class="input" id="rn" value="${esc(r.note || '')}" placeholder="${type === 'income' ? 'e.g. Salary' : 'e.g. Netflix, Rent'}" autofocus maxlength="60"></label>
    <div class="grid2"><label class="field"><span>Amount (${esc(state.settings.symbol)})</span><input class="input calc" id="ra" type="text" inputmode="decimal" autocomplete="off" value="${r.amount || ''}"></label>
    <label class="field"><span>Category</span><select class="input" id="rc">${catOptions(type, r.categoryId)}</select></label>
    <label class="field"><span>Repeats</span><select class="input" id="rf">${Object.entries(FREQ).map(([k, v]) => `<option value="${k}" ${(r.frequency || 'monthly') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="field"><span>${r.id ? 'Next date' : 'First date'}</span><input class="input" id="rd" type="date" value="${r.nextDate || today()}"></label></div>
    <label class="field"><span>Account</span><select class="input" id="racc">${accOptions(r.accountId)}</select></label>
    <p class="hint">If the first date is today or earlier, it’s logged as soon as you save.</p></div>`;
  openModal({
    title: r.id ? 'Edit scheduled payment' : 'Schedule a payment', body: body(),
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="rs">Save</button>',
    onMount: (m) => {
      const bindType = () => $$('#rtype button', m).forEach((b) => b.onclick = () => { type = b.dataset.v; const keep = { note: $('#rn', m).value, amount: $('#ra', m).value }; Object.assign(r, keep); $('.modal-body', m).innerHTML = body(); bindType(); });
      bindType();
      $('#rs', m).onclick = () => {
        const amount = round2(parseFloat($('#ra', m).value));
        if (!(amount > 0)) return toast('Enter an amount greater than zero');
        const nextDate = $('#rd', m).value || today();
        const rec = { type, amount, note: $('#rn', m).value.trim(), categoryId: $('#rc', m).value, frequency: $('#rf', m).value, nextDate, anchorDay: r.id && nextDate === r.nextDate && r.anchorDay ? r.anchorDay : parseISO(nextDate).getDate(), accountId: $('#racc', m).value };
        if (r.id) Object.assign(state.recurring.find((x) => x.id === r.id), rec); else state.recurring.push({ id: uid(), active: true, ...rec });
        postDueRecurring(); save(); closeModal(); render(); toast('Scheduled payment saved');
      };
    },
  });
}

/* ---------- reports ---------- */
function viewReports() {
  const p = ui.reportPeriod; const t = today();
  let [from, to] = periodRange(p);
  if (p === 'all') { const ds = state.transactions.map((x) => x.date).sort(); from = ds[0] || t; to = t; }
  const effTo = to > t ? t : to;
  const ex = expensesIn(from, to), inc = incomeIn(from, to);
  const tEx = sum(ex, (x) => x.amount), tIn = sum(inc, (x) => x.amount);
  const days = Math.max(1, daysBetween(from, effTo) + 1);
  const rows = categoryRows(ex);

  // months chart
  const nMonths = p === 'year' || p === 'all' ? 12 : 6;
  const months = Array.from({ length: nMonths }, (_, i) => addMonths(monthStart(t), i - nMonths + 1));
  const monthGroups = months.map((m) => {
    const d = parseISO(m);
    return { label: MONTH_SHORT[d.getMonth()], tipTitle: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`, values: [
      { v: round2(sum(incomeIn(m, monthEnd(m)), (x) => x.amount)), cls: 'm-in', name: 'Income' },
      { v: round2(sum(expensesIn(m, monthEnd(m)), (x) => x.amount)), cls: 'm-out', name: 'Expenses' }] };
  });
  // daily chart
  let daily = '';
  if (days <= 92) {
    const g = Array.from({ length: days }, (_, i) => { const d = addDays(from, i); const dt = parseISO(d); return { label: days > 31 ? `${dt.getDate()} ${MONTH_SHORT[dt.getMonth()]}` : String(dt.getDate()), tipTitle: fmtDate(d, { full: true }), values: [{ v: round2(sum(ex.filter((x) => x.date === d), (x) => x.amount)), cls: 'm-acc', name: 'Spent' }] }; });
    daily = `<div class="panel" style="margin-top:18px"><h2>Spending by day <small>${money(tEx / days, { short: true })} a day on average</small></h2>${barChart(g, { height: 200 })}</div>`;
  }
  // weekday pattern (averaged across all history in range)
  const wd = Array.from({ length: 7 }, () => ({ v: 0, n: 0 }));
  for (let i = 0; i < days; i++) { const d = addDays(from, i); wd[parseISO(d).getDay()].n++; }
  for (const x of ex) wd[parseISO(x.date).getDay()].v += x.amount;
  const order = Array.from({ length: 7 }, (_, i) => (i + state.settings.weekStart) % 7);
  const wdGroups = order.map((i) => ({ label: DAY_SHORT[i], tipTitle: `Average ${DAY_SHORT[i]}`, values: [{ v: round2(wd[i].n ? wd[i].v / wd[i].n : 0), cls: 'm-acc', name: 'Spent' }] }));
  const peak = order.reduce((a, i) => (wd[i].n ? wd[i].v / wd[i].n : 0) > (wd[a].n ? wd[a].v / wd[a].n : 0) ? i : a, order[0]);
  const top = [...ex].sort((a, b) => b.amount - a.amount).slice(0, 6);
  const periods = [['week', 'This week'], ['month', 'This month'], ['lastmonth', 'Last month'], ['3m', '3 months'], ['year', 'This year'], ['all', 'All time']];

  return `<div class="head"><div><h1>Reports</h1><p>${fmtDate(from, { full: true, noDay: true })} – ${fmtDate(to, { full: true, noDay: true })}</p></div>
    <div class="seg" id="rp">${periods.map(([v, l]) => `<button data-v="${v}" class="${p === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="stats" style="margin-top:0">
      <div class="stat"><div class="k">Income</div><div class="v pos">${moneyHtml(tIn)}</div><div class="d">${plural(inc.length, 'payment')}</div></div>
      <div class="stat"><div class="k">Expenses</div><div class="v neg">${moneyHtml(tEx)}</div><div class="d">${plural(ex.length, 'purchase')}</div></div>
      <div class="stat"><div class="k">Kept</div><div class="v ${tIn - tEx < 0 ? 'neg' : ''}">${moneyHtml(tIn - tEx)}</div><div class="d">${tIn ? `<span class="${tIn - tEx > 0 ? 'pos' : tIn - tEx < 0 ? 'neg' : ''}">${Math.round((tIn - tEx) / tIn * 100)}% savings rate</span>` : 'No income in this period'}</div></div>
      <div class="stat"><div class="k">Average day</div><div class="v">${moneyHtml(tEx / days, { short: true })}</div><div class="d">across ${days} day${days > 1 ? 's' : ''}</div></div>
    </div>
    <div class="cols">
      <div class="panel"><h2>Income and expenses by month</h2><div class="legend"><span><i style="background:var(--good)"></i>Income</span><span><i style="background:var(--danger)"></i>Expenses</span></div>${barChart(monthGroups)}</div>
      <div class="panel"><h2>Spending by category</h2>${rows.length ? hbars(rows.slice(0, 10), tEx) : empty('chart', 'No spending in this period', 'Pick a longer period or add expenses.')}</div>
    </div>
    ${daily}
    <div class="cols">
      <div class="panel"><h2>Which days cost you most <small>${ex.length ? `${DAY_SHORT[peak]} is your priciest day` : ''}</small></h2>${barChart(wdGroups, { height: 190 })}<p class="hint" style="margin-top:8px">Average spent on each weekday in this period.</p></div>
      <div class="panel"><h2>Biggest expenses</h2>${top.length ? `<table class="table"><tbody>${top.map((x) => `<tr><td>${esc(x.note || catName(x.categoryId))}<div class="muted" style="font-size:12.5px">${esc(catName(x.categoryId))} · ${fmtDate(x.date, { full: true })}</div></td><td class="r amt-cell">${moneyHtml(x.amount)}</td></tr>`).join('')}</tbody></table>` : empty('list', 'No expenses', 'Nothing was spent in this period.')}</div>
    </div>`;
}

/* ---------- accounts ---------- */
function viewAccounts() {
  return `<div class="head"><div><h1>Accounts</h1><p>Total across all accounts: <b class="head-total">${moneyHtml(totalBalance())}</b></p></div>
    <div class="actions"><button class="btn" id="transfer">${icon('swap')}Move money</button><button class="btn primary" id="addAcc">${icon('plus')}New account</button></div></div>
    <div class="cards">${state.accounts.map((a) => { const n = state.transactions.filter((t) => t.accountId === a.id || t.toAccountId === a.id).length; const b = accountBalance(a);
      return `<div class="card"><div class="top"><div style="display:flex;gap:10px;align-items:center"><i class="dot" style="background:${a.color};width:12px;height:12px"></i><h3>${esc(a.name)}</h3></div>
      <div><button class="icon-btn" data-acc-edit="${a.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-acc-del="${a.id}" aria-label="Delete">${icon('trash')}</button></div></div>
      <div class="big ${b < 0 ? 'neg' : ''}">${moneyHtml(b)}</div><div class="meta">${n} transaction${n === 1 ? '' : 's'} · started at ${money(+a.initial || 0)}</div></div>`; }).join('')}</div>
    ${state.accounts.length ? '' : `<div class="panel">${empty('wallet', 'No accounts', 'Add where your money lives: cash, bank, card or mobile wallet.')}</div>`}`;
}
function accForm(a = {}) {
  openModal({
    title: a.id ? 'Edit account' : 'New account',
    body: `<div class="stack"><label class="field"><span>Name</span><input class="input" id="an" value="${esc(a.name || '')}" placeholder="e.g. Cash, Savings, Credit card, eZ Cash" autofocus maxlength="40"></label>
      <label class="field"><span>Current balance (${esc(state.settings.symbol)})</span><input class="input calc" id="ai" type="text" inputmode="decimal" autocomplete="off" value="${a.id ? accountBalance(a) : 0}"></label>
      <p class="hint">Enter what’s in the account right now. For a credit card you owe money on, use a negative number.</p>
      <div class="field"><span>Colour</span>${swatches(a.color || PALETTE[state.accounts.length % PALETTE.length])}</div></div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="as">Save account</button>',
    onMount: (m) => { const color = bindSwatches(m); $('#as', m).onclick = () => {
      const name = $('#an', m).value.trim(); if (!name) return toast('Give the account a name');
      const typed = round2(parseFloat($('#ai', m).value) || 0);
      /* The box shows the current balance, so work back to the starting balance that gives it, keeping past transactions. */
      const initial = a.id ? round2(typed - (accountBalance(a) - (+a.initial || 0))) : typed;
      const rec = { name, initial, color: color() };
      if (!a.id) { state.accounts.push({ id: uid(), ...rec }); save(); closeModal(); render(); return toast('Account saved'); }
      const acc = state.accounts.find((x) => x.id === a.id);
      const before = { name: acc.name, initial: acc.initial, color: acc.color };
      Object.assign(acc, rec);
      save(); closeModal(); render();
      toast('Account saved', { label: 'Undo', run: () => { const x = state.accounts.find((y) => y.id === a.id); if (x) { Object.assign(x, before); save(); render(); } } });
    }; },
  });
}

/* ---------- settings ---------- */
function viewSettings() {
  const s = state.settings;
  const catList = (type) => state.categories.filter((c) => c.type === type).map((c) => {
    const used = state.transactions.filter((t) => t.categoryId === c.id).length;
    return `<div class="list-row"><i class="dot" style="background:${c.color}"></i><span class="grow">${esc(c.name)} ${type === 'expense' && c.weekly === false ? '<span class="tag">Not in weekly limit</span>' : ''}</span><span class="muted" style="font-size:12.5px">${used} used</span>
    <button class="icon-btn" data-cat-edit="${c.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-cat-del="${c.id}" aria-label="Delete">${icon('trash')}</button></div>`;
  }).join('');
  const signedIn = !!cloud()?.info().signedIn;
  return `<div class="head"><div><h1>Settings</h1><p>Make it yours.${signedIn ? '' : ' Everything is stored only on this device.'}</p></div></div>
    <div class="cols" style="margin-top:0">
      <div class="panel"><h2>Profile</h2><div class="stack">
        <label class="field"><span>Your name</span><input class="input" id="sName" value="${esc(s.name)}" maxlength="30"></label>
        <div class="grid2">
          <label class="field"><span>Currency</span><select class="input" id="sCur">${CURRENCIES.map(([c, sym]) => `<option value="${c}" ${s.currency === c ? 'selected' : ''}>${c} (${sym})</option>`).join('')}</select></label>
          <label class="field"><span>Symbol shown</span><input class="input" id="sSym" value="${esc(s.symbol)}" maxlength="5"></label>
          <label class="field"><span>Week starts on</span><select class="input" id="sWeek">${[1, 0, 6].map((d) => `<option value="${d}" ${s.weekStart === d ? 'selected' : ''}>${['Sunday', 'Monday', '', '', '', '', 'Saturday'][d]}</option>`).join('')}</select></label>
          <label class="field"><span>Appearance</span><select class="input" id="sTheme">${[['system', systemLabel()], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="field"><span>Colour theme</span><div class="palettes" role="radiogroup" aria-label="Colour theme">${PALETTES.map(([v, l]) => `<button type="button" role="radio" aria-checked="${(s.palette || 'forest') === v}" class="pal pal-${v}" data-pal="${v}"><i aria-hidden="true"></i><span>${l}</span></button>`).join('')}</div></div>
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="sDec" ${s.decimals ? 'checked' : ''}> Show cents / decimals</label>
      </div></div>
      <div class="panel"><h2>Your data</h2><div class="stack">
        <p class="hint" style="margin:0">Back up regularly so you never lose your history. Restore a backup on another device, or merge it to combine what both devices have.</p>
        <p class="hint" id="lastBackup" style="margin:0;color:var(--ink-2)">${lastBackupText()}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="backup">${icon('download')}Save backup</button><button class="btn" id="restore">${icon('upload')}Restore backup</button><button class="btn" id="csvAll">${icon('download')}Export all as CSV</button></div>
        <p class="hint" id="dataLoc" style="margin:0"></p>
        <div style="border-top:1px solid var(--line);padding-top:14px"><button class="btn danger" id="reset">${icon('trash')}Erase all data</button></div>
        <p class="hint shortcuts-hint" style="margin:0">Shortcuts: N new expense · I new income · Esc close</p>
      </div></div>
    </div>
    ${cloudPanel()}
    <div class="cols">
      <div class="panel"><h2>Expense categories <button class="btn small" data-cat-add="expense">${icon('plus')}Add</button></h2>${catList('expense')}</div>
      <div class="panel"><h2>Income categories <button class="btn small" data-cat-add="income">${icon('plus')}Add</button></h2>${catList('income')}</div>
    </div>
    <section class="about" aria-label="About">
      ${logo(44)}
      <div class="about-text"><strong>Pocket Ledger</strong><span>Version ${APP_VERSION}</span></div>
      <div class="about-credit">Designed and developed by <b>${AUTHOR}</b><span>© ${now().getFullYear()} ${AUTHOR}.${signedIn ? '' : ' Your data never leaves your device.'}</span></div>
    </section>`;
}
function catForm(c = {}, type) {
  type = c.type || type;
  openModal({
    title: c.id ? 'Edit category' : `New ${type} category`,
    body: `<div class="stack"><label class="field"><span>Name</span><input class="input" id="cn" value="${esc(c.name || '')}" autofocus maxlength="40"></label>
      <div class="field"><span>Colour</span>${swatches(c.color || PALETTE[state.categories.length % PALETTE.length])}</div>
      ${type === 'expense' ? `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cw" ${c.weekly !== false ? 'checked' : ''}> Count toward my weekly spending limit</label><p class="hint">Turn this off for fixed costs like rent or yearly fees.</p>` : ''}</div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="cs">Save category</button>',
    onMount: (m) => { const color = bindSwatches(m); $('#cs', m).onclick = () => {
      const name = $('#cn', m).value.trim(); if (!name) return toast('Give the category a name');
      const rec = { name, color: color(), type, weekly: type === 'expense' ? $('#cw', m).checked : false };
      if (c.id) Object.assign(state.categories.find((x) => x.id === c.id), rec); else state.categories.push({ id: uid(), ...rec });
      save(); closeModal(); render(); toast('Category saved');
    }; },
  });
}
/* ---------- sync & account (web/sync.js) ---------- */
/* window.PocketCloud comes from sync.js. If it's missing (tests, or the file failed to load), the
   Sync parts are simply not shown and everything else works as before. */
const cloud = () => (window.PocketCloud?.available ? window.PocketCloud : null);
/* Password rules for new accounts. Firebase checks them again on its side (password policy in the console). */
const PW_RULES = [
  ['8 or more characters', (p) => p.length >= 8],
  ['a letter', (p) => /\p{L}/u.test(p)],
  ['a number', (p) => /\d/.test(p)],
];
const emailLooksOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/* The button next to the light/dark switch on the home page. */
function cloudButton() {
  const c = cloud(); if (!c) return '';
  const i = c.info();
  const warn = ['offline', 'error'].includes(i.sync?.state) ? ' warn' : '';
  return i.signedIn
    ? `<button class="btn cloud-btn on${warn}" data-go="settings" aria-label="Account: signed in as ${esc(i.email)}">${icon('cloudOk')}<span>Account</span></button>`
    : `<button class="btn cloud-btn" id="cloudHead" aria-label="Sign in or create an account">${icon('cloud')}<span>Sign in</span></button>`;
}
function cloudPanel() {
  const c = cloud(); if (!c) return '';
  const i = c.info();
  const row = (html) => `<div style="display:flex;gap:8px;flex-wrap:wrap">${html}</div>`;
  let body;
  if (i.signedIn) {
    body = `<div class="acct">${icon('cloudOk')}<div><b>${esc(i.email)}</b><span>${i.verified ? 'Signed in' : 'Signed in · email not confirmed yet'}</span></div></div>
      ${i.verified ? '' : `<div class="verify"><p style="margin:0">We sent a link to <b>${esc(i.email)}</b>. Open it to confirm this email is yours (check spam too).</p>
        ${row('<button class="btn small" id="cloudCheck">I’ve confirmed it</button><button class="btn small ghost" id="cloudResend">Send the link again</button>')}</div>`}
      ${syncLine(i.sync)}
      ${row(`<button class="btn" id="cloudOut">Sign out</button><button class="btn" id="cloudOutWipe">Sign out and remove data from this device</button><button class="btn danger" id="cloudDel">${icon('trash')}Delete account</button>`)}`;
  } else if (i.status === 'loading') {
    body = '<p class="hint" style="margin:0">Starting…</p>';
  } else {
    body = `<p class="hint" style="margin:0">Optional. Sign in to use the same data on your phone and computer. Without an account, everything stays on this device like before.</p>
      ${i.status === 'error' ? '<p class="form-error" style="margin:0">Sync couldn’t start. Check your internet connection and try again.</p>' : ''}
      ${row(`<button class="btn primary" id="cloudUp">${icon('cloud')}Create account</button><button class="btn" id="cloudIn">Sign in</button>`)}`;
  }
  return `<div class="panel" style="margin-top:18px"><h2>Sync &amp; account</h2><div class="stack">${body}</div></div>`;
}
/* Redraws now, or once the person has finished typing in a box / closed the open window,
   so data arriving from another device never wipes what they're typing. */
const isTyping = () => { const a = document.activeElement; return !!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#root')); };
function renderSoon() { if ($('#overlay') || isTyping()) ui.renderLater = true; else render(); }
document.addEventListener('focusout', () => setTimeout(() => {
  if (ui.renderLater && !$('#overlay') && !isTyping()) { ui.renderLater = false; render(); }
}, 0));
/* Something about the account changed. Signing in or out changes the whole page; a sync status change
   ("Syncing…" → "Synced") only updates the status line and the home button, not the whole page. */
let cloudSeen = '';
function onCloudChange() {
  const i = cloud()?.info(); if (!i) return;
  const who = [i.signedIn, i.email, i.verified, i.status].join('|');
  if (who !== cloudSeen) { cloudSeen = who; return renderSoon(); }
  const line = $('.sync-line'); if (line) line.outerHTML = syncLine(i.sync);
  $('.cloud-btn.on')?.classList.toggle('warn', ['offline', 'error'].includes(i.sync?.state));
}
/* "Synced at 18:42", "Waiting for internet", ... */
function syncLine(s = {}) {
  const at = s.lastSynced ? new Date(s.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const code = s.error?.code ? ` (${esc(s.error.code)})` : '';
  const lines = {
    starting: ['', 'Getting your data…'],
    syncing: ['', 'Syncing…'],
    synced: ['ok', `Synced${at ? ' at ' + at : ''}. Changes on your other devices show up here by themselves.`],
    offline: ['', 'Waiting for internet. Your changes are saved on this device and will sync when you’re back online.'],
    error: ['bad', `Sync problem${code}. It will try again by itself in a moment.`],
  };
  const [kind, text] = lines[s.state] || ['', 'Getting ready to sync…'];
  return `<p class="sync-line ${kind}" style="margin:0">${text}</p>`;
}
/* Signing in to a different account than last time on this device: ask before adding this device's data to it. */
function confirmMerge() {
  return new Promise((resolve) => {
    let answered = false; const answer = (yes) => { if (!answered) { answered = true; resolve(yes); } };
    openModal({
      title: 'Add this device’s data to the account?',
      body: `<p style="margin:0">This device has money history that isn’t in this account yet. It was added while signed out, or with a different account. Do you want to add it to <b>${esc(cloud()?.info().email || 'this account')}</b>?</p>
        <p class="hint" style="margin-top:10px">If you say no, you’ll be signed out and nothing is changed. To get only your account’s data on this device, erase this device’s data first (Settings → Erase all data), then sign in.</p>`,
      foot: '<button class="btn" id="mNo">No, sign out</button><button class="btn primary" id="mYes">Yes, add it</button>',
      onClose: () => answer(false),
      onMount: (m) => { $('#mNo', m).onclick = () => { answer(false); closeModal(); }; $('#mYes', m).onclick = () => { answer(true); closeModal(); }; },
    });
  });
}
function bindCloud(root) {
  const c = cloud(); if (!c) return;
  const on = (id, fn) => { const b = $('#' + id, root); if (b) b.onclick = fn; };
  on('cloudUp', () => accountForm('signup'));
  on('cloudIn', () => accountForm('signin'));
  // Only offer to remove the data here once it's all in the account, so nothing can be lost.
  const allSynced = () => c.info().sync?.state === 'synced';
  const eraseDevice = () => { state = defaultState(); save(); ui.view = 'dashboard'; render(); };
  on('cloudOut', async () => {
    const synced = allSynced(); const email = c.info().email;
    try { await c.signOut(); } catch (e) { return toast(c.friendlyError(e)); }
    render();
    openModal({
      title: 'Signed out',
      body: `<p style="margin:0">Your money history is still on this device, so you can keep using the app without an account.</p>
        <p class="hint" style="margin-top:10px">${synced
          ? `Want a fresh start instead? You can remove the data from this device. It stays safe in <b>${esc(email)}</b> and comes back when you sign in again.`
          : 'Some recent changes hadn’t reached your account yet, so they are kept on this device. To start fresh later, use Settings → Erase all data.'}</p>`,
      foot: `${synced ? `<button class="btn" id="soWipe">${icon('trash')}Remove from this device</button>` : ''}<button class="btn primary" data-close>Keep my data</button>`,
      onMount: (m) => { const b = $('#soWipe', m); if (b) b.onclick = () => { closeModal(); eraseDevice(); toast('Data removed from this device. It’s still in your account.'); }; },
    });
  });
  on('cloudOutWipe', () => {
    if (!allSynced()) return toast('Some changes haven’t reached your account yet. Connect to the internet and wait for “Synced”, then try again.');
    confirmBox('Sign out and remove data?', `Your money history will be removed from this device. It stays safe in <b>${esc(c.info().email)}</b> and comes back when you sign in again.`, 'Sign out and remove', async () => {
      try { await c.signOut(); } catch (e) { return toast(c.friendlyError(e)); }
      eraseDevice(); toast('Signed out. Data removed from this device.');
    });
  });
  on('cloudDel', deleteAccountBox);
  on('cloudResend', async () => {
    try { await c.sendVerification(); toast('Link sent. Check your inbox and spam folder.'); } catch (e) { toast(c.friendlyError(e)); }
  });
  on('cloudCheck', async () => {
    try { await c.refresh(); render(); toast(c.info().verified ? 'Email confirmed. Thank you!' : 'Not confirmed yet. Open the link in the email first.'); } catch (e) { toast(c.friendlyError(e)); }
  });
}

/* ----- form pieces: a field with a red message under it, and a message line for the whole form ----- */
function inputField(id, label, { type = 'text', ac = '', focus = false, after = '' } = {}) {
  const email = type === 'email';
  const input = `<input class="input" id="${id}" type="${type}" autocomplete="${ac}" maxlength="${email ? 254 : 128}"
    ${email ? 'inputmode="email" autocapitalize="off" spellcheck="false"' : ''} ${focus ? 'autofocus' : ''} aria-describedby="${id}-err">`;
  return `<div class="field"><label class="field-label" for="${id}">${label}</label>
    ${type === 'password' ? `<div class="pw-wrap">${input}<button type="button" class="icon-btn pw-eye" data-eye="${id}" aria-label="Show password" aria-pressed="false">${icon('eye')}</button></div>` : input}
    <p class="field-error" id="${id}-err" hidden></p>${after}</div>`;
}
const FORM_MSG = '<p class="form-error" role="alert" hidden></p>';
/* The message line for the whole form: red for errors, green when `ok`. */
function formMsg(m, msg, ok = false) { const el = $('.form-error', m); el.textContent = msg || ''; el.hidden = !msg; el.classList.toggle('ok', ok); }
/* Marks a field red. `msg` is shown under it; `true` makes it red with no text of its own. */
function fieldError(m, id, msg) {
  const inp = $('#' + id, m); const el = $('#' + id + '-err', m);
  if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
  el.textContent = typeof msg === 'string' ? msg : ''; el.hidden = typeof msg !== 'string' || !msg;
  if (typeof msg === 'string' && msg) el.setAttribute('role', 'alert'); else el.removeAttribute('role');
}
const clearForm = (m) => { $$('.input', m).forEach((inp) => fieldError(m, inp.id, '')); formMsg(m, ''); };
/* Show/hide password buttons, and typing in a field clears its red mark (and a "wrong email or password"). */
function bindFormBits(m, submit) {
  $$('[data-eye]', m).forEach((b) => b.onclick = () => {
    const inp = $('#' + b.dataset.eye, m); const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', show); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    b.innerHTML = icon(show ? 'eyeOff' : 'eye'); inp.focus();
  });
  $$('.input', m).forEach((inp) => {
    inp.addEventListener('input', () => {
      fieldError(m, inp.id, '');
      // "Wrong email or password" is about both fields, so fixing either one clears both.
      if (m.dataset.pairError) { $$('.input', m).forEach((x) => fieldError(m, x.id, '')); formMsg(m, ''); delete m.dataset.pairError; }
    });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  });
}
/* Puts a Firebase error next to the field it is about. ids: { email, password, wrongMsg }. */
function showCloudError(m, e, ids) {
  const msg = cloud().friendlyError(e); const code = e?.code || '';
  if (ids.email && /invalid-email|missing-email|email-already-in-use/.test(code)) return fieldError(m, ids.email, msg);
  if (/weak-password|password-does-not-meet|missing-password/.test(code)) return fieldError(m, ids.password, msg);
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) {
    if (!ids.email) return fieldError(m, ids.password, ids.wrongMsg || msg);
    // Same message whether the email or the password was wrong, so nobody can test which emails have accounts.
    fieldError(m, ids.email, true); fieldError(m, ids.password, true); m.dataset.pairError = '1';
    return formMsg(m, msg);
  }
  formMsg(m, msg);
}
/* Shows "Signing in…" on a button while `work` runs. Returns true if it worked. */
async function busy(m, btn, label, work, ids) {
  const old = btn.textContent; btn.disabled = true; btn.textContent = label;
  try { await work(); return true; } catch (e) { showCloudError(m, e, ids); return false; } finally { btn.disabled = false; btn.textContent = old; }
}
const focusFirstError = (m) => $('[aria-invalid="true"]', m)?.focus();

function accountForm(mode) {
  const c = cloud(); const up = mode === 'signup';
  const rules = `<ul class="pw-rules" id="pwRules" aria-label="Password needs">${PW_RULES.map(([l]) => `<li>${icon('check')}${l}</li>`).join('')}</ul>`;
  openModal({
    title: up ? 'Create an account' : 'Sign in',
    body: `<div class="stack">
      ${up ? '<p class="hint" style="margin:0">Use the same data on your phone and computer. Free, and optional.</p>' : ''}
      ${inputField('ce', 'Email', { type: 'email', ac: 'email', focus: true })}
      ${inputField('cp', 'Password', { type: 'password', ac: up ? 'new-password' : 'current-password',
        after: up ? rules : '<button class="link-btn forgot" id="cforgot" type="button">Forgot password?</button>' })}
      ${up ? inputField('cp2', 'Confirm password', { type: 'password', ac: 'new-password' }) : ''}
      ${FORM_MSG}
      ${up ? '<p class="hint" style="margin:0">Keep your password safe: you’ll need it on your other devices. We’ll email you a link to confirm your address.</p>' : ''}
      <p class="hint" style="margin:0">${up ? 'Already have an account?' : 'New here?'} <button class="link-btn" id="cswitch" type="button">${up ? 'Sign in' : 'Create an account'}</button></p></div>`,
    foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="cgo">${up ? 'Create account' : 'Sign in'}</button>`,
    onMount: (m) => {
      const go = $('#cgo', m); const ids = { email: 'ce', password: 'cp' };
      const val = (id) => $('#' + id, m)?.value || '';
      // Ticks each password rule as it's met.
      const tickRules = (showBad) => $$('#pwRules li', m).forEach((li, n) => {
        const ok = PW_RULES[n][1](val('cp'));
        li.classList.toggle('ok', ok); li.classList.toggle('bad', !ok && showBad);
      });
      if (up) $('#cp', m).addEventListener('input', () => tickRules(false));
      const run = async () => {
        if (go.disabled) return;
        clearForm(m);
        const email = val('ce').trim(); const password = val('cp');
        if (!email) fieldError(m, 'ce', 'Enter your email address.');
        else if (!emailLooksOk(email)) fieldError(m, 'ce', 'That email address doesn’t look right.');
        if (!password) fieldError(m, 'cp', up ? 'Choose a password.' : 'Enter your password.');
        else if (up && PW_RULES.some(([, ok]) => !ok(password))) { fieldError(m, 'cp', 'Your password doesn’t meet the rules below yet.'); tickRules(true); }
        if (up && password && val('cp2') !== password) fieldError(m, 'cp2', val('cp2') ? 'The two passwords don’t match.' : 'Type your password again.');
        if ($('[aria-invalid="true"]', m)) return focusFirstError(m);
        const ok = await busy(m, go, up ? 'Creating…' : 'Signing in…', () => (up ? c.signUp(email, password) : c.signIn('password', { email, password })), ids);
        if (ok) { closeModal(); render(); toast(up ? 'Account created. Check your email to confirm it.' : 'Signed in'); } else focusFirstError(m);
      };
      go.onclick = run;
      bindFormBits(m, run);
      $('#cswitch', m).onclick = () => accountForm(up ? 'signin' : 'signup');
      if (!up) $('#cforgot', m).onclick = async (e) => {
        clearForm(m);
        const email = val('ce').trim();
        if (!email) return fieldError(m, 'ce', 'Type your email first, then tap “Forgot password?”.'), focusFirstError(m);
        if (!emailLooksOk(email)) return fieldError(m, 'ce', 'That email address doesn’t look right.'), focusFirstError(m);
        // Firebase doesn't say whether the account exists (so strangers can't check emails), so neither do we.
        if (await busy(m, e.currentTarget, 'Sending…', () => c.resetPassword(email), ids)) formMsg(m, `If ${email} has an account, a reset link is on its way. Check spam too.`, true);
      };
    },
  });
}
function deleteAccountBox() {
  const c = cloud();
  openModal({
    title: 'Delete your account?',
    body: `<div class="stack"><p style="margin:0">Your account <b>and everything synced to it</b> will be deleted. The data on this device stays here.</p>
      ${inputField('dp', 'Type your password to confirm', { type: 'password', ac: 'current-password', focus: true })}${FORM_MSG}</div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn danger" id="dgo">Delete account</button>',
    onMount: (m) => {
      const go = $('#dgo', m);
      const run = async () => {
        if (go.disabled) return;
        clearForm(m);
        const password = $('#dp', m).value;
        if (!password) return fieldError(m, 'dp', 'Enter your password.'), focusFirstError(m);
        if (await busy(m, go, 'Deleting…', () => c.deleteAccount(password), { password: 'dp', wrongMsg: 'Wrong password.' })) {
          closeModal(); render(); toast('Account deleted. Your data is still on this device.');
        } else focusFirstError(m);
      };
      go.onclick = run;
      bindFormBits(m, run);
    },
  });
}
/* "system" means: follow the phone / computer setting. */
const systemLabel = () => (isNativeApp() ? 'Match phone' : hasApi() ? 'Match Windows' : 'Match device');
const THEMES = () => [['light', 'Light', 'sun'], ['system', systemLabel(), 'auto'], ['dark', 'Dark', 'moon']];
/* Light / Auto / Dark switch. The sliding pill (.thumb) moves to the chosen button via --i. */
function themeToggle() {
  const cur = state.settings.theme || 'system';
  const i = Math.max(0, THEMES().findIndex(([v]) => v === cur));
  return `<div class="theme-toggle" role="radiogroup" aria-label="Appearance" style="--i:${i}"><span class="thumb" aria-hidden="true"></span>
    ${THEMES().map(([v, l, ic]) => `<button type="button" role="radio" data-theme-set="${v}" aria-checked="${v === cur}" aria-label="${l}" data-tip="${l}">${icon(ic)}</button>`).join('')}</div>`;
}
function setTheme(t) {
  if (state.settings.theme === t) return;
  state.settings.theme = t; save();
  // Update the switch in place (no full re-render) so the pill can slide.
  $$('.theme-toggle').forEach((g) => {
    g.style.setProperty('--i', THEMES().findIndex(([v]) => v === t));
    $$('[data-theme-set]', g).forEach((b) => b.setAttribute('aria-checked', b.dataset.themeSet === t));
  });
  // Cross-fade old colours into new ones where the browser supports it (Android WebView, Chrome, Edge).
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduce) document.startViewTransition(applyTheme); else applyTheme();
}
/* Colour themes: each has a light and a dark version (the colours are in styles.css). Forest is the original. */
const PALETTES = [['forest', 'Forest'], ['onyx', 'Onyx'], ['navy', 'Navy'], ['mocha', 'Mocha']];
function applyTheme() {
  const t = state?.settings.theme || 'system';
  if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  const p = state?.settings.palette;
  if (!p || p === 'forest') document.documentElement.removeAttribute('data-palette'); else document.documentElement.setAttribute('data-palette', p);
  updateSystemBars();
}
/* Android app: light status-bar icons on dark screens (splash, dark theme), dark icons on light ones. */
const darkScheme = window.matchMedia?.('(prefers-color-scheme: dark)');
function updateSystemBars() {
  if (!isNativeApp()) return;
  const t = state?.settings.theme || 'system';
  const dark = !!document.getElementById('splash') || t === 'dark' || (t === 'system' && !!darkScheme?.matches);
  window.Capacitor.Plugins.SystemBars?.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(() => {});
  /* Paint the strips behind the status bar and gesture bar in the page colour (green on the splash and welcome screens) */
  const green = !!document.getElementById('splash') || !state?.settings.onboarded;
  const color = getComputedStyle(document.documentElement).getPropertyValue(green ? '--side' : '--bg').trim();
  if (color) window.Capacitor.Plugins.BarColor?.setColor({ color }).catch(() => {});
}
darkScheme?.addEventListener?.('change', updateSystemBars);

/* ================= onboarding ================= */
function viewWelcome() {
  const s = state.settings;
  return `<div class="welcome"><div class="welcome-inner"><div class="modal"><div class="modal-body" style="padding:30px 32px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">${logo(40)}<div><h1>Pocket Ledger</h1><p class="muted" style="margin:0">Know what you can spend today, and make it to the end of the week.</p></div></div>
    ${cloud() ? `<div class="have-account">${icon('cloud')}<span>Already use Pocket Ledger on another device? <button class="link-btn" id="wSignIn" type="button">Sign in</button></span></div>` : ''}
    <div class="stack">
      <label class="field"><span>What should we call you?</span><input class="input" id="wName" placeholder="Your first name" maxlength="30" autofocus></label>
      <div class="grid2"><label class="field"><span>Currency</span><select class="input" id="wCur">${CURRENCIES.map(([c, sym]) => `<option value="${c}" ${s.currency === c ? 'selected' : ''}>${c} (${sym})</option>`).join('')}</select></label>
      <label class="field"><span>Week starts on</span><select class="input" id="wWeek"><option value="1">Monday</option><option value="0">Sunday</option><option value="6">Saturday</option></select></label></div>
      <div class="grid2"><label class="field"><span>Cash you have now</span><input class="input calc" id="wCash" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label>
      <label class="field"><span>Money in the bank now</span><input class="input calc" id="wBank" type="text" inputmode="decimal" autocomplete="off" placeholder="0"></label></div>
      <label class="field"><span>Most you want to spend in a week</span><input class="input calc" id="wLimit" type="text" inputmode="decimal" autocomplete="off" placeholder="e.g. 5000"></label>
      <p class="hint">Leave out rent and bills. You can change any of this later in Settings.</p>
      <button class="btn primary" id="wGo" style="padding:11px">Start tracking</button>
    </div></div></div>
    <p class="welcome-credit">Designed and developed by ${AUTHOR} · v${APP_VERSION}</p></div></div>`;
}
function bindWelcome() {
  const shown = state; // the data this screen was opened with
  $('#wGo').onclick = () => {
    // Signed in from this screen and the account's data arrived while it was still open: that data is
    // the real one. Don't write this form's name, limit and starting balances over the synced accounts.
    if (state !== shown || state.settings.onboarded) {
      state.settings.onboarded = true; save(); render(); toast('Your data from your account is loaded');
      return;
    }
    const s = state.settings; const cur = $('#wCur').value;
    s.name = $('#wName').value.trim(); s.currency = cur; s.symbol = CURRENCIES.find((c) => c[0] === cur)[1];
    s.weekStart = +$('#wWeek').value; s.weeklyBudget = round2(parseFloat($('#wLimit').value) || 0); s.onboarded = true;
    state.accounts[0].initial = round2(parseFloat($('#wCash').value) || 0);
    if (state.accounts[1]) state.accounts[1].initial = round2(parseFloat($('#wBank').value) || 0);
    save(); render();
  };
  const signIn = $('#wSignIn'); if (signIn) signIn.onclick = () => accountForm('signin');
  $('#wName').focus();
}
function logo(size = 30) {
  return `<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="6" width="28" height="20" rx="5" fill="#5fd3b8"/><rect x="2" y="11" width="28" height="4" fill="#12302a" opacity=".35"/><rect x="18" y="17" width="12" height="7" rx="3.5" fill="#12302a"/><circle cx="22" cy="20.5" r="1.6" fill="#5fd3b8"/></svg>`;
}

/* ================= render & bindings ================= */
function render() {
  applyTheme();
  hideTip(); // a tip from the previous page must not stay on screen
  const root = $('#root');
  if (!state.settings.onboarded) { root.innerHTML = viewWelcome(); bindWelcome(); return; }
  const views = { dashboard: viewDashboard, transactions: viewTransactions, budgets: viewBudgets, goals: viewGoals, recurring: viewRecurring, reports: viewReports, accounts: viewAccounts, tools: viewTools, settings: viewSettings };
  const scroll = $('.main')?.scrollTop || 0;
  chartSpecs.length = 0;
  const w = weekInfo();
  root.innerHTML = `<div class="app"><aside class="side"><div class="brand">${logo()}<span class="brand-name">Pocket Ledger</span></div>
    <nav class="nav">${NAV.map(([k, l, ic]) => `<button data-nav="${k}" class="${ui.view === k ? 'on' : ''} ${PHONE_BAR.includes(k) ? '' : 'phone-hide'}" ${ui.view === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span></button>`).join('')}
      <button class="more-btn ${PHONE_BAR.includes(ui.view) ? '' : 'on'}" id="moreBtn">${icon('more')}<span>More</span></button></nav>
    <div class="side-foot">${w.B ? `Left this week<strong>${moneyHtml(w.remaining)}</strong>` : `Balance<strong>${moneyHtml(totalBalance())}</strong>`}
      <div class="credit">Designed &amp; developed by ${AUTHOR.replace(' ', '&nbsp;')}</div></div></aside>
    <main class="main"><div class="page">${views[ui.view]()}</div></main>
    ${fabMenu()}</div>`;
  drawCharts();
  $('.main').scrollTop = scroll;
  bindCommon(root);
  if (ui.view === 'transactions') bindTransactions(root);
  if (ui.view === 'settings') bindSettings(root);
  if (ui.view === 'tools') bindTools(root);
  if (ui.view === 'reports') $$('#rp button', root).forEach((b) => b.onclick = () => { ui.reportPeriod = b.dataset.v; render(); });
}
/* Phones: the round + button. Tapping it fans out the main actions in an arc around it. */
const FAB_ITEMS = [['expense', 'Expense', 'minus'], ['income', 'Income', 'plus'], ['transfer', 'Transfer', 'swap'], ['calc', 'Calculator', 'calc']];
const FAB_RADIUS = 150; // px from the + to each button
function fabMenu() {
  const items = FAB_ITEMS.map(([act, label, ic], i) => {
    const a = (90 + i * 30) * Math.PI / 180; // 90° = straight up, 180° = straight left
    const x = Math.round(Math.cos(a) * FAB_RADIUS), y = Math.round(-Math.sin(a) * FAB_RADIUS);
    return `<button class="fab-item ${act}" data-fab="${act}" tabindex="-1" style="--x:${x}px;--y:${y}px;--i:${i}"><span class="fab-ic">${icon(ic)}</span><span class="fab-label">${label}</span></button>`;
  }).join('');
  return `<div class="fab-wrap" id="fabWrap"><div class="fab-dim" data-fab-close></div>${items}
    <button class="fab" id="fab" aria-label="Quick actions" aria-expanded="false">${icon('plus')}</button></div>`;
}
function setFab(open) {
  const w = $('#fabWrap'); if (!w) return;
  w.classList.toggle('open', open);
  $('#fab', w).setAttribute('aria-expanded', String(open));
  $$('.fab-item', w).forEach((b) => { b.tabIndex = open ? 0 : -1; });
}
function bindCommon(root) {
  const on = (sel, fn) => $$(sel, root).forEach((el) => el.onclick = () => fn(el));
  on('[data-nav]', (el) => { ui.view = el.dataset.nav; $('.main').scrollTop = 0; render(); $('.main').scrollTop = 0; });
  on('[data-go]', (el) => { ui.view = el.dataset.go; render(); $('.main').scrollTop = 0; });
  on('[data-add]', (el) => txForm({ type: el.dataset.add }));
  on('[data-calc-pad]', () => calcPad());
  on('#fab', () => setFab(!$('#fabWrap').classList.contains('open')));
  on('[data-fab-close]', () => setFab(false));
  on('[data-fab]', (el) => {
    setFab(false);
    const act = el.dataset.fab;
    if (act === 'calc') calcPad();
    else if (act === 'transfer' && state.accounts.length < 2) toast('Add a second account to move money between them');
    else txForm({ type: act });
  });
  on('[data-theme-set]', (el) => setTheme(el.dataset.themeSet));
  on('#cloudHead', () => accountForm('signin'));
  on('#moreBtn', () => openModal({
    title: 'More',
    body: `<div class="nav more-list">${NAV.filter(([k]) => !PHONE_BAR.includes(k)).map(([k, l, ic]) => `<button data-nav="${k}" class="${ui.view === k ? 'on' : ''}">${icon(ic)}<span>${l}</span></button>`).join('')}</div>
      <p class="more-credit">Pocket Ledger ${APP_VERSION} · Designed &amp; developed by ${AUTHOR}</p>`,
    onMount: (m) => $$('[data-nav]', m).forEach((b) => b.onclick = () => { closeModal(); ui.view = b.dataset.nav; render(); $('.main').scrollTop = 0; }),
  }));
  on('#setBudget', weeklyLimitForm);
  on('#backupNow', saveBackup);
  on('#backupLater', snoozeBackup);
  on('#addBudget, #addBudget2', () => budgetForm());
  on('[data-edit-budget]', (el) => budgetForm(state.budgets.find((b) => b.id === el.dataset.editBudget)));
  on('[data-del-budget]', (el) => { state.budgets = state.budgets.filter((b) => b.id !== el.dataset.delBudget); save(); render(); toast('Budget removed'); });
  on('#addGoal, #addGoal2', () => goalForm());
  on('[data-goal-edit]', (el) => goalForm(state.goals.find((g) => g.id === el.dataset.goalEdit)));
  on('[data-goal-add]', (el) => goalMoney(state.goals.find((g) => g.id === el.dataset.goalAdd), 1));
  on('[data-goal-take]', (el) => goalMoney(state.goals.find((g) => g.id === el.dataset.goalTake), -1));
  on('[data-goal-del]', (el) => { const g = state.goals.find((x) => x.id === el.dataset.goalDel); confirmBox('Delete goal?', `“${esc(g.name)}” and its progress will be removed. Account transactions you made for it stay in your history.`, 'Delete goal', () => { state.goals = state.goals.filter((x) => x !== g); save(); render(); }); });
  on('#addRec, #addRec2', () => recForm());
  on('[data-rec-edit]', (el) => recForm(state.recurring.find((r) => r.id === el.dataset.recEdit)));
  on('[data-rec-toggle]', (el) => { const r = state.recurring.find((x) => x.id === el.dataset.recToggle); r.active = !r.active; if (r.active && r.nextDate < today()) r.nextDate = today(); postDueRecurring(); save(); render(); toast(r.active ? 'Resumed' : 'Paused'); });
  on('[data-rec-del]', (el) => confirmBox('Delete scheduled payment?', 'Future payments stop. Ones already logged stay in your history.', 'Delete', () => { state.recurring = state.recurring.filter((r) => r.id !== el.dataset.recDel); save(); render(); }));
  on('#addAcc', () => accForm());
  on('[data-acc-edit]', (el) => accForm(acc(el.dataset.accEdit)));
  on('[data-acc-del]', (el) => {
    const a = acc(el.dataset.accDel); const used = state.transactions.some((t) => t.accountId === a.id || t.toAccountId === a.id) || state.recurring.some((r) => r.accountId === a.id);
    if (used) return toast(`${a.name} has transactions. Move or delete them first.`);
    confirmBox('Delete account?', `“${esc(a.name)}” will be removed.`, 'Delete account', () => { state.accounts = state.accounts.filter((x) => x !== a); save(); render(); });
  });
  on('#transfer', () => state.accounts.length < 2 ? toast('Add a second account to move money between them') : txForm({ type: 'transfer' }));
  bindTxRows(root);
}
function bindSettings(root) {
  const s = state.settings;
  $('#sName', root).onchange = (e) => { s.name = e.target.value.trim(); save(); toast('Name saved'); };
  $('#sCur', root).onchange = (e) => { s.currency = e.target.value; s.symbol = CURRENCIES.find((c) => c[0] === s.currency)[1]; save(); render(); };
  $('#sSym', root).onchange = (e) => { s.symbol = e.target.value.trim() || s.currency; save(); render(); };
  $('#sWeek', root).onchange = (e) => { s.weekStart = +e.target.value; save(); render(); };
  $('#sTheme', root).onchange = (e) => { s.theme = e.target.value; save(); render(); };
  $$('[data-pal]', root).forEach((b) => b.onclick = () => { s.palette = b.dataset.pal; save(); render(); });
  $('#sDec', root).onchange = (e) => { s.decimals = e.target.checked; save(); render(); };
  $('#backup', root).onclick = saveBackup;
  $('#csvAll', root).onclick = () => exportCsv(state.transactions);
  $('#restore', root).onclick = async () => {
    const apply = (data) => {
      if (!data || !Array.isArray(data.transactions) || !data.settings) return toast('That file isn’t a Pocket Ledger backup');
      restoreBox(data);
    };
    if (hasApi()) { try { apply(await window.pywebview.api.open_backup()); } catch (e) { toast('Could not read that file'); } }
    else { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { apply(JSON.parse(await i.files[0].text())); } catch { toast('Could not read that file'); } }; i.click(); }
  };
  $('#reset', root).onclick = () => confirmBox('Erase all data?', cloud()?.info().signedIn
    ? 'Every transaction, budget, goal and setting will be deleted from this device <b>and from your account, so also from your other devices</b>. Save a backup first if you might want it back.'
    : 'Every transaction, budget, goal and setting will be deleted from this device. Save a backup first if you might want it back.', 'Erase everything', () => { state = defaultState(); save(); ui.view = 'dashboard'; render(); });
  if (hasApi()) window.pywebview.api.data_location().then((p) => { const el = $('#dataLoc'); if (el) el.textContent = 'Saved automatically to ' + p; });
  else $('#dataLoc', root).textContent = isNativeApp() ? 'Saved automatically on this phone.' : 'Saved automatically in this browser.';
  bindCloud(root);
  $$('[data-cat-add]', root).forEach((b) => b.onclick = () => catForm({}, b.dataset.catAdd));
  $$('[data-cat-edit]', root).forEach((b) => b.onclick = () => catForm(cat(b.dataset.catEdit)));
  $$('[data-cat-del]', root).forEach((b) => b.onclick = () => {
    const c = cat(b.dataset.catDel);
    const siblings = state.categories.filter((x) => x.type === c.type && x.id !== c.id);
    if (!siblings.length) return toast('Keep at least one category of each type');
    const used = state.transactions.filter((t) => t.categoryId === c.id).length;
    const fallback = siblings.find((x) => /other/i.test(x.name)) || siblings[0];
    confirmBox('Delete category?', used ? `${used} transaction${used > 1 ? 's' : ''} will move to “${esc(fallback.name)}”.` : `“${esc(c.name)}” will be removed.`, 'Delete category', () => {
      state.transactions.forEach((t) => { if (t.categoryId === c.id) t.categoryId = fallback.id; });
      state.recurring.forEach((r) => { if (r.categoryId === c.id) r.categoryId = fallback.id; });
      state.budgets = state.budgets.filter((x) => x.categoryId !== c.id);
      state.categories = state.categories.filter((x) => x !== c); save(); render();
    });
  });
}

/* ================= app updates ================= */
/* sw.js sends "update-ready" when it has downloaded newer files into the cache.
   Reloading then shows the new version straight away. */
function showUpdateBanner() {
  if ($('#updateBanner')) return; // several files can change at once; show one banner
  const el = document.createElement('div');
  el.id = 'updateBanner'; el.className = 'update-banner'; el.setAttribute('role', 'status');
  el.innerHTML = `<span>A new version of Pocket Ledger is ready.</span>
    <button class="btn small primary" id="updNow">Refresh</button>
    <button class="icon-btn" id="updLater" aria-label="Not now">${icon('x')}</button>`;
  document.body.appendChild(el);
  // Wait a moment so any change typed just before is saved (save() waits 150ms).
  $('#updNow').onclick = () => setTimeout(() => location.reload(), 250);
  $('#updLater').onclick = () => el.remove();
}
if ('serviceWorker' in navigator && !isNativeApp()) {
  // A brand-new install also "changes controller", so only count it if one was running before.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'update-ready') showUpdateBanner(); });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showUpdateBanner(); });
}

/* ================= boot ================= */
function migrate(d) {
  const base = defaultState();
  d.settings = { ...base.settings, ...d.settings };
  for (const k of ['accounts', 'categories', 'transactions', 'budgets', 'goals', 'recurring']) if (!Array.isArray(d[k])) d[k] = base[k];
  d.version = 1;
  return d;
}
/* Combines a backup from another device ("theirs") into this device's data ("mine"). Nothing is deleted.
   Items with the same id are the same item, so they are never added twice. Each device made its own
   starter accounts and categories with different ids, so those also match by name.
   Returns { state, added } where added counts the new items in each list. Neither input is changed. */
function mergeStates(mine, theirs) {
  const out = JSON.parse(JSON.stringify(mine)); theirs = JSON.parse(JSON.stringify(theirs));
  const added = { transactions: 0, accounts: 0, categories: 0, goals: 0, budgets: 0, recurring: 0 };
  const sameName = (a, b) => String(a.name || '').trim().toLowerCase() === String(b.name || '').trim().toLowerCase();
  // Adds their items that this device doesn't have. Returns a map: their id -> the id used on this device.
  const mergeList = (k, sameAs, fix = (x) => x, onMatch = () => {}) => {
    const map = {};
    for (const item of theirs[k]) {
      const match = out[k].find((x) => x.id === item.id) || (sameAs && out[k].find((x) => sameAs(x, item)));
      if (match) { map[item.id] = match.id; onMatch(match, item); }
      else { map[item.id] = item.id; out[k].push(fix(item)); added[k]++; }
    }
    return map;
  };
  const accMap = mergeList('accounts', sameName);
  const catMap = mergeList('categories', (a, b) => a.type === b.type && sameName(a, b));
  const goalsBefore = new Set(out.goals.map((g) => g.id));
  const goalMap = mergeList('goals');
  const ref = (map, id) => (id != null && map[id]) || id;
  const recMap = mergeList('recurring', null,
    (r) => ({ ...r, accountId: ref(accMap, r.accountId), categoryId: ref(catMap, r.categoryId) }),
    (m, r) => { if (r.nextDate > m.nextDate) m.nextDate = r.nextDate; }); // the other device may have posted further ahead
  mergeList('budgets', (a, b) => a.categoryId === ref(catMap, b.categoryId) && a.period === b.period,
    (b) => ({ ...b, categoryId: ref(catMap, b.categoryId) }));

  for (const t of theirs.transactions) {
    Object.assign(t, { accountId: ref(accMap, t.accountId), toAccountId: ref(accMap, t.toAccountId), categoryId: ref(catMap, t.categoryId),
      goalId: ref(goalMap, t.goalId), fromGoalId: ref(goalMap, t.fromGoalId), recurringId: ref(recMap, t.recurringId) });
    for (const f of Object.keys(t)) if (t[f] === undefined) delete t[f];
    // Both devices post scheduled payments by themselves, each with its own id: same payment + same date = same transaction.
    const dup = out.transactions.some((x) => x.id === t.id || (t.recurringId && x.recurringId === t.recurringId && x.date === t.date));
    if (dup) continue;
    out.transactions.push(t); added.transactions++;
    // Same rule as goalEffect(). A goal that only existed on the other device already counts this in its saved amount.
    const g = out.goals.find((x) => x.id === (t.goalId || t.fromGoalId));
    if (g && goalsBefore.has(g.id)) g.saved = round2(g.saved + (t.goalId ? t.amount : -t.amount));
  }
  return { state: out, added };
}
/* Asks whether a backup should be merged into this device's data (safe) or replace it. */
function restoreBox(data) {
  const finish = (msg) => { postDueRecurring(); save(); render(); toast(msg); };
  openModal({
    title: 'Restore this backup?',
    body: `<p style="margin:0">It has ${plural(data.transactions.length, 'transaction')}.</p>
      <p class="hint" style="margin-top:10px"><b>Merge</b> keeps everything on this device and adds what’s new from the backup.
      <b>Replace</b> deletes what’s on this device and uses the backup instead.</p>`,
    foot: `<button class="btn" data-close>Cancel</button><button class="btn danger" id="rReplace">Replace my data</button><button class="btn primary" id="rMerge">Merge</button>`,
    onMount: (m) => {
      $('#rReplace', m).onclick = () => { closeModal(); state = migrate(data); finish('Backup restored'); };
      $('#rMerge', m).onclick = () => { closeModal(); const r = mergeStates(state, migrate(data)); state = r.state; finish(mergeSummary(r.added)); };
    },
  });
}
/* "Added 12 transactions, 1 account", or a note that the backup had nothing new. */
function mergeSummary(a) {
  const parts = [[a.transactions, 'transaction', 'transactions'], [a.accounts, 'account', 'accounts'], [a.categories, 'category', 'categories'],
    [a.goals, 'goal', 'goals'], [a.budgets, 'budget', 'budgets'], [a.recurring, 'scheduled payment', 'scheduled payments']]
    .filter(([n]) => n).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  return parts.length ? 'Added ' + parts.join(', ') : 'Nothing new in this backup';
}
/* ================= splash ================= */
const SPLASH_MIN_MS = 1200; // long enough to read, short enough not to annoy
const splashVersion = document.getElementById('splashVersion');
if (splashVersion) splashVersion.textContent = `Version ${APP_VERSION}`;
function hideSplash() {
  const el = document.getElementById('splash'); if (!el) return;
  const wait = Math.max(0, SPLASH_MIN_MS - performance.now()); // performance.now() = ms since the app opened
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => { el.remove(); updateSystemBars(); }, 450); }, wait);
}

async function boot() {
  const data = await loadState();
  state = data ? migrate(data) : defaultState();
  postDueRecurring();
  render();
  hideSplash();
  // Sync is optional: if anything in it fails, the app carries on without it.
  try {
    cloud()?.onChange(onCloudChange); // the home page button and Settings show the account
    cloud()?.attach({
      getState: () => state,
      // Changes from another device (or the first download): keep them and show them.
      setState: (s) => { state = s; save(); renderSoon(); },
      merge: (mine, theirs) => mergeStates(mine, migrate(JSON.parse(JSON.stringify(theirs)))).state,
      migrate,
      confirmMerge,
      isOnline: () => navigator.onLine !== false,
    });
    cloud()?.start();
  } catch (e) { console.error('Sync could not start', e); }
  // Re-render at midnight so "today" stays correct if the app is left open.
  setInterval(() => { const t = today(); if (t !== boot.last) { boot.last = t; postDueRecurring(); if (!$('#overlay')) render(); } }, 60000);
  boot.last = today();
}
/* Automated tests (tests/app.test.mjs) set __LEDGER_TEST__ before loading this file
   to reach the functions inside, and start the app themselves. */
if (window.__LEDGER_TEST__) {
  window.__ledger = {
    get state() { return state; }, set state(v) { state = v; }, ui,
    defaultState, migrate, mergeStates, restoreBox, mergeSummary, render, money, esc, addDays, addMonths, daysBetween, weekStartOf, toISO, parseISO,
    weekInfo, accountBalance, totalBalance, postDueRecurring, nextOccurrence, budgetStatus, filteredTx,
    periodRange, categoryRows, deleteTx, goalEffect, txForm, niceMax, plural, showUpdateBanner,
    calcEval, toolMath, calcPad, settleCalc,
    cloudPanel, accountForm, confirmMerge, syncLine, onCloudChange, renderSoon, backupDue, saveBackup, snoozeBackup, lastBackupText, hideTip, TIP_TOUCH_MS, hideSplash, SPLASH_MIN_MS,
  };
} else {
  let booted = false;
  const start = () => { if (!booted) { booted = true; boot(); } };
  window.addEventListener('pywebviewready', start);
  // Outside the desktop app (plain browser), fall back to local storage.
  setTimeout(() => { if (!window.pywebview) start(); }, 700);
}
})();

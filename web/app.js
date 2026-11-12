/* Pocket Ledger — app logic. Plain JS, no dependencies. */
(() => {
'use strict';

/* ================= constants ================= */
const APP_VERSION = '1.9.10';
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
  chevron: '<path d="m9 6 6 6-6 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  swap: '<path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  minus: '<path d="M5 12h14"/>',
  cloud: '<path d="M17.5 19H7a5 5 0 1 1 .9-9.92A6 6 0 0 1 19 10.5a4.25 4.25 0 0 1-1.5 8.5z"/>',
  // Not signed in: the same cloud with a diagonal line; the mask cuts a small gap on each side of the line.
  cloudOff: '<mask id="pl-cloud-off"><rect width="24" height="24" fill="#fff"/><path d="M3 3 21 21" stroke="#000" stroke-width="5"/></mask><path mask="url(#pl-cloud-off)" d="M17.5 19H7a5 5 0 1 1 .9-9.92A6 6 0 0 1 19 10.5a4.25 4.25 0 0 1-1.5 8.5z"/><path d="M3.5 3.5 20.5 20.5"/>',
  cloudOk: '<path d="M17.5 19H7a5 5 0 1 1 .9-9.92A6 6 0 0 1 19 10.5a4.25 4.25 0 0 1-1.5 8.5z"/><path d="m9 13.5 2 2 4-4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  calc: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
  auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
};
/* Category icons for the Aesthetic look, matched by the category's name (people can rename or add categories,
   so anything unknown gets three dots). Drawn in the category's colour on a soft tint of it. */
const CAT_ICONS = [
  [/eat|restaurant|coffee|cafe|lunch/i, 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z'],
  [/food|grocer/i, 'M3 10h18l-2 10H5L3 10zM8 10l4-6 4 6'],
  [/transport|bus|travel|taxi|fuel|car/i, 'M5 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11H5zM5 12h14M8 17v2M16 17v2'],
  [/shop|cloth/i, 'M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0'],
  [/entertain|fun|movie|game/i, 'M12 3l2.6 5.6 6 .7-4.5 4 1.3 6L12 16.4 6.6 19.3l1.3-6-4.5-4 6-.7z'],
  [/phone|internet|mobile/i, 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2'],
  [/health|medic|doctor|pharm/i, 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
  [/gift/i, 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0'],
  [/educat|school|book|class/i, 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16'],
  [/bill|utilit|electric|water/i, 'M7 3h10v18l-2-1.5L12 21l-3-1.5L7 21zM10 8h4M10 12h4'],
  [/rent|hous|home/i, 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  [/salary|wage|pay/i, 'M3 7h18v12H3zM16 13h2M3 7l3-3h12l3 3'],
  [/freelance|side|work/i, 'M4 20h4L18 10l-4-4L4 16zM13 7l4 4'],
  [/pocket|allowance|coin/i, 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v10M15 9.5c0-1-1.3-1.5-3-1.5s-3 .7-3 2 1.3 1.6 3 2 3 1 3 2-1.3 2-3 2-3-.5-3-1.5'],
  [/^__transfer$/, 'M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4'],
];
function catIcon(name = '') {
  const d = (CAT_ICONS.find(([re]) => re.test(name)) || [, 'M5 12h.01M12 12h.01M19 12h.01'])[1];
  return `<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}
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
  cal: { month: '', sel: '', hide: [] }, // Calendar page: month shown, day picked, marks hidden ('' = today)
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
    scheduleNotifications();
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
      lastBackup: '', backupSnoozeUntil: '',
      reviewAsked: '', // the day we last asked Google Play to show the "rate this app" stars
      style: 'professional', // the look: 'professional' or 'aesthetic' (soft, like a planner). Each device has its own.
      // Phone notifications (Android app only). Kept on this device, not synced: each phone has its own.
      // All off for a new install: turning one on asks Android for permission then (turnOnNotify). No exact alarms.
      notify: { daily: false, dailyTime: '20:00', bills: false, limit: false, summary: false, reminders: false, limitWarnAt: '' } },
    accounts: [
      { id: uid(), name: 'Cash', initial: 0, color: PALETTE[2] },
      { id: uid(), name: 'Bank account', initial: 0, color: PALETTE[0] },
    ],
    categories: [
      ...exp.map(([name, weekly], i) => ({ id: uid(), name, type: 'expense', color: PALETTE[i % PALETTE.length], weekly })),
      ...inc.map((name, i) => ({ id: uid(), name, type: 'income', color: PALETTE[(i + 5) % PALETTE.length], weekly: false })),
    ],
    transactions: [], budgets: [], goals: [], recurring: [], reminders: [],
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
/* How much one transaction adds to (+) or takes from (-) an account. */
function txEffect(t, accId) {
  if (!t) return 0;
  if (t.type === 'income') return t.accountId === accId ? t.amount : 0;
  if (t.type === 'expense') return t.accountId === accId ? -t.amount : 0;
  return (t.accountId === accId ? -t.amount : 0) + (t.toAccountId === accId ? t.amount : 0);
}
/* Saving `rec` (replacing `old` when editing): the account money leaves and its balance afterwards, if that goes below
   zero and gets worse. Accounts marked "can go below zero" (credit card, loan) never warn. */
function overdraws(rec, old) {
  const a = state.accounts.find((x) => x.id === rec.accountId);
  if (!a || a.credit) return null;
  const now = accountBalance(a); const after = round2(now - txEffect(old, a.id) + txEffect(rec, a.id));
  return after < 0 && after < now ? { account: a, after } : null;
}

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
/* The day this person started using the app: the welcome screen sets it; for older data (and backdated entries)
   the oldest transaction counts if it is earlier. */
function startedOn() {
  const first = state.transactions.reduce((m, x) => (x.date < m ? x.date : m), state.settings.startedOn || today());
  return first;
}
function weekInfo(refIso = today()) {
  const start = weekStartOf(refIso); const end = addDays(start, 6);
  const t = today();
  const fullB = +state.settings.weeklyBudget || 0;
  // First week, started mid-week (e.g. Thursday): the days before have no share, and the limit is cut to the days
  // left (6,000 x 4/7), so the daily amount is the normal one. From the next week on, the full limit.
  const s0 = startedOn(); const firstIdx = s0 > start && s0 <= end ? daysBetween(start, s0) : 0;
  const B = round2(fullB * (7 - firstIdx) / 7);
  const counted = (tx) => cat(tx.categoryId)?.weekly !== false;
  const ex = expensesIn(start, end).filter(counted);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, spent: round2(sum(ex.filter((x) => x.date === date), (x) => x.amount)) };
  });
  const todayIdx = clamp(daysBetween(start, t), 0, 6);
  // Spent = up to today. Expenses dated later this week (rent on Saturday) are "planned": not spent yet, but kept
  // aside, so the coming days' shares are what is left on top of them.
  const spent = round2(sum(days.slice(0, todayIdx + 1), (d) => d.spent));
  const planned = round2(sum(days.slice(todayIdx + 1), (d) => d.spent));
  const isCurrent = t >= start && t <= end;
  const before = round2(sum(days.slice(0, todayIdx), (d) => d.spent));
  const daysLeft = 7 - todayIdx;
  const allowanceToday = B ? Math.max(0, B - before) / daysLeft : 0;
  const spentToday = days[todayIdx].spent;
  const leftToday = round2(allowanceToday - spentToday);
  const remaining = round2(B - spent);
  // Future days share what is left once today's share is used up.
  const perDayAfter = daysLeft > 1 ? Math.max(0, remaining - planned - Math.max(0, leftToday)) / (daysLeft - 1) : 0;
  // Each day's share: up to today, what that day had when it was "today" (what was left of the limit / days left then),
  // so a day never turns red after midnight just because it became a past day. Future days get perDayAfter.
  let spentBefore = 0;
  days.forEach((d, i) => {
    d.beforeStart = i < firstIdx;
    d.share = !B || d.beforeStart ? 0 : i <= todayIdx ? Math.max(0, B - spentBefore) / (7 - i) : perDayAfter;
    spentBefore = round2(spentBefore + d.spent);
  });
  return { start, end, days, spent, planned, B, fullB, firstIdx, todayIdx, isCurrent, daysLeft, allowanceToday, spentToday, leftToday, remaining, perDayAfter, counted };
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
/* Phones: the round + slides away while scrolling down (so it doesn't cover amounts) and comes back on scrolling up
   or near the top. Small moves (under 6px) are ignored so it doesn't flicker. */
let lastMainScroll = 0;
function fabOnScroll(main) {
  const y = main.scrollTop, w = $('#fabWrap');
  if (Math.abs(y - lastMainScroll) < 6 && y > 40) return;
  if (w && !w.classList.contains('open')) w.classList.toggle('fab-hide', y > 40 && y > lastMainScroll);
  lastMainScroll = y;
}
document.addEventListener('scroll', (e) => { if (e.target.classList?.contains('main')) fabOnScroll(e.target); }, true);

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
  // The whole row opens the edit window (it has Delete too). The pencil and bin stay for mouse users on wide screens.
  return `<div class="tx tx-tap" data-edit-row="${t.id}" role="button" tabindex="0" aria-label="Edit ${esc(title)}">
    <div class="glyph" style="background:${glyphColor};--c:${glyphColor}"><span class="g-l">${esc(letter)}</span>${catIcon(t.type === 'transfer' ? '__transfer' : c?.name)}</div>
    <div style="min-width:0"><div class="t1">${esc(title)}${t.recurringId ? '<span class="tag">Scheduled</span>' : ''}</div><div class="t2">${sub}</div></div>
    <div class="amt ${amtCls}">${amt}</div>
    <div class="row-actions"><button class="icon-btn" data-edit-tx="${t.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-del-tx="${t.id}" aria-label="Delete">${icon('trash')}</button></div>
  </div>`;
}
/* Transactions by day, newest first. Ones dated after today (rent on Saturday) come first in their own
   "Upcoming" section, soonest first: they haven't happened yet, so they aren't in the totals. */
function txListGrouped(list) {
  const t = today();
  const netOf = (g) => sum(g, (x) => x.type === 'income' ? x.amount : x.type === 'expense' ? -x.amount : 0);
  const days = (items, newestFirst) => {
    const groups = {};
    for (const x of items) (groups[x.date] ||= []).push(x);
    const keys = Object.keys(groups).sort(); if (newestFirst) keys.reverse();
    return keys.map((d) => { const net = netOf(groups[d]);
      return `<div class="tx-day"><span>${fmtDate(d)}</span><span class="num">${net ? money(net, { sign: true }) : ''}</span></div>${groups[d].map(txRow).join('')}`; }).join('');
  };
  const up = list.filter((x) => x.date > t), done = list.filter((x) => x.date <= t);
  const upNet = netOf(up);
  return `${up.length ? `<section class="tx-upcoming" aria-label="Upcoming">
      <div class="tx-up-head">${icon('calendar')}<b>Upcoming</b><span class="muted">not counted yet</span><span class="num">${upNet ? money(upNet, { sign: true }) : ''}</span></div>
      <div class="tx-list">${days(up, false)}</div></section>` : ''}
    ${done.length ? `<div class="tx-list">${days(done, true)}</div>` : ''}`;
}
function bindTxRows(root) {
  const open = (row) => txForm(state.transactions.find((t) => t.id === row.dataset.editRow));
  $$('[data-edit-row]', root).forEach((row) => {
    row.onclick = (e) => { if (!e.target.closest('.row-actions')) open(row); };
    row.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === row) { e.preventDefault(); open(row); } };
  });
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
      ${type === 'transfer' ? '' : `<div class="field"><span>Category</span><div class="chips" id="fCats">${state.categories.filter((c) => c.type === type).map((c) => `<button type="button" class="chip ${c.id === draft.categoryId ? 'on' : ''}" data-id="${c.id}"><i class="dot" style="background:${c.color};--c:${c.color}">${catIcon(c.name)}</i>${esc(c.name)}</button>`).join('')}</div></div>`}
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
  // The Aesthetic look names what is being added ("New expense") and changes with the type.
  const aesTitle = () => (isEdit ? 'Edit entry' : { expense: 'New expense', income: 'Money in', transfer: 'Move money' }[type]);
  const title = aesthetic() ? aesTitle() : isEdit ? 'Edit transaction' : 'New transaction';

  const capture = (m) => {
    draft.amount = $('#fAmount', m).value; draft.note = $('#fNote', m).value;
    draft.accountId = $('#fAcc', m).value; draft.date = $('#fDate', m)?.value || draft.date;
    if ($('#fTo', m)) draft.toAccountId = $('#fTo', m).value;
  };
  const mount = (m) => {
    $$('#typeSeg button', m).forEach((b) => b.onclick = () => {
      capture(m); type = b.dataset.v; draft.categoryId = undefined;
      $('.modal-body', m).innerHTML = body(); $('#fSave', m).textContent = isEdit ? 'Save changes' : 'Add ' + type; mount(m); $('#fAmount', m).focus();
      if (aesthetic()) $('.modal-head h2', m).textContent = aesTitle();
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
    const od = !m._negOk && overdraws(rec, isEdit ? state.transactions.find((t) => t.id === existing.id) : null);
    if (od) {
      // Ask first, right in the form: usually the income that should come first hasn't been added yet.
      $('#negWarn', m)?.remove();
      $('.modal-body', m).insertAdjacentHTML('afterbegin', `<div class="alert over neg-warn" id="negWarn" role="alert">${icon('alert')}<div>
        <b>This takes ${esc(od.account.name)} to ${esc(money(od.after))}.</b> Did you forget to add income first?
        <div class="alert-actions"><button class="btn small primary" id="negOk" type="button">Save anyway</button><button class="btn small ghost" id="negBack" type="button">Go back</button></div>
        <span class="hint">A credit card or loan? Edit the account and turn on “Can go below zero”.</span></div></div>`);
      $('#negOk', m).onclick = () => { m._negOk = true; commit(m, again); };
      $('#negBack', m).onclick = () => { $('#negWarn', m)?.remove(); $('#fAmount', m)?.focus(); };
      $('.modal-body', m).scrollTop = 0;
      return;
    }
    m._negOk = false; $('#negWarn', m)?.remove();
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
    } else { closeModal(); render(); toast(isEdit ? 'Changes saved' : `Added ${money(amount)} ${type}`); if (!isEdit) askForReview(); }
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
/* A round step for a chart scale: 1, 2, 2.5 or 5 times a power of ten, at least v. */
function niceStep(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
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
  // About 5 round steps up to the biggest bar, so every label is a round number (10k, 20k ...).
  const top = Math.max(1, ...groups.flatMap((g) => g.values.map((x) => x.v)));
  const step = niceStep(top / 5); const max = Math.ceil(top / step - 1e-9) * step;
  const iw = W - L - R, ih = H - T - B, gw = iw / Math.max(1, groups.length);
  const n = groups[0]?.values.length || 1;
  const bw = Math.min(28, (gw * 0.72) / n);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  for (const t of ticks) { const y = T + ih - (t / max) * ih; s += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="axis" x="${L - 8}" y="${y + 4}" text-anchor="end">${esc(money(t, { compact: true, short: true }))}</text>`; }
  // Label every bar when its label fits (Mon..Sun and Jun..Nov fit on a phone); skip some only when they would touch.
  const labelW = Math.max(...groups.map((g) => String(g.label).length)) * 6.5 + 6; // about 6.5px a letter at 11px
  const every = Math.max(1, Math.ceil(labelW / gw));
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
/* note: optional small grey line under a category's name (e.g. "Not in weekly limit"), also added to its tooltip. */
function hbars(rows, total, note = () => '') {
  if (!rows.length) return '';
  const max = Math.max(...rows.map((r) => r.v));
  return `<div class="hbars">${rows.map((r) => { const n = note(r); return `<div class="hbar" data-tip="${esc(`${esc(r.name)}<br><b>${esc(money(r.v))}</b> · ${total ? Math.round(r.v / total * 100) : 0}% of spending${r.n ? `<br>${r.n} transaction${r.n > 1 ? 's' : ''}` : ''}${n ? `<br>${esc(n)}` : ''}`)}">
    <div class="lbl"><i class="dot" style="background:${r.color}"></i><span class="lbl-txt">${esc(r.name)}${n ? `<small>${esc(n)}</small>` : ''}</span></div>
    <div class="track"><i style="width:${(r.v / max) * 100}%"></i></div>
    <div class="v">${moneyHtml(r.v, { short: true })}<small>${total ? Math.round(r.v / total * 100) : 0}%</small></div></div>`; }).join('')}</div>`;
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
  // Shares are in whole cents: 1,000 / 3 = 333.33 each, and the leftover cent goes to one person (333.34), so they add up.
  split: (total, people, extraPct = 0) => {
    const all = round2(total * (1 + extraPct / 100));
    const cents = Math.round(all * 100); const each = Math.floor(cents / people) / 100; const extra = cents % people;
    return { all, each, extra, last: round2(each + extra / 100) };
  },
  // Monthly payment of a loan or lease.
  //   Reducing balance (banks): amount × r / (1 − (1 + r)^−months), r = yearly rate ÷ 12; interest only on what is still owed.
  //   Flat rate (many leasing companies): interest on the full amount for the whole time, amount × rate × years.
  loan: (amount, yearRate, months, kind = 'reducing') => {
    const r = yearRate / 1200;
    const monthly = round2(kind === 'flat' ? (amount + amount * yearRate / 100 * months / 12) / months
      : r ? amount * r / (1 - Math.pow(1 + r, -months)) : amount / months);
    // Totals from the rounded monthly payment, so "each month x months" matches "you pay back".
    const total = round2(monthly * months);
    return { monthly, total, interest: round2(total - amount) };
  },
  // Whole weeks / months you can still save in (10 days = 2 weekly payments), so the amounts really add up to the target.
  saving: (target, saved, days) => {
    const left = round2(Math.max(0, target - saved));
    const weeks = Math.max(1, Math.ceil(days / 7)), months = Math.max(1, Math.ceil(days / 30.4375));
    return { left, weeks, months, perWeek: round2(Math.ceil(left / weeks * 100) / 100), perMonth: round2(Math.ceil(left / months * 100) / 100) };
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
    if (n('pct') < 0 || n('pct') > 100) return wait('The discount must be between 0 and 100%.');
    const r = toolMath.discount(n('price'), n('pct'));
    return row('You save', r.off) + row('You pay', r.pay, true) + `<button class="btn small" data-tool-add="${r.pay}">${icon('plus')}Add as expense</button>`;
  }
  if (tool === 'split') {
    const people = Math.round(n('people') || 0);
    if (!(n('total') > 0) || people < 1) return wait('Enter the bill total and how many people.');
    if ((n('extra') || 0) < 0) return wait('The service charge or tip can’t be below 0%.');
    const r = toolMath.split(n('total'), people, n('extra') || 0);
    return row('Total to pay', r.all) + row('Each person pays', r.each, true)
      + (r.extra ? `<p class="hint">${r.extra === 1 ? 'One person pays' : `${r.extra} people pay`} ${esc(money(r.last))}, so it adds up to ${esc(money(r.all))}.</p>` : '') + `<button class="btn small" data-tool-add="${r.each}">${icon('plus')}Add my share as expense</button>`;
  }
  if (tool === 'loan') {
    const months = Math.round(n('months') || 0);
    if (!(n('amount') > 0) || n('rate') === null || n('rate') < 0 || months < 1) return wait('Enter the amount, the yearly interest and the number of months.');
    const flat = v.kind === 'flat';
    const r = toolMath.loan(n('amount'), n('rate'), months, flat ? 'flat' : 'reducing');
    // The other way of charging interest, for comparing a lease quote with a bank loan.
    const other = toolMath.loan(n('amount'), n('rate'), months, flat ? 'reducing' : 'flat');
    return row('Each month', r.monthly, true) + row('Interest in total', r.interest) + row('You pay back', r.total)
      + (n('rate') > 0 ? `<p class="hint">At ${esc(String(n('rate')))}% ${flat ? 'reducing balance (bank loan)' : 'flat rate (leasing quote)'}: ${esc(money(other.monthly))} a month.</p>` : '');
  }
  if (tool === 'saving') {
    if (!(n('target') > 0) || !v.date) return wait('Enter what you need and by when.');
    const days = daysBetween(today(), v.date);
    if (days < 1) return wait('Pick a date after today.');
    const r = toolMath.saving(n('target'), n('saved') || 0, days);
    if (!r.left) return wait('You already have enough. Well done!');
    return row('Still needed', r.left) + row(`Put aside each week (${plural(r.weeks, 'week')})`, r.perWeek, true) + row(`or each month (${plural(r.months, 'month')})`, r.perMonth)
      + `<button class="btn small" data-tool-goal="${n('target')}" data-tool-saved="${n('saved') || 0}" data-tool-date="${esc(v.date)}">${icon('flag')}Make it a savings goal</button>`;
  }
  return '';
}
/* ---------- calendar ---------- */
/* Amounts small enough for a calendar day: 450, 1.2k, 12k, 1.5M (no symbol, there is no room). */
const calAmt = (v) => v < 1000 ? String(Math.round(v)) : v < 1e6 ? (v / 1000).toFixed(v < 10000 ? 1 : 0).replace(/\.0$/, '') + 'k' : (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
/* The marks a day can have; each can be hidden with the legend under the month. */
const CAL_KINDS = [['bill', 'Bills'], ['income', 'Income'], ['goal', 'Goal dates'], ['remind', 'Reminders']];
/* Things still to come between from and to: every day a scheduled payment will repeat on, and goal target dates. */
function calEvents(from, to) {
  const out = [];
  for (const r of state.recurring) {
    if (!r.active) continue;
    let d = r.nextDate, guard = 0;
    while (d <= to && guard++ < 800) {
      if (d >= from) out.push({ kind: r.type === 'income' ? 'income' : 'bill', date: d, label: r.note || catName(r.categoryId), amount: r.type === 'income' ? r.amount : -r.amount, recId: r.id });
      d = nextOccurrence(r, d);
    }
  }
  // Reminders not done yet, on their date and (if they repeat) every date after it.
  for (const x of state.reminders) {
    if (x.done) continue;
    for (let d = x.date, guard = 0; d <= to && guard < 800; guard++) {
      if (d >= from) out.push({ kind: 'remind', date: d, label: x.title, amount: remAmount(x), remId: x.id });
      if (!x.frequency) break;
      d = nextOccurrence(x, d);
    }
  }
  for (const g of state.goals) {
    if (g.deadline && g.deadline >= from && g.deadline <= to && g.saved < g.target) out.push({ kind: 'goal', date: g.deadline, label: g.name, left: round2(g.target - g.saved), goalId: g.id });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
/* Days up to today: 'none' (nothing spent, a no-spend day), and with a weekly limit 'under' or 'over' that day's share. */
function calDayMarks(from, to) {
  const t = today(); const s0 = startedOn(); const out = {};
  const spentOn = new Set(state.transactions.filter((x) => x.type === 'expense').map((x) => x.date));
  const limit = +state.settings.weeklyBudget > 0;
  for (let ws = weekStartOf(from); ws <= to; ws = addDays(ws, 7)) {
    for (const d of weekInfo(ws).days) {
      if (d.date < from || d.date > to || d.date > t || d.date < s0) continue;
      if (!spentOn.has(d.date)) { if (d.date < t) out[d.date] = 'none'; } // today isn't over yet
      else if (limit && !d.beforeStart) out[d.date] = d.spent > d.share + 0.001 ? 'over' : 'under';
    }
  }
  return out;
}
/* How much a transaction changes the total of all accounts (money moved into or out of a goal counts). */
const totalEffect = (x) => x.type === 'income' ? x.amount : x.type === 'expense' ? -x.amount : (x.toAccountId ? x.amount : 0) - (x.accountId ? x.amount : 0);
/* Expected total balance at the end of each day from today to `to`: today's balance, then what's already logged
   for later days and every scheduled payment. Everyday spending isn't in it (see dailySpend). */
function forecast(to) {
  const t = today(); const changes = {};
  const later = state.transactions.filter((x) => x.date > t);
  for (const x of later) if (x.date <= to) changes[x.date] = (changes[x.date] || 0) + totalEffect(x);
  for (const e of calEvents(addDays(t, 1), to)) if (e.kind !== 'goal') changes[e.date] = (changes[e.date] || 0) + e.amount;
  let bal = round2(totalBalance() - sum(later, totalEffect)); // totalBalance counts entries dated later too
  const out = { [t]: bal };
  for (let d = addDays(t, 1); d <= to; d = addDays(d, 1)) { bal = round2(bal + (changes[d] || 0)); out[d] = bal; }
  return out;
}
/* With a weekly limit, a day's everyday spending is about a seventh of it; without one we don't guess. */
const dailySpend = () => round2((+state.settings.weeklyBudget || 0) / 7);
/* The first day in the next `days` the forecast goes below zero, or null. */
function firstShortDay(fc, days = 60) {
  const t = today();
  for (let d = addDays(t, 1); d <= addDays(t, days); d = addDays(d, 1)) if (fc[d] < 0) return d;
  return null;
}
/* Payday: the next time the biggest scheduled income comes in (within 45 days), and how much there is to live on
   each day until then once the bills before it are paid. */
function nextPayday(fc = forecast(addDays(today(), 45))) {
  const t = today();
  const incomes = calEvents(addDays(t, 1), addDays(t, 45)).filter((e) => e.kind === 'income');
  if (!incomes.length) return null;
  const biggest = incomes.reduce((a, b) => (b.amount > a.amount ? b : a));
  const pay = incomes.find((e) => e.recId === biggest.recId); // its soonest date
  const days = daysBetween(t, pay.date); // today up to the day before payday
  const before = fc[addDays(pay.date, -1)];
  return { ...pay, days, before, perDay: round2(Math.max(0, before) / days) };
}
const calMonth = () => ui.cal.month || monthStart(today());
const calSel = () => ui.cal.sel || today();
function viewCalendar() {
  const t = today(); const month = calMonth(); const sel = calSel(); const last = monthEnd(month);
  const hidden = (k) => ui.cal.hide.includes(k);
  const ws = state.settings.weekStart; const m = parseISO(month);
  // Logged money counts up to today, like the Home page; a later month has nothing logged yet.
  const upTo = last < t ? last : t;
  const mInc = upTo >= month ? round2(sum(incomeIn(month, upTo), (x) => x.amount)) : 0;
  const mExp = upTo >= month ? round2(sum(expensesIn(month, upTo), (x) => x.amount)) : 0;
  const marks = calDayMarks(month, last);
  const events = calEvents(month, last);
  const billsLeft = events.filter((e) => e.kind === 'bill' && e.date > t);
  // Expected balances far enough ahead for this month, the shortfall warning (60 days) and payday (45 days).
  const fc = forecast(last > addDays(t, 60) ? last : addDays(t, 60));
  const short = firstShortDay(fc); const pay = nextPayday(fc);
  const spent = {}; const got = {};
  for (const x of state.transactions) if (x.date >= month && x.date <= last) {
    if (x.type === 'expense') spent[x.date] = (spent[x.date] || 0) + x.amount;
    if (x.type === 'income') got[x.date] = true;
  }
  const box = (k, v, cls = '') => `<div class="cal-sum-box"><span>${k}</span><b class="${cls}">${v}</b></div>`;
  const fourth = month >= monthStart(t)
    ? box('Bills to pay', billsLeft.length ? `${billsLeft.length} · ${esc(money(-sum(billsLeft, (e) => e.amount), { short: true }))}` : 'None')
    : box('No-spend days', Object.values(marks).filter((v) => v === 'none').length);
  const summary = `<div class="cal-sum">${box('Income', esc(money(mInc, { short: true })), 'pos')}${box('Spent', esc(money(mExp, { short: true })), 'neg')}${box('Net', esc(money(mInc - mExp, { sign: true, short: true })), mInc - mExp < 0 ? 'neg' : '')}${fourth}</div>`;

  const names = Array.from({ length: 7 }, (_, i) => `<span title="${DAY_LONG[(ws + i) % 7]}">${DAY_SHORT[(ws + i) % 7][0]}</span>`).join('');
  let cells = '<i></i>'.repeat((m.getDay() - ws + 7) % 7); // empty boxes before day 1
  for (let d = month; d <= last; d = addDays(d, 1)) {
    const sp = round2(spent[d] || 0); const evs = events.filter((e) => e.date === d);
    const kinds = new Set(evs.map((e) => e.kind)); if (got[d]) kinds.add('income');
    const dots = CAL_KINDS.filter(([k]) => kinds.has(k) && !hidden(k)).map(([k]) => `<i class="mk ${k}"></i>`).join('');
    const low = d > t && fc[d] < 0; // the forecast is below zero on this day
    const label = [fmtDate(d, { full: true }), sp && `spent ${money(sp)}`, marks[d] === 'none' && 'no-spend day', ...evs.map((e) => e.label), low && 'money may run short'].filter(Boolean).join(', ');
    cells += `<button type="button" class="cal-day ${marks[d] || ''} ${low ? 'short' : ''} ${d === t ? 'today' : ''} ${d === sel ? 'on' : ''} ${d > t ? 'future' : ''}" data-cal-day="${d}" aria-label="${esc(label)}" aria-pressed="${d === sel}">
      <b>${parseISO(d).getDate()}</b><small>${sp ? calAmt(sp) : marks[d] === 'none' ? '✓' : '&nbsp;'}</small><span class="cal-marks">${dots}</span></button>`;
  }
  const legend = `<div class="cal-legend">${CAL_KINDS.map(([k, l]) => `<button type="button" class="cal-key ${hidden(k) ? 'off' : ''}" data-cal-kind="${k}" aria-pressed="${!hidden(k)}"><i class="mk ${k}"></i>${l}</button>`).join('')}
    ${+state.settings.weeklyBudget > 0 ? '<span class="cal-key-note"><i class="sw under"></i>Within daily share <i class="sw over"></i>Over</span>' : ''}</div>`;

  // The chosen day: what's planned for it, then what was logged.
  const dayList = newestFirst(state.transactions.filter((x) => x.date === sel));
  const dayEvs = calEvents(sel, sel);
  const net = sum(dayList, (x) => x.type === 'income' ? x.amount : x.type === 'expense' ? -x.amount : 0);
  const evRow = (e, withDate) => `<button type="button" class="cal-ev" ${withDate ? `data-cal-go="${e.date}"` : e.recId ? `data-cal-rec="${e.recId}"` : e.remId ? `data-cal-rem="${e.remId}"` : `data-cal-goal="${e.goalId}"`}>
    ${withDate ? `<span class="cal-ev-date ${e.overdue ? 'neg' : ''}">${fmtDate(e.date)}</span>` : ''}<i class="mk ${e.kind}"></i>
    <span class="cal-ev-name">${esc(e.label)}<small>${e.kind === 'goal' ? `Goal date · ${esc(money(e.left, { short: true }))} to go`
      : e.kind === 'remind' ? `${e.overdue ? '<span class="neg">Overdue</span> · ' : ''}${FREQ[state.reminders.find((x) => x.id === e.remId)?.frequency] || 'Reminder'}`
      : FREQ[state.recurring.find((r) => r.id === e.recId)?.frequency] || 'Scheduled'}</small></span>
    <span class="cal-ev-amt ${e.amount > 0 ? 'pos' : ''}">${e.amount ? moneyHtml(e.amount, { sign: true, short: true }) : ''}</span></button>`;
  // Today: the balance now. A later day: what should be left after the scheduled payments up to it, and with a
  // weekly limit, also after everyday spending at that pace.
  let fcHtml = '';
  if (sel >= t && fc[sel] !== undefined) {
    const ds = dailySpend(); const withSpend = round2(fc[sel] - ds * daysBetween(t, sel));
    fcHtml = `<div class="cal-fc"><span>${sel === t ? 'Balance now' : 'Expected balance'}</span><b class="${fc[sel] < 0 ? 'neg' : ''}">${moneyHtml(fc[sel])}</b>
      ${sel > t ? `<p class="hint">After the scheduled payments and planned entries up to this day${ds ? `. With everyday spending at your limit (${esc(money(ds, { short: true }))} a day): about <b class="${withSpend < 0 ? 'neg' : ''}">${esc(money(withSpend, { short: true }))}</b>` : ''}.</p>` : ''}</div>`;
  }
  const dayPanel = `<div class="panel cal-sel"><h2>${fmtDate(sel, { full: true })}<small>${net ? money(net, { sign: true }) : ''}</small></h2>
    ${fcHtml}
    ${dayEvs.map((e) => evRow(e, false)).join('')}
    ${dayList.length ? `<div class="tx-list">${dayList.map(txRow).join('')}</div>` : ''}
    ${!dayEvs.length && !dayList.length ? `<p class="hint cal-none">Nothing on this day${sel < t ? '' : ' yet'}.</p>` : ''}
    <div class="cal-adds"><button class="btn small" type="button" data-cal-add="expense">${icon('plus')}Expense</button><button class="btn small" type="button" data-cal-add="income">${icon('plus')}Income</button><button class="btn small" type="button" data-cal-remind>${icon('bell')}Reminder</button></div></div>`;
  // Reminders whose day has passed without being marked done come first, in red.
  const overdue = state.reminders.filter((x) => !x.done && x.date < t).sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => ({ kind: 'remind', date: x.date, label: x.title, amount: remAmount(x), remId: x.id, overdue: true }));
  const soon = [...overdue, ...calEvents(t, addDays(t, 30))].slice(0, 8);
  const soonPanel = `<div class="panel cal-soon"><h2>Coming up <small>next 30 days</small></h2>
    ${soon.length ? soon.map((e) => evRow(e, true)).join('') : `<p class="hint cal-none">Nothing coming up. Schedule your rent, salary and bills, add a reminder, or give a savings goal a target date, and they show here and on the calendar.</p>
      <button class="btn small" type="button" data-go="recurring">${icon('repeat')}Schedule a payment</button>`}</div>`;

  const showToday = month !== monthStart(t) || sel !== t;
  return `<div class="head"><div><h1>Calendar</h1><p>Your spending, bills and goals, day by day.</p></div>
    ${showToday ? '<div class="actions"><button class="btn" type="button" id="calToday">Today</button></div>' : ''}</div>
    ${pay || short ? `<div class="cal-top">${pay ? `<button type="button" class="cal-pay" data-cal-go="${pay.date}">
        <span class="cal-pay-n"><b>${pay.days}</b>${pay.days === 1 ? 'day' : 'days'}</span>
        <span class="cal-pay-text"><span><b>${pay.days === 1 ? 'Payday is tomorrow' : 'to payday'}</b> · ${esc(pay.label)}, ${fmtDate(pay.date, { full: true })}</span>
          <small>${pay.before < 0 ? `Bills before then are more than you have: <b class="neg">${esc(money(pay.before, { short: true }))}</b> on the day before`
            : `About <b>${esc(money(pay.perDay, { short: true }))}</b> a day to live on until then, after bills`}</small></span></button>` : ''}
      ${short ? `<button type="button" class="cal-warn" data-cal-go="${short}">${icon('alert')}<span><b>Money may run short on ${fmtDate(short, { full: true })}</b>
        <small>About ${esc(money(fc[short], { short: true }))} after the scheduled payments up to then. Tap to see that day.</small></span></button>` : ''}</div>` : ''}
    <div class="cal-page">
      <div class="panel cal-main">
        <div class="cal-head"><button class="icon-btn cal-prev" type="button" data-cal-move="-1" aria-label="Previous month">${icon('chevron')}</button>
          <h2 class="cal-title"><span class="cal-mname">${MONTH_LONG[m.getMonth()]}</span><span class="cal-year">${m.getFullYear()}</span></h2>
          <button class="icon-btn" type="button" data-cal-move="1" aria-label="Next month">${icon('chevron')}</button></div>
        ${summary}
        <div class="cal-names" aria-hidden="true">${names}</div><div class="cal-grid">${cells}</div>
        ${legend}
      </div>
      <div class="cal-side">${dayPanel}${soonPanel}</div>
    </div>`;
}
/* Opens the Calendar page on a day (today by default), in that day's month. */
function openCalendar(day = today()) {
  ui.cal.sel = day; ui.cal.month = monthStart(day); ui.view = 'calendar';
  render(); const main = $('.main'); if (main) main.scrollTop = 0;
}
function bindCalendar(root) {
  $$('[data-cal-day]', root).forEach((b) => b.onclick = () => { ui.cal.sel = b.dataset.calDay; render(); });
  $$('[data-cal-move]', root).forEach((b) => b.onclick = () => { ui.cal.month = monthStart(addMonths(calMonth(), +b.dataset.calMove)); render(); });
  $$('[data-cal-kind]', root).forEach((b) => b.onclick = () => {
    const k = b.dataset.calKind; const h = ui.cal.hide;
    ui.cal.hide = h.includes(k) ? h.filter((x) => x !== k) : [...h, k]; render();
  });
  const back = $('#calToday', root); if (back) back.onclick = () => openCalendar();
  $$('[data-cal-add]', root).forEach((b) => b.onclick = () => txForm({ type: b.dataset.calAdd, date: calSel() }));
  // "Coming up" rows jump to their day; on the chosen day's own list they open the payment, or the goals page.
  $$('[data-cal-go]', root).forEach((b) => b.onclick = () => openCalendar(b.dataset.calGo));
  $$('[data-cal-rec]', root).forEach((b) => b.onclick = () => recForm(state.recurring.find((r) => r.id === b.dataset.calRec)));
  $$('[data-cal-goal]', root).forEach((b) => b.onclick = () => { ui.view = 'goals'; render(); $('.main').scrollTop = 0; });
  $$('[data-cal-rem]', root).forEach((b) => b.onclick = () => reminderForm(state.reminders.find((x) => x.id === b.dataset.calRem)));
  $$('[data-cal-remind]', root).forEach((b) => b.onclick = () => reminderForm({ date: calSel() }));
}
/* ---------- reminders (Calendar) ---------- */
/* A note on a date ("School fees", "Insurance renewal"), maybe with an amount and a repeat. With an amount it counts
   in the expected balance; the phone reminds on the morning of the day. Marking a repeating one done moves it on. */
const remAmount = (x) => (x.amount ? (x.dir === 'in' ? x.amount : -x.amount) : 0);
const REM_REPEATS = [['', 'Doesn’t repeat'], ['weekly', FREQ.weekly], ['monthly', FREQ.monthly], ['yearly', FREQ.yearly]];
function reminderForm(saved = {}) {
  const r = { dir: 'out', frequency: '', ...saved };
  const isEdit = !!r.id; const t = today();
  let dir = r.dir;
  openModal({
    title: isEdit ? 'Edit reminder' : 'New reminder',
    body: `<div class="stack">
      <label class="field"><span>What to remember</span><input class="input" id="mTitle" value="${esc(r.title || '')}" maxlength="80" placeholder="e.g. School fees, Insurance renewal" autofocus></label>
      <div class="grid2">
        <label class="field"><span>Date</span><input class="input" type="date" id="mDate" value="${r.date || t}"></label>
        <label class="field"><span>Repeats</span><select class="input" id="mRep">${REM_REPEATS.map(([v, l]) => `<option value="${v}" ${(r.frequency || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>Amount (${esc(state.settings.symbol)}) <span class="muted" style="font-weight:400">(optional)</span></span><input class="input calc" id="mAmt" type="text" inputmode="decimal" autocomplete="off" value="${r.amount || ''}" placeholder="0"></label>
      <div class="seg" id="mDir" role="radiogroup" aria-label="Money out or in">${[['out', 'Money out'], ['in', 'Money in']].map(([v, l]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${dir === v}" class="${dir === v ? 'on' : ''}">${l}</button>`).join('')}</div>
      <p class="hint" style="margin:0">With an amount, it counts in the expected balance on the Calendar.</p>
      ${isNativeApp() ? `<label class="set-row" style="padding:0"><span class="set-label"><b>Remind me on my phone</b><span class="hint">At 9:00 that morning, for all your reminders</span></span><input type="checkbox" class="switch" id="mPhone" ${notifySettings().reminders ? 'checked' : ''} aria-label="Remind me on my phone"></label>` : ''}
    </div>`,
    foot: `${isEdit ? '<button class="btn danger left" id="mDel">Delete</button>' : ''}${isEdit && !r.done ? `<button class="btn" id="mDone">Done</button>` : ''}
      <button class="btn" data-close>Cancel</button><button class="btn primary" id="mSave">Save</button>`,
    onMount: (m) => {
      $$('#mDir button', m).forEach((b) => b.onclick = () => {
        dir = b.dataset.v;
        $$('#mDir button', m).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); });
      });
      $('#mSave', m).onclick = async () => {
        const title = $('#mTitle', m).value.trim(); if (!title) return toast('Write what to remember');
        const date = $('#mDate', m).value || t;
        const amount = round2(parseFloat($('#mAmt', m).value) || 0);
        if (amount < 0) return toast('Enter the amount without a minus; choose Money out or Money in');
        const frequency = $('#mRep', m).value;
        const rec = { title, date, amount, dir, frequency, anchorDay: parseISO(date).getDate(), done: isEdit && date === r.date ? !!r.done : false };
        if (isEdit) Object.assign(state.reminders.find((x) => x.id === r.id), rec); else state.reminders.push({ id: uid(), ...rec });
        // The phone box is the same switch as Settings → Notifications → Your reminders.
        const phone = $('#mPhone', m)?.checked;
        save(); closeModal(); render(); toast('Reminder saved');
        if (phone && !notifySettings().reminders) await turnOnNotify('reminders');
        else if (phone === false && notifySettings().reminders) { state.settings.notify = { ...notifySettings(), reminders: false }; save(); }
      };
      const done = $('#mDone', m);
      if (done) done.onclick = () => {
        const x = state.reminders.find((y) => y.id === r.id);
        if (x.frequency) { x.date = nextOccurrence(x, x.date); toast(`Done. Next one: ${fmtDate(x.date, { full: true })}`); }
        else { x.done = true; toast('Reminder done'); }
        save(); closeModal(); render();
      };
      const del = $('#mDel', m);
      if (del) del.onclick = () => {
        const i = state.reminders.findIndex((x) => x.id === r.id); const [gone] = state.reminders.splice(i, 1);
        save(); closeModal(); render();
        toast('Reminder deleted', { label: 'Undo', run: () => { state.reminders.splice(i, 0, gone); save(); render(); } });
      };
    },
  });
}

function viewTools() {
  const sym = esc(state.settings.symbol);
  const isMoney = new Set(['price', 'total', 'amount', 'target', 'saved']);
  const kind = ui.tools.loan?.kind === 'flat' ? 'flat' : 'reducing';
  const loanKind = `<div class="field"><span>Interest type</span><div class="seg tool-kind" role="radiogroup" aria-label="Interest type">${[['reducing', 'Reducing balance'], ['flat', 'Flat rate']].map(([k, l]) => `<button type="button" role="radio" aria-checked="${kind === k}" class="${kind === k ? 'on' : ''}" data-loan-kind="${k}">${l}</button>`).join('')}</div>
    <span class="hint">${kind === 'flat' ? 'Interest on the full amount for the whole time. Many leasing companies quote this way.' : 'Interest only on what you still owe. Banks usually work this way.'}</span></div>`;
  const cards = TOOLS.map(([tool, title, fields]) => `<div class="panel tool"><h2>${title}</h2><div class="tool-fields">${tool === 'loan' ? loanKind : ''}${fields.map(([k, label, ph]) => {
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
  $$('[data-loan-kind]', root).forEach((b) => b.onclick = () => { (ui.tools.loan ||= {}).kind = b.dataset.loanKind; render(); });
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
/* The Aesthetic look's bar: Home · Calendar · (+) · Spending · Goals (styles.css puts them in that order).
   The other pages open from the round menu button on Home. */
const PHONE_BAR_AES = ['dashboard', 'calendar', 'reports', 'goals'];
const phoneBar = () => (aesthetic() ? PHONE_BAR_AES : PHONE_BAR);
const AES_LABELS = { dashboard: 'Home', reports: 'Spending', goals: 'Goals' };
const NAV = [
  ['dashboard', 'This week', 'home'], ['transactions', 'Transactions', 'list'], ['calendar', 'Calendar', 'calendar'], ['budgets', 'Budgets', 'target'],
  ['goals', 'Savings goals', 'flag'], ['recurring', 'Scheduled', 'repeat'], ['reports', 'Reports', 'chart'],
  ['accounts', 'Accounts', 'wallet'], ['tools', 'Calculator', 'calc'], ['settings', 'Settings', 'gear'],
];

/* Home: "Good evening," with the name on its own line under it (its first letter capital). */
function greetingHtml() {
  const h = now().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const n = (state.settings.name || '').trim();
  return n ? `${part},<span class="greet-name">${esc(n[0].toUpperCase() + n.slice(1))}</span>` : part;
}
function greeting() {
  const h = now().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return state.settings.name ? `${part}, ${state.settings.name}` : part;
}

/* The Aesthetic look's week: a dot per day instead of bars. ✓ = within the day's share (or nothing spent without a
   limit), the amount in coral when over it, today ringed, the days to come empty. One plain sentence under it. */
function weekDots(w) {
  const done = w.days.slice(0, w.todayIdx).filter((d) => !d.beforeStart);
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  const dots = w.days.map((d, i) => {
    const isToday = i === w.todayIdx, future = i > w.todayIdx;
    const over = w.B && d.spent > d.share + 0.001;
    const cls = d.beforeStart ? 'off' : isToday ? 'today' : future ? 'future' : over ? 'over' : (w.B || !d.spent) ? 'ok' : 'spent';
    const inside = cls === 'ok' ? check : (isToday || cls === 'over' || cls === 'spent' || (future && d.spent)) && d.spent ? esc(calAmt(d.spent)) : '';
    const label = `${fmtDate(d.date, { full: true })}: ${d.beforeStart ? 'before you started' : future ? (d.spent ? `${money(d.spent)} planned` : 'still to come') : `spent ${money(d.spent)}${over ? ', over the day’s share' : ''}`}`;
    return `<div class="wdot ${cls}" role="img" aria-label="${esc(label)}"><span class="wdot-c">${inside}</span><span class="dn">${isToday ? 'Today' : DAY_SHORT[parseISO(d.date).getDay()]}</span></div>`;
  }).join('');
  let note;
  if (!done.length) note = 'A fresh week. Every day you stay within your share gets a tick.';
  else if (w.B) {
    const ok = done.filter((d) => d.spent <= d.share + 0.001).length;
    note = ok === done.length ? `${ok === 1 ? 'Yesterday' : `All ${ok} days so far`} stayed within your limit. Lovely!` : `${ok} of ${done.length} days so far stayed within your limit.`;
  } else {
    const free = done.filter((d) => !d.spent).length;
    note = `${free} no-spend day${free === 1 ? '' : 's'} so far this week.`;
  }
  return `<div class="wdots-wrap"><div class="wdots">${dots}</div><p class="wdots-note">${note}</p></div>`;
}
/* The Aesthetic Home, as designed: greeting, the dark "you can spend today" card, your week as dots,
   Expense · Income · Move money, any alerts, and the latest entries. */
function viewHomeAes() {
  const w = weekInfo(); const t = today();
  let card;
  if (w.B) {
    const left = Math.max(0, w.leftToday);
    const over = w.remaining <= 0 ? -w.remaining : -w.leftToday;
    const sub = over > 0.005 ? `<b class="hero-over">${esc(money(over, { short: true }))} over ${w.remaining <= 0 ? 'this week' : 'today'}</b>`
      : `${esc(money(Math.max(0, w.remaining - left), { short: true }))} left for the rest of this week`;
    card = `<section class="hero" aria-label="Today"><span class="hero-k">You can spend today</span><div class="hero-v">${moneyHtml(left)}</div>
      <span class="hero-s">${sub}</span>
      <div class="hero-bar"><i style="width:${(clamp(w.spent / w.B, 0, 1) * 100).toFixed(1)}%"></i></div>
      <div class="hero-foot"><span>${esc(money(w.spent, { short: true }))} spent</span><button class="link-btn" id="setBudget" type="button">Limit ${esc(money(w.fullB, { short: true }))} ›</button></div></section>`;
  } else {
    card = `<section class="hero" aria-label="This week"><span class="hero-k">Spent this week</span><div class="hero-v">${moneyHtml(w.spent)}</div>
      <button class="link-btn" id="setBudget" type="button">Set a weekly limit to see what you can spend each day ›</button></section>`;
  }
  const quick = [['expense', 'Expense', 'M7 17 17 7M8 7h9v9'], ['income', 'Income', 'M17 7 7 17M16 17H7V8'], ['transfer', 'Move money', 'M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4']]
    .map(([a, l, d]) => `<button class="qa-tile" type="button" data-fab="${a}"><span class="qa-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg></span>${l}</button>`).join('');
  const alerts = budgetStatus().filter((b) => b.ratio >= .9);
  const alertHtml = alerts.length ? `<div class="alert ${alerts.some((a) => a.ratio > 1) ? 'over' : 'warn'}">${icon('alert')}<div>${alerts.map((a) => `<b>${esc(a.name)}</b> ${a.ratio > 1 ? `is ${money(a.spent - a.amount)} over its ${a.period} budget` : `has ${money(a.amount - a.spent)} left this ${a.period === 'weekly' ? 'week' : 'month'}`}`).join(' · ')}</div></div>` : '';
  const recent = newestFirst(state.transactions).slice(0, 4);
  return `<div class="head home-head"><div class="head-title"><h1>${greetingHtml()}</h1><p>${DAY_LONG[parseISO(t).getDay()]}, ${parseISO(t).getDate()} ${MONTH_LONG[parseISO(t).getMonth()]}</p></div>
      <div class="head-tools"><div class="tools-row"><button class="round-btn" type="button" data-go="settings" aria-label="Settings" title="Settings">${icon('gear')}</button><button class="round-btn" id="homeMenu" type="button" aria-label="All pages" title="All pages">${icon('more')}</button></div>${themeToggle()}</div></div>
    <div class="home-aes">
      ${card}
      <section class="aes-card"><h2 class="aes-h">Your week</h2>${weekDots(w)}</section>
      <div class="qa">${quick}</div>
      ${alertHtml}${backupCard()}
      <section class="aes-card"><h2 class="aes-h">Recently <button class="link-btn" type="button" data-go="transactions">See all</button></h2>
        ${recent.length ? `<div class="tx-list">${recent.map(txRow).join('')}</div>` : empty('list', 'Nothing here yet', 'Tap Expense when you spend something, and it shows here.')}</section>
    </div>`;
}
function viewDashboard() {
  if (aesthetic()) return viewHomeAes();
  const w = weekInfo(); const s = state.settings; const t = today();
  const mFrom = monthStart(t), mTo = monthEnd(t);
  // Month numbers count up to today: a payment dated later this month hasn't happened yet.
  const mInc = sum(incomeIn(mFrom, t), (x) => x.amount), mExp = sum(expensesIn(mFrom, t), (x) => x.amount);
  const lastW = weekInfo(addDays(w.start, -7));
  const lastWSamePoint = sum(lastW.days.slice(0, w.todayIdx + 1), (d) => d.spent);
  const elapsed = w.todayIdx + 1;
  // The pace counts only what was spent up to today; an expense dated later in the week (rent on Saturday) is not "pace".
  const spentSoFar = round2(sum(w.days.slice(0, elapsed), (d) => d.spent));
  const projected = round2((spentSoFar / elapsed) * 7);
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
      <button class="link-btn" id="setBudget">Set a weekly limit to see what you can spend each day →</button></div>`;
  } else {
    // Once the whole week's limit is used up, today's share (Rs 0) says little: show how far over the week is instead.
    // The big number is always "left to spend today" and stops at Rs 0. Overspending shows as a red badge next to it:
    // over today's share, or, once the whole week's limit is used up, over the week (with the day it resets).
    const weekUsedUp = w.remaining <= 0;
    const left = Math.max(0, w.leftToday);
    const overBy = weekUsedUp ? -w.remaining : -w.leftToday;
    const badge = overBy > 0.005 ? `<span class="over-badge">${money(overBy, { short: true })} over ${weekUsedUp ? 'this week' : 'today'}</span>` : '';
    lead = `<div class="runway-lead">
      <div class="label">Left to spend today</div>
      <div class="big-row"><div class="big ${left > 0 ? '' : 'zero'}">${moneyHtml(left)}</div>${badge}</div>
      ${weekUsedUp ? `<div class="reset-note">Your limit resets on ${DAY_LONG[parseISO(addDays(w.end, 1)).getDay()]}</div>` : ''}
      <div class="today-pair">${mini('Spent today', moneyHtml(w.spentToday), 'neg')}${incomeMini}</div>
      <button class="link-btn" id="setBudget">Change weekly limit (${esc(money(w.fullB, { short: true }))})</button></div>`;
  }
  const even = w.B / 7;
  // Every day's share counts too (with room above), so the dashed lines sit inside the bars, not off the top.
  const scaleMax = Math.max(even * 1.5, ...w.days.map((d) => d.spent), ...w.days.map((d) => d.share * 1.15), 1);
  const daysHtml = w.days.map((d, i) => {
    const dt = parseISO(d.date); const future = i > w.todayIdx; const isToday = i === w.todayIdx;
    const allowance = d.share;
    // Dashed line: none when the share is 0; a tiny share sits a little above the bottom, not on the rounded edge.
    // Past days with nothing spent get no line either: there is nothing to compare, and their different shares
    // looked like random dashes. Their share is still written under the day name.
    const h = (d.spent / scaleMax) * 100; const ah = clamp((allowance / scaleMax) * 100, 5, 97);
    const hasShare = w.B && allowance > 0.005; const line = hasShare && !(i < w.todayIdx && d.spent === 0);
    const over = w.B && d.spent > allowance + 0.001;
    // A future day can already have expenses dated on it (rent on Saturday): shown as a lighter "planned" bar.
    // Its share is what is left to spend each day on top of those, so the bar is never marked red.
    const planned = future && d.spent > 0;
    const tipTxt = d.beforeStart ? `${fmtDate(d.date, { full: true })}<br>Before you started` : `${fmtDate(d.date, { full: true })}<br>${future
      ? `${planned ? `Already planned <b>${esc(money(d.spent))}</b><br>` : ''}${w.B ? (hasShare ? `Plan up to <b>${esc(money(allowance))}</b>${planned ? ' more' : ''}` : 'Weekly limit used up') : ''}`
      : `Spent <b>${esc(money(d.spent))}</b>${w.B ? `<br>Daily share ${esc(money(allowance))}` : ''}`}`;
    return `<div class="day ${future ? 'future' : ''} ${isToday ? 'today' : ''}" data-tip="${esc(tipTxt)}">
      <div class="amt">${d.spent > 0 ? moneyHtml(d.spent, { short: true }) : '&nbsp;'}</div>
      <div class="col">${future ? (planned ? `<div class="fill planned" style="height:${h}%"></div>` : '') : `<div class="fill ${over ? 'over' : ''}" style="height:${h}%"></div>`}${line ? `<div class="allow" style="bottom:${ah}%"></div>` : ''}</div>
      <div class="dn">${isToday ? 'Today' : DAY_SHORT[dt.getDay()]}</div>
      ${w.B ? `<div class="share" title="Daily share">${d.beforeStart ? '&nbsp;' : hasShare ? moneyHtml(allowance, { short: true }) : '–'}</div>` : ''}</div>`;
  }).join('');
  const diff = w.spent - lastWSamePoint;
  // Spending this week in categories left out of the limit (Bills & utilities, rent): said here, so the bars and
  // "Where this week's money went" (which shows everything) don't look like they disagree.
  const notCounted = round2(sum(expensesIn(w.start, t).filter((x) => !w.counted(x)), (x) => x.amount));
  const chip = (html, cls = '') => `<span class="chip ${cls}">${html}</span>`;
  const notes = `<div class="runway-note">
    ${w.B && w.remaining > 0 ? chip(w.remaining >= 0 ? `<b>${money(w.remaining, { short: true })}</b> left this week` : `<b>${money(-w.remaining, { short: true })}</b> over this week`, w.remaining >= 0 ? '' : 'neg') : ''}
    ${w.B && w.firstIdx ? chip(`First week: <b>${money(w.B, { short: true })}</b> limit, from ${DAY_LONG[parseISO(addDays(w.start, w.firstIdx)).getDay()]}`) : ''}
    ${w.B && notCounted ? chip(`<b>${money(notCounted, { short: true })}</b> fixed costs, not in limit`) : ''}
    ${w.planned ? chip(`<b>${money(w.planned, { short: true })}</b> planned later this week`, w.B && w.planned > w.remaining ? 'neg' : '') : ''}
    ${spentSoFar ? chip(`On pace for <b>${money(projected, { short: true })}</b>`, w.B && projected > w.B ? 'neg' : '') : ''}
    ${round2(diff) ? chip(`<b>${money(diff, { sign: true, short: true })}</b> vs last week`, diff > 0 ? 'neg' : 'pos') : ''}
    ${chip(`<b>${noSpend}</b> no-spend day${noSpend === 1 ? '' : 's'}`)}
  </div>`;

  // budget alerts
  const alerts = budgetStatus().filter((b) => b.ratio >= .9);
  const alertHtml = alerts.length ? `<div class="alert ${alerts.some((a) => a.ratio > 1) ? 'over' : 'warn'}">${icon('alert')}<div>${alerts.map((a) => `<b>${esc(a.name)}</b> ${a.ratio > 1 ? `is ${money(a.spent - a.amount)} over its ${a.period} budget` : `has ${money(a.amount - a.spent)} left this ${a.period === 'weekly' ? 'week' : 'month'}`}`).join(' · ')}</div></div>` : '';

  const weekEx = expensesIn(w.start, t);
  const recent = newestFirst(state.transactions).slice(0, 7);
  const upcoming = state.recurring.filter((r) => r.active && r.nextDate <= addDays(t, 14)).sort((a, b) => a.nextDate.localeCompare(b.nextDate)).slice(0, 5);
  const saved = mInc - mExp;

  return `<div class="head home-head"><div class="head-title"><h1>${greetingHtml()}</h1><p>${DAY_LONG[parseISO(t).getDay()]}, ${parseISO(t).getDate()} ${MONTH_LONG[parseISO(t).getMonth()]}</p></div>
    <div class="head-tools"><div class="tools-row">${cloudButton()}<button class="btn set-btn" type="button" data-go="settings" aria-label="Settings" title="Settings">${icon('gear')}</button></div>${themeToggle()}</div>
    <div class="actions"><button class="btn" data-add="income">${icon('plus')}Income</button><button class="btn primary" data-add="expense">${icon('plus')}Expense</button><button class="btn calc-open" data-calc-pad aria-label="Calculator" title="Calculator">${icon('calc')}</button><button class="btn calc-open" id="openCal" aria-label="Calendar" title="Calendar">${icon('calendar')}</button></div></div>
    <section class="runway" aria-label="Today and this week">${lead}<div class="days">${daysHtml}</div>${notes}</section>
    ${alertHtml}
    ${backupCard()}
    <div class="stats">
      <div class="stat"><div class="k">Total balance</div><div class="v ${totalBalance() < 0 ? 'neg' : ''}">${moneyHtml(totalBalance())}</div><div class="d">${state.accounts.length} account${state.accounts.length === 1 ? '' : 's'}</div></div>
      <div class="stat"><div class="k">Income in ${MONTH_SHORT[now().getMonth()]}</div><div class="v pos">${moneyHtml(mInc)}</div><div class="d">${plural(incomeIn(mFrom, t).length, 'payment')}</div></div>
      <div class="stat"><div class="k">Spent in ${MONTH_SHORT[now().getMonth()]}</div><div class="v neg">${moneyHtml(mExp)}</div><div class="d">${money(mExp / Math.max(1, parseISO(t).getDate()), { short: true })} a day on average</div></div>
      <div class="stat"><div class="k">Kept this month</div><div class="v ${saved < 0 ? 'neg' : ''}">${moneyHtml(saved)}</div><div class="d">${mInc ? `<span class="${saved > 0 ? 'pos' : saved < 0 ? 'neg' : ''}">${Math.round(saved / mInc * 100)}% of income</span>` : 'Add income to see your savings rate'}</div></div>
    </div>
    ${accountStrip()}
    <div class="cols">
      <div class="panel"><h2>Where this week’s money went <small>${money(sum(weekEx, (x) => x.amount))}</small></h2>
        ${weekEx.length ? hbars(categoryRows(weekEx), sum(weekEx, (x) => x.amount), (r) => w.B && cat(r.id)?.weekly === false ? 'Not in weekly limit' : '') : empty('chart', 'Nothing spent yet this week', 'Log each expense as it happens. Press N to add one quickly.')}</div>
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

/* Home page: what is in each account, under "Total balance". Only with 2 or more accounts (with one, it is the total).
   Desktop: tiles wrap into rows. Phone: one row that scrolls sideways, so many accounts never squeeze or overlap. */
function accountStrip() {
  if (state.accounts.length < 2) return '';
  const tiles = state.accounts.map((a) => { const b = accountBalance(a);
    return `<button class="acc-tile" data-go="accounts" title="${esc(a.name)}: ${esc(money(b))}">
      <span class="acc-name"><i class="dot" style="background:${a.color}"></i><span>${esc(a.name)}</span></span>
      <span class="acc-bal ${b < 0 ? 'neg' : ''}">${moneyHtml(b)}</span></button>`; }).join('');
  return `<section class="acc-strip" aria-label="Accounts"><h2>Accounts <button class="btn small ghost" data-go="accounts">Manage</button></h2>
    <div class="acc-list">${tiles}</div></section>`;
}

function backupCard() {
  // Signed in: sync already keeps a copy of everything in the account, so no "back up your data" reminder.
  // `remembered` covers the moment after opening, before Firebase has restored the sign-in (the card used to flash).
  const ci = cloud()?.info();
  if (ci?.signedIn || ci?.remembered) return '';
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
  const counted = list.filter((t) => t.date <= today()); // totals: up to today (upcoming ones haven't happened yet)
  // Phones: the four filters fold away behind one "Filters" button; the count shows how many are changed.
  const nFilters = [f.period !== 'month', f.type !== 'all', f.cat !== 'all', f.acc !== 'all'].filter(Boolean).length;
  const inc = sum(counted.filter((t) => t.type === 'income'), (t) => t.amount), ex = sum(counted.filter((t) => t.type === 'expense'), (t) => t.amount);
  const periods = [['week', 'This week'], ['month', 'This month'], ['lastmonth', 'Last month'], ['30', 'Last 30 days'], ['3m', 'Last 3 months'], ['year', 'This year'], ['all', 'All time'], ['custom', 'Custom dates']];
  return `<div class="head"><div><h1>Transactions</h1><p>Search, filter and edit everything you’ve logged.</p></div>
    <div class="actions"><button class="btn" id="exportCsv">${icon('download')}Export CSV</button><button class="btn" data-add="income">${icon('plus')}Income</button><button class="btn primary" data-add="expense">${icon('plus')}Expense</button></div></div>
    <div class="panel">
      <div class="filters">
        <input class="input search" id="fq" placeholder="Search notes, categories or amounts" value="${esc(f.q)}">
        <button class="btn filter-toggle ${ui.txFiltersOpen ? 'on' : ''}" id="fToggle" aria-expanded="${!!ui.txFiltersOpen}" aria-controls="fMore">${icon('sliders')}Filters${nFilters ? ` <span class="filter-count">${nFilters}</span>` : ''}</button>
        <div class="filter-more ${ui.txFiltersOpen ? 'open' : ''}" id="fMore">
        <select class="input" id="fperiod">${periods.map(([v, l]) => `<option value="${v}" ${f.period === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${f.period === 'custom' ? `<input class="input" type="date" id="ffrom" value="${f.from}"><input class="input" type="date" id="fto" value="${f.to}">` : ''}
        <select class="input" id="ftype">${[['all', 'All types'], ['expense', 'Expenses'], ['income', 'Income'], ['transfer', 'Transfers']].map(([v, l]) => `<option value="${v}" ${f.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select class="input" id="fcat"><option value="all">All categories</option>${state.categories.map((c) => `<option value="${c.id}" ${f.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <select class="input" id="facc"><option value="all">All accounts</option>${accOptions(f.acc)}</select>
        ${nFilters ? '<button class="link-btn filter-reset" id="fReset" type="button">Reset filters</button>' : ''}
        </div>
      </div>
      <div class="summary-bar"><span>Income<b class="pos">${moneyHtml(inc)}</b></span><span>Expenses<b>${moneyHtml(ex)}</b></span><span>Net<b class="${inc - ex < 0 ? 'neg' : ''}">${moneyHtml(inc - ex, { sign: true })}</b></span></div>
      ${list.length ? `<p class="tx-count">${plural(list.length, 'transaction')}</p>` : ''}
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
  $('#fToggle', root).onclick = () => { ui.txFiltersOpen = !ui.txFiltersOpen; render(); };
  $('#fReset', root) && ($('#fReset', root).onclick = () => { Object.assign(f, { period: 'month', type: 'all', cat: 'all', acc: 'all', from: '', to: '' }); rerender(); });
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
    const spent = round2(sum(expensesIn(from, t).filter((x) => x.categoryId === b.categoryId), (x) => x.amount)); // up to today
    const daysLeft = daysBetween(t, to) + 1;
    return { ...b, name: catName(b.categoryId), color: cat(b.categoryId)?.color, spent, ratio: b.amount ? spent / b.amount : 0, daysLeft };
  });
}
function meter(b, withActions) {
  const cls = b.ratio > 1 ? 'over' : b.ratio >= .8 ? 'warn' : '';
  const status = b.ratio > 1 ? `<span class="status over">${icon('alert').replace('<svg', '<svg width="14" height="14"')}Over by ${money(b.spent - b.amount)}</span>`
    : b.ratio >= .8 ? `<span class="status warn">Almost used</span>` : `<span class="status ok">On track</span>`;
  const left = b.amount - b.spent;
  // On the Budgets page the whole row opens the edit window (Delete is in there too); the icons stay for mouse users.
  const tap = withActions ? ` meter-tap" data-edit-row-budget="${b.id}" role="button" tabindex="0" aria-label="Edit ${esc(b.name)} budget` : '';
  return `<div class="meter${tap}"><div class="meter-top"><span class="name"><i class="dot" style="background:${b.color || '#5f6b66'}"></i><span class="nm">${esc(b.name)}</span><span class="tag">${b.period === 'weekly' ? 'Weekly' : 'Monthly'}</span></span>
    <span class="vals">${money(b.spent, { short: true })} / ${money(b.amount, { short: true })}</span>${withActions ? `<span class="meter-actions"><button class="icon-btn" data-edit-budget="${b.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-del-budget="${b.id}" aria-label="Delete">${icon('trash')}</button></span>` : ''}</div>
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
          <div class="meter-foot">${w.remaining >= 0 ? `<span>${money(w.remaining)} left</span>` : `<span class="neg">${money(-w.remaining)} over</span>`}<span>${w.daysLeft} day${w.daysLeft > 1 ? 's' : ''} to go</span></div></div>` : '<p class="hint" style="margin-bottom:12px">You haven’t set a weekly limit yet.</p>'}
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
    foot: `${b.id ? `<button class="btn danger left" id="bDel">${icon('trash')}Delete</button>` : ''}<button class="btn" data-close>Cancel</button><button class="btn primary" id="bs">Save budget</button>`,
    onMount: (m) => { $('#bDel', m) && ($('#bDel', m).onclick = () => { closeModal(); deleteBudget(b.id); }); $('#bs', m).onclick = () => {
      const amount = round2(parseFloat($('#ba', m).value));
      if (!(amount > 0)) return toast('Enter a limit greater than zero');
      const rec = { id: b.id || uid(), categoryId: $('#bc', m).value, amount, period: $('#bp', m).value };
      if (!b.id && state.budgets.some((x) => x.categoryId === rec.categoryId && x.period === rec.period)) return toast('That category already has a ' + rec.period + ' budget');
      if (b.id) Object.assign(state.budgets.find((x) => x.id === b.id), rec); else state.budgets.push(rec);
      save(); closeModal(); render(); toast('Budget saved');
    }; },
  });
}
function deleteBudget(id) {
  const i = state.budgets.findIndex((x) => x.id === id); if (i < 0) return;
  const [gone] = state.budgets.splice(i, 1); save(); render();
  toast('Budget removed', { label: 'Undo', run: () => { state.budgets.splice(i, 0, gone); save(); render(); } });
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
    if (aesthetic()) {
      const tip = left <= 0 ? 'Goal reached. Well done!'
        : g.deadline && daysBetween(t, g.deadline) > 0 ? `Put aside <b>${esc(money(left / Math.max(1, daysBetween(t, g.deadline) / 7), { short: true }))} a week</b> and you’ll get there on time.`
        : g.deadline ? `The date has passed. <b>${esc(money(left, { short: true }))}</b> to go.`
        : pct >= 0.7 ? `Almost there! Only <b>${esc(money(left, { short: true }))}</b> to go.` : `<b>${esc(money(left, { short: true }))}</b> to go.`;
      return `<section class="goal-card${left <= 0 ? ' done' : ''}"><div class="goal-top"><span class="goal-ic">${icon('flag')}</span>
        <span class="goal-name"><b>${esc(g.name)}</b><small>${g.deadline ? `by ${fmtDate(g.deadline, { full: true, noDay: true })}` : 'No date set'}</small></span><b class="goal-pct">${Math.round(clamp(pct, 0, 1) * 100)}%</b></div>
        <div class="goal-bar"><i style="width:${(clamp(pct, 0, 1) * 100).toFixed(1)}%"></i></div>
        <div class="goal-amts"><span><b>${esc(money(g.saved, { short: true }))}</b> saved</span><span>of ${esc(money(g.target, { short: true }))}</span></div>
        <p class="goal-tip">${tip}</p>
        <div class="goal-btns"><button class="btn primary" type="button" data-goal-add="${g.id}">Add money</button><button class="btn" type="button" data-goal-take="${g.id}">Take out</button>
          <button class="icon-btn" type="button" data-goal-edit="${g.id}" aria-label="Edit goal">${icon('edit')}</button><button class="icon-btn" type="button" data-goal-del="${g.id}" aria-label="Delete goal">${icon('trash')}</button></div></section>`;
    }
    return `<div class="card"><div class="top"><div><h3>${esc(g.name)}</h3><div class="meta">Target ${money(g.target)}</div></div>${ring(pct)}</div>
      <div class="big">${moneyHtml(g.saved)}</div><div class="meta">${plan}</div>
      <div class="foot"><button class="btn small primary" data-goal-add="${g.id}">${icon('plus')}Add money</button><button class="btn small" data-goal-take="${g.id}">${icon('minus')}Take out</button>
      <button class="icon-btn" data-goal-edit="${g.id}" aria-label="Edit goal" style="margin-left:auto">${icon('edit')}</button><button class="icon-btn" data-goal-del="${g.id}" aria-label="Delete goal">${icon('trash')}</button></div></div>`;
  }).join('');
  const total = sum(state.goals, (g) => g.saved);
  if (aesthetic()) {
    return `<div class="head"><div><h1>Savings goals</h1><p>${state.goals.length ? 'Little by little, it all adds up.' : 'Give your savings a purpose: a phone, a trip, an emergency fund.'}</p></div></div>
      <div class="goals-aes">${cards}<button class="goal-new" type="button" id="addGoal">${icon('plus')}Start a new goal</button></div>`;
  }
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
/* The Aesthetic look's spending by category: a colourful ring with the total in the middle, and a legend under it.
   The 5 biggest categories, the rest as "Everything else". Round ends with a small gap between the parts. */
const DONUT_COLORS = ['#5b7cfa', '#f2788f', '#f5b83d', '#3fbf95', '#a780f0', '#a3a1ac'];
function donutChart(rows, total) {
  // Its own colours by size, not the categories' (two categories can share a colour): always 6 different ones.
  const rest = rows.slice(5);
  const parts = (rest.length ? [...rows.slice(0, 5), { name: 'Everything else', v: round2(sum(rest, (r) => r.v)) }] : rows.slice(0, 5))
    .map((p, i) => ({ ...p, color: p.name === 'Everything else' ? DONUT_COLORS[5] : DONUT_COLORS[i] }));
  const R = 70, W = 20, C = 2 * Math.PI * R, pct = (v) => Math.round(v / total * 100);
  // Every piece gets round ends and the same gap. The round ends stick out W/2 on each side, so a piece needs at least
  // W + 6 (gap) + 6 (a little colour) of the circle: small ones get that much, taken evenly from the bigger ones.
  // The legend keeps the real amounts and percentages.
  const gap = parts.length > 1 ? W + 6 : 0, least = gap + 6;
  const shares = parts.map((p) => (p.v / total) * C);
  if (parts.length > 1) {
    const short = shares.reduce((n, s) => n + Math.max(0, least - s), 0);
    const spare = shares.reduce((n, s) => n + Math.max(0, s - least), 0);
    for (let i = 0; i < shares.length; i++) {
      shares[i] = shares[i] < least ? least : shares[i] - (spare ? (shares[i] - least) / spare * short : 0);
    }
  }
  let at = 0;
  const arcs = parts.map((p, i) => {
    const len = Math.max(0.01, shares[i] - gap);
    const arc = `<circle cx="90" cy="90" r="${R}" fill="none" stroke="${p.color}" stroke-width="${W}" stroke-linecap="round" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-(at + gap / 2)).toFixed(2)}"/>`;
    at += shares[i];
    return arc;
  }).join('');
  const label = parts.map((p) => `${p.name} ${pct(p.v)}%`).join(', ');
  return `<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 180 180" role="img" aria-label="${esc('Spending by category: ' + label)}"><g transform="rotate(-90 90 90)">${arcs}</g></svg>
    <div class="donut-mid"><span>Spent</span><b>${esc(money(total, { short: true }))}</b></div></div>
    <div class="donut-legend">${parts.map((p) => `<div class="dl"><i style="background:${p.color}"></i><span>${esc(p.name)}<b>${esc(money(p.v, { short: true }))}</b></span><small>${pct(p.v)}%</small></div>`).join('')}</div></div>`;
}
/* The words in the Aesthetic "You spent" card: where most of the money went. ("You kept" has its own card.) */
function reportSentence(rows, tEx, tIn) {
  if (!tEx && !tIn) return 'Nothing yet in this period. Add some income or expenses and a summary shows here.';
  const top = rows[0];
  return top ? `Most of it went on <b>${esc(top.name)}</b> (${Math.round(top.v / tEx * 100)}%).` : 'Nothing spent yet.';
}
function viewReports() {
  const p = ui.reportPeriod; const t = today();
  let [from, to] = periodRange(p);
  if (p === 'all') { const ds = state.transactions.map((x) => x.date).sort(); from = ds[0] || t; to = t; }
  const effTo = to > t ? t : to;
  const ex = expensesIn(from, effTo), inc = incomeIn(from, effTo); // up to today: later-dated payments haven't happened
  const tEx = sum(ex, (x) => x.amount), tIn = sum(inc, (x) => x.amount);
  const days = Math.max(1, daysBetween(from, effTo) + 1);
  const rows = categoryRows(ex);

  // months chart
  const nMonths = p === 'year' || p === 'all' ? 12 : 6;
  const months = Array.from({ length: nMonths }, (_, i) => addMonths(monthStart(t), i - nMonths + 1));
  const monthGroups = months.map((m) => {
    const d = parseISO(m);
    return { label: MONTH_SHORT[d.getMonth()], tipTitle: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`, values: [
      { v: round2(sum(incomeIn(m, monthEnd(m) > t ? t : monthEnd(m)), (x) => x.amount)), cls: 'm-in', name: 'Income' },
      { v: round2(sum(expensesIn(m, monthEnd(m) > t ? t : monthEnd(m)), (x) => x.amount)), cls: 'm-out', name: 'Expenses' }] };
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

  if (aesthetic()) {
    // As designed: period pills, a dark "You spent" card with the plain-words summary, the ring, "You kept", biggest expenses.
    const kept = round2(tIn - tEx);
    return `<div class="head"><div><h1>Your spending</h1><p>${fmtDate(from, { full: true, noDay: true })} – ${fmtDate(to, { full: true, noDay: true })}</p></div></div>
      <div class="pills" id="rp" role="radiogroup" aria-label="Period">${periods.map(([v, l]) => `<button type="button" role="radio" aria-checked="${p === v}" data-v="${v}" class="${p === v ? 'on' : ''}">${l}</button>`).join('')}</div>
      <section class="hero" aria-label="Spent"><span class="hero-k">You spent</span><div class="hero-v">${moneyHtml(tEx)}</div><p class="hero-p">${reportSentence(rows, tEx, tIn)}</p></section>
      <section class="aes-card"><h2 class="aes-h">Where it went</h2>${rows.length ? donutChart(rows, tEx) : empty('chart', 'No spending in this period', 'Pick a longer period or add expenses.')}</section>
      ${tIn ? `<section class="kept ${kept < 0 ? 'neg' : ''}"><span class="kept-ic">${icon('wallet')}</span><span><b>${kept >= 0 ? `You kept ${esc(money(kept))}` : `You spent ${esc(money(-kept))} more than came in`}</b><small>${kept >= 0 ? `That’s ${Math.round(kept / tIn * 100)}% of what came in.${kept / tIn >= 0.2 ? ' Well done!' : ''}` : 'Next time, try to keep a little back.'}</small></span></section>` : ''}
      <section class="aes-card"><h2 class="aes-h">Biggest expenses</h2>${top.length ? `<div class="tx-list">${top.map(txRow).join('')}</div>` : empty('list', 'No expenses', 'Nothing was spent in this period.')}</section>`;
  }
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
      <label class="check-row"><input type="checkbox" id="acr" ${a.credit ? 'checked' : ''}><span><b>Can go below zero</b><span class="hint">For a credit card or loan. Other accounts warn you before spending more than they hold.</span></span></label>
      <div class="field"><span>Colour</span>${swatches(a.color || PALETTE[state.accounts.length % PALETTE.length])}</div></div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="as">Save account</button>',
    onMount: (m) => { const color = bindSwatches(m); $('#as', m).onclick = () => {
      const name = $('#an', m).value.trim(); if (!name) return toast('Give the account a name');
      const typed = round2(parseFloat($('#ai', m).value) || 0);
      /* The box shows the current balance, so work back to the starting balance that gives it, keeping past transactions. */
      const initial = a.id ? round2(typed - (accountBalance(a) - (+a.initial || 0))) : typed;
      const rec = { name, initial, color: color(), credit: $('#acr', m).checked };
      if (!a.id) { state.accounts.push({ id: uid(), ...rec }); save(); closeModal(); render(); return toast('Account saved'); }
      const acc = state.accounts.find((x) => x.id === a.id);
      const before = { name: acc.name, initial: acc.initial, color: acc.color, credit: !!acc.credit };
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
  const row = (label, control, hint = '') => `<div class="set-row"><div class="set-label"><b>${label}</b>${hint ? `<span class="hint">${hint}</span>` : ''}</div>${control}</div>`;
  const seg = (attr, value, opts) => `<div class="seg set-seg" role="radiogroup">${opts.map(([v, l]) => `<button type="button" role="radio" aria-checked="${String(v) === String(value)}" class="${String(v) === String(value) ? 'on' : ''}" ${attr}="${v}">${l}</button>`).join('')}</div>`;
  const action = (id, ic, label, cls = '') => `<button class="set-action ${cls}" id="${id}" type="button">${icon(ic)}<span>${label}</span>${cls ? '' : icon('chevron')}</button>`;
  return `<div class="head"><div><h1>Settings</h1><p>Make it yours.${signedIn ? ' Your data is synced to your account.' : ' Your money data is stored only on this device.'}</p></div></div>
    <div class="settings">
      <section class="set-group"><h2 class="set-title">Profile</h2><div class="set-card">
        ${row('Your name', `<input class="input" id="sName" value="${esc(s.name)}" maxlength="30" placeholder="Your name" aria-label="Your name">`)}
      </div></section>
      <section class="set-group"><h2 class="set-title">Money</h2><div class="set-card">
        ${row('Currency', `<select class="input" id="sCur" aria-label="Currency">${CURRENCIES.map(([c, sym]) => `<option value="${c}" ${s.currency === c ? 'selected' : ''}>${c} (${sym})</option>`).join('')}</select>`)}
        ${row('Symbol shown', `<input class="input set-short" id="sSym" value="${esc(s.symbol)}" maxlength="5" aria-label="Symbol shown">`)}
        ${row('Show cents', `<input type="checkbox" class="switch" id="sDec" ${s.decimals ? 'checked' : ''} aria-label="Show cents / decimals">`, 'Rs 1,250.50 instead of Rs 1,251')}
        ${row('Week starts on', seg('data-week', s.weekStart, [[1, 'Mon'], [0, 'Sun'], [6, 'Sat']]))}
      </div></section>
      <section class="set-group"><h2 class="set-title">Appearance</h2><div class="set-card">
        ${FEATURES.aesthetic ? `<div class="set-row set-col"><div class="set-label"><b>Style</b></div><div class="look-rows" role="radiogroup" aria-label="Style">${STYLES.map(([v, l, d, rec]) => `<button type="button" role="radio" class="look-row look-${v} ${(s.style || 'professional') === v ? 'on' : ''}" aria-checked="${(s.style || 'professional') === v}" data-look="${v}"><span class="look-aa">Aa</span><span class="look-txt"><b>${l}${rec ? ' <span class="rec-badge">Recommended</span>' : ''}</b><small>${d}</small></span><i class="look-radio"></i></button>`).join('')}</div></div>` : ''}
        ${row('Mode', seg('data-mode', s.theme, [['system', isNativeApp() ? 'Phone' : 'Auto'], ['light', 'Light'], ['dark', 'Dark']]), s.theme === 'system' ? systemLabel() : '')}
        <div class="set-row set-col"><div class="set-label"><b>Colour theme</b></div>
          <div class="palettes" role="radiogroup" aria-label="Colour theme">${PALETTES.map(([v, l]) => `<button type="button" role="radio" aria-checked="${(s.palette || 'forest') === v}" class="pal pal-${v}" data-pal="${v}"><i aria-hidden="true"></i><span>${l}</span></button>`).join('')}</div></div>
      </div></section>
      ${notifyPanel()}
      <section class="set-group"><h2 class="set-title">Your data</h2><div class="set-card">
        <div class="set-row set-col"><p class="hint" id="lastBackup" style="margin:0;color:var(--ink-2)">${lastBackupText()}</p>
          <p class="hint" style="margin:0">Back up regularly so you never lose your history. Restore a backup on another device, or merge it to combine what both devices have.</p></div>
        ${action('backup', 'download', 'Save backup')}
        ${action('restore', 'upload', 'Restore backup')}
        ${action('csvAll', 'download', 'Export all as CSV')}
        ${action('reset', 'trash', 'Erase all data', 'danger')}
      </div><p class="hint set-foot" id="dataLoc"></p><p class="hint set-foot shortcuts-hint">Shortcuts: N new expense · I new income · Esc close</p></section>
      ${cloudPanel()}
      <section class="set-group"><h2 class="set-title">Feedback</h2><div class="set-card">
        ${action('fbIdea', 'mail', 'Send an idea or feedback')}
        ${action('fbProblem', 'alert', 'Report a problem')}
        ${isNativeApp() ? action('rateApp', 'star', 'Rate on Google Play') : ''}
      </div></section>
      <section class="set-group"><h2 class="set-title">Expense categories <button class="btn small" data-cat-add="expense">${icon('plus')}Add</button></h2><div class="set-card set-list">${catList('expense')}</div></section>
      <section class="set-group"><h2 class="set-title">Income categories <button class="btn small" data-cat-add="income">${icon('plus')}Add</button></h2><div class="set-card set-list">${catList('income')}</div></section>
    </div>
    <section class="about" aria-label="About">
      ${logo(44)}
      <div class="about-text"><strong>Pocket Ledger</strong><span>Version ${APP_VERSION} · 100% free, no ads</span></div>
      <div class="about-credit">Designed and developed by <b>${AUTHOR}</b><span>© ${now().getFullYear()} ${AUTHOR}. All rights reserved.</span></div>
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
    : `<button class="btn cloud-btn" id="cloudHead" aria-label="Not signed in. Sign in or create an account">${icon('cloudOff')}<span>Sign in</span></button>`;
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
  return `<section class="set-group"><h2 class="set-title">Sync &amp; account</h2><div class="set-card set-pad"><div class="stack">${body}</div></div></section>`;
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
/* After signing in or creating an account: the same window turns into a clear "you're in" screen, with the sync
   status updating live underneath (onCloudChange swaps the .sync-line), instead of a small message at the bottom. */
function accountDone(created) {
  const i = cloud()?.info() || {};
  openModal({
    title: created ? 'Account created' : 'Signed in',
    body: `<div class="done-panel">
      <span class="done-icon">${icon('check')}</span>
      <h3>${created ? 'Your account is ready' : 'You’re signed in'}</h3>
      <p class="done-email">${esc(i.email || '')}</p>
      ${created ? `<p class="hint">We sent a link to this address. Open it to confirm your email (check spam too).</p>` : ''}
      <div class="done-sync">${icon('cloudOk')}${syncLine(i.sync)}</div>
    </div>`,
    foot: `<button class="btn primary" data-close id="doneOk">Done</button>`,
  });
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
        if (ok) { render(); accountDone(up); } else focusFirstError(m);
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
const PALETTES = [['forest', 'Forest'], ['onyx', 'Onyx'], ['navy', 'Navy'], ['mocha', 'Mocha'], ['pearl', 'Pearl']];
/* The two looks. Aesthetic changes fonts, shapes and a few screens (styles.css: [data-style="aesthetic"]), not the data. */
// [value, name, what it is like, recommended]
const STYLES = [
  ['professional', 'Professional', 'A simple, professional look. Clear and easy to read every day.', true],
  ['aesthetic', 'Aesthetic', 'A soft, pretty look, like a planner. Handwritten titles and pastel colours.', false],
];
/* Aesthetic is on hold (2026-11-12): kept in the code, but nobody can pick it and a saved 'aesthetic' shows
   Professional. Set to true to bring it back (the welcome popup and the Style row in Settings come back too). */
const FEATURES = { aesthetic: false };
const aesthetic = () => FEATURES.aesthetic && state?.settings.style === 'aesthetic';
/* Choosing a look also picks its colours, unless the person chose another colour theme themselves. */
function setStyle(style) {
  const s = state.settings; s.style = style;
  if (style === 'aesthetic' && (!s.palette || s.palette === 'forest')) s.palette = 'pearl';
  if (style === 'professional' && s.palette === 'pearl') s.palette = 'forest';
  applyTheme();
}
function applyTheme() {
  if (aesthetic()) document.documentElement.setAttribute('data-style', 'aesthetic'); else document.documentElement.removeAttribute('data-style');
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
    <div class="free-badge">${icon('check')}<b>100% free</b><span>No ads · No subscriptions · No account needed</span></div>
    ${cloud() ? `<div class="have-account">${icon('cloud')}<span>Keep your data safe online and use it on all your devices (optional):<span class="have-account-links"><button class="btn small primary" id="wSignUp" type="button">Create a free account</button><span class="muted">Have an account? <button class="link-btn" id="wSignIn" type="button">Sign in</button></span></span></span></div>` : ''}
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
      afterWelcome();
      return;
    }
    const s = state.settings; const cur = $('#wCur').value;
    s.name = $('#wName').value.trim(); s.currency = cur; s.symbol = CURRENCIES.find((c) => c[0] === cur)[1];
    s.weekStart = +$('#wWeek').value; s.weeklyBudget = round2(parseFloat($('#wLimit').value) || 0); s.onboarded = true;
    s.startedOn = s.startedOn || today(); // the first week's limit counts only the days from here
    state.accounts[0].initial = round2(parseFloat($('#wCash').value) || 0);
    if (state.accounts[1]) state.accounts[1].initial = round2(parseFloat($('#wBank').value) || 0);
    save(); render();
    afterWelcome();
  };
  const signIn = $('#wSignIn'); if (signIn) signIn.onclick = () => accountForm('signin');
  const signUp = $('#wSignUp'); if (signUp) signUp.onclick = () => accountForm('signup');
  $('#wName').focus();
}
/* After the welcome form: the style popup (while Aesthetic is on). Notifications start off and ask for
   permission only when the person turns one on (Settings → Notifications, or a reminder's phone box). */
function afterWelcome() { if (FEATURES.aesthetic) styleChooser(); }
/* Right after the welcome form: pick a look. Tapping a card applies it and closes; closing keeps Professional.
   `then` runs once it's closed (the phone's notification question), so the two never show at the same time. */
function styleChooser(then = () => {}) {
  const s = state.settings;
  openModal({
    title: 'Pick your style',
    body: `<p class="hint" style="margin:0 0 12px">How should Pocket Ledger look? You can change this any time in Settings.</p>
      <div class="style-pick" role="radiogroup" aria-label="Style">${STYLES.map(([v, l, d, rec]) => `<button type="button" role="radio" class="style-card style-${v} ${(s.style || 'professional') === v ? 'on' : ''}" aria-checked="${(s.style || 'professional') === v}" data-style-pick="${v}">
        <span class="style-prev" aria-hidden="true"><span class="sp-hi">${v === 'aesthetic' ? 'Hello' : 'LEFT TODAY'}</span><span class="sp-num">${esc(s.symbol)} 752</span><span class="sp-row"><i></i><i></i><i></i><i></i></span></span>
        <b>${l}${rec ? ' <span class="rec-badge">Recommended</span>' : ''}</b><small>${d}</small></button>`).join('')}</div>`,
    onClose: then,
    onMount: (m) => $$('[data-style-pick]', m).forEach((b) => b.onclick = () => {
      setStyle(b.dataset.stylePick); save(); closeModal(); render();
      toast(`${STYLES.find(([v]) => v === b.dataset.stylePick)[1]} style on. Change it any time in Settings.`);
    }),
  });
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
  const views = { dashboard: viewDashboard, transactions: viewTransactions, calendar: viewCalendar, budgets: viewBudgets, goals: viewGoals, recurring: viewRecurring, reports: viewReports, accounts: viewAccounts, tools: viewTools, settings: viewSettings };
  const scroll = $('.main')?.scrollTop || 0;
  chartSpecs.length = 0;
  const w = weekInfo();
  root.innerHTML = `<div class="app"><aside class="side"><div class="brand">${logo()}<span class="brand-name">Pocket Ledger</span></div>
    <nav class="nav">${NAV.map(([k, l, ic]) => `<button data-nav="${k}" class="${ui.view === k ? 'on' : ''} ${phoneBar().includes(k) ? '' : 'phone-hide'}" ${ui.view === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${(aesthetic() && AES_LABELS[k]) || l}</span></button>${aesthetic() && k === 'calendar' ? `<button class="nav-add" id="navAdd" type="button" aria-label="Add" aria-expanded="false">${icon('plus')}</button>` : ''}`).join('')}
      <button class="more-btn ${phoneBar().includes(ui.view) ? '' : 'on'}" id="moreBtn">${icon('more')}<span>More</span></button></nav>
    <div class="side-foot">${w.B ? `Left this week<strong>${moneyHtml(w.remaining)}</strong>` : `Balance<strong>${moneyHtml(totalBalance())}</strong>`}
      <div class="credit">Designed &amp; developed by ${AUTHOR.replace(' ', '&nbsp;')}</div></div></aside>
    <main class="main"><div class="page">${views[ui.view]()}</div></main>
    ${fabMenu()}</div>`;
  drawCharts();
  $('.main').scrollTop = scroll;
  bindCommon(root);
  if (ui.view === 'transactions') bindTransactions(root);
  if (ui.view === 'settings') bindSettings(root);
  if (ui.view === 'calendar') bindCalendar(root);
  if (ui.view === 'tools') bindTools(root);
  if (ui.view === 'reports') $$('#rp button', root).forEach((b) => b.onclick = () => { ui.reportPeriod = b.dataset.v; render(); });
}
/* Phones: the round + button. Tapping it fans out the main actions in an arc around it. */
const FAB_ITEMS = [['expense', 'Expense', 'minus'], ['income', 'Income', 'plus'], ['transfer', 'Transfer', 'swap'], ['calc', 'Calculator', 'calc']];
const FAB_RADIUS = 150; // px from the + to each button
function fabMenu() {
  const items = FAB_ITEMS.map(([act, label, ic], i) => {
    // 90° = straight up, 180° = straight left
    const a = (90 + i * 30) * Math.PI / 180;
    // Aesthetic: from the + in the middle of the bar, one row of four inside a panel above it (styles.css)
    const x = aesthetic() ? Math.round((i - (FAB_ITEMS.length - 1) / 2) * 84) : Math.round(Math.cos(a) * FAB_RADIUS);
    const y = aesthetic() ? -107 : Math.round(-Math.sin(a) * FAB_RADIUS);
    return `<button class="fab-item ${act}" data-fab="${act}" tabindex="-1" style="--x:${x}px;--y:${y}px;--i:${i}"><span class="fab-ic">${icon(ic)}</span><span class="fab-label">${label}</span></button>`;
  }).join('');
  return `<div class="fab-wrap" id="fabWrap"><div class="fab-dim" data-fab-close></div>${items}
    <button class="fab" id="fab" aria-label="Quick actions" aria-expanded="false">${icon('plus')}</button></div>`;
}
function setFab(open) {
  const w = $('#fabWrap'); if (!w) return;
  w.classList.toggle('open', open);
  $('#fab', w).setAttribute('aria-expanded', String(open));
  const add = $('#navAdd'); if (add) { add.setAttribute('aria-expanded', String(open)); add.classList.toggle('open', open); }
  $$('.fab-item', w).forEach((b) => { b.tabIndex = open ? 0 : -1; });
}
function bindCommon(root) {
  const on = (sel, fn) => $$(sel, root).forEach((el) => el.onclick = () => fn(el));
  on('[data-nav]', (el) => { ui.view = el.dataset.nav; $('.main').scrollTop = 0; render(); $('.main').scrollTop = 0; });
  on('[data-go]', (el) => { ui.view = el.dataset.go; render(); $('.main').scrollTop = 0; });
  on('[data-add]', (el) => txForm({ type: el.dataset.add }));
  on('[data-calc-pad]', () => calcPad());
  on('#openCal', () => openCalendar());
  on('#fab', () => setFab(!$('#fabWrap').classList.contains('open')));
  on('#navAdd', () => setFab(!$('#fabWrap').classList.contains('open'))); // the Aesthetic bar's +
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
  on('#moreBtn, #homeMenu', () => openModal({
    title: 'More',
    body: `<div class="nav more-list">${NAV.filter(([k]) => (aesthetic() ? k !== 'dashboard' : !phoneBar().includes(k))).map(([k, l, ic]) => `<button data-nav="${k}" class="${ui.view === k ? 'on' : ''}">${icon(ic)}<span>${(aesthetic() && AES_LABELS[k]) || l}</span></button>`).join('')}</div>
      <p class="more-credit">Pocket Ledger ${APP_VERSION} · Designed &amp; developed by ${AUTHOR}</p>`,
    onMount: (m) => $$('[data-nav]', m).forEach((b) => b.onclick = () => { closeModal(); ui.view = b.dataset.nav; render(); $('.main').scrollTop = 0; }),
  }));
  on('#setBudget', weeklyLimitForm);
  on('#backupNow', saveBackup);
  on('#backupLater', snoozeBackup);
  on('#addBudget, #addBudget2', () => budgetForm());
  on('[data-edit-budget]', (el) => budgetForm(state.budgets.find((b) => b.id === el.dataset.editBudget)));
  on('[data-del-budget]', (el) => deleteBudget(el.dataset.delBudget));
  $$('[data-edit-row-budget]', root).forEach((row) => {
    const open = () => budgetForm(state.budgets.find((b) => b.id === row.dataset.editRowBudget));
    row.onclick = (e) => { if (!e.target.closest('.meter-actions')) open(); };
    row.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === row) { e.preventDefault(); open(); } };
  });
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
  $$('[data-week]', root).forEach((b) => b.onclick = () => { s.weekStart = +b.dataset.week; save(); render(); });
  $$('[data-mode]', root).forEach((b) => b.onclick = () => { s.theme = b.dataset.mode; save(); render(); });
  $$('[data-pal]', root).forEach((b) => b.onclick = () => { s.palette = b.dataset.pal; save(); render(); });
  $$('[data-look]', root).forEach((b) => b.onclick = () => { setStyle(b.dataset.look); save(); render(); });
  $('#sDec', root).onchange = (e) => { s.decimals = e.target.checked; save(); render(); };
  bindNotifyPanel(root);
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
    : 'Every transaction, budget, goal and setting will be deleted from this device. Save a backup first if you might want it back.', 'Erase everything', () => { cloud()?.allowBulkDelete(); state = defaultState(); save(); ui.view = 'dashboard'; render(); });
  if (hasApi()) window.pywebview.api.data_location().then((p) => { const el = $('#dataLoc'); if (el) el.textContent = 'Saved automatically to ' + p; });
  else $('#dataLoc', root).textContent = isNativeApp() ? 'Saved automatically on this phone.' : 'Saved automatically in this browser.';
  bindCloud(root);
  const rate = $('#rateApp', root); if (rate) rate.onclick = openPlayPage;
  $('#fbIdea', root).onclick = () => feedbackForm('idea');
  $('#fbProblem', root).onclick = () => feedbackForm('problem');
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

/* ================= phone notifications (Android app) ================= */
/* The phone itself shows these at the planned time, even with the app closed: no server, nothing leaves the phone.
   Every time the app saves (or opens), the next 7 days are planned again from the latest data, so the
   messages stay true: add something today and tonight's reminder is dropped. */
const NOTIFY_DAILY = [
  ['Quick check-in 👋', 'Added today’s spending?'],
  ['Before the day ends', 'Log today’s spending while you remember.'],
  ['Your ledger is waiting 📒', 'Any spending today? Add it now.'],
  ['10-second habit', 'Add today’s spending to stay on track.'],
];
const NOTIFY_MORNING = '09:00', NOTIFY_SUMMARY = '19:00';
const notifySettings = () => ({ ...defaultState().settings.notify, ...state.settings.notify });
/* A Date for a day ("2026-11-05") at a time ("20:00"), in the phone's own time zone. */
function notifyAt(iso, hhmm) { const d = parseISO(iso); const [h, m] = hhmm.split(':').map(Number); d.setHours(h, m, 0, 0); return d; }
/* What to show and when, for the next 7 days. Pure: reads the data, changes nothing, so the tests can check it.
   Ids: 1xx daily reminder, 2xx payments, 300 weekly limit, 400 weekly summary, 5xx the person's own reminders. */
function planNotifications(nowMs = now().getTime()) {
  const n = notifySettings(), t = today(), out = [];
  const add = (id, at, title, body) => { if (at.getTime() > nowMs + 60000) out.push({ id, at, title, body }); };
  if (n.daily) {
    const loggedToday = state.transactions.some((x) => x.date === t);
    for (let i = loggedToday ? 1 : 0; i < 7; i++) {
      const d = addDays(t, i); const [title, body] = NOTIFY_DAILY[parseISO(d).getDate() % NOTIFY_DAILY.length];
      add(100 + i, notifyAt(d, n.dailyTime || '20:00'), title, body);
    }
  }
  if (n.bills) {
    let k = 0;
    for (const r of state.recurring.filter((x) => x.active)) {
      for (let due = r.nextDate, guard = 0; due && due <= addDays(t, 8) && guard < 10; due = nextOccurrence(r, due), guard++) {
        const what = r.note || catName(r.categoryId), amt = money(r.amount);
        add(200 + k++, notifyAt(addDays(due, -1), NOTIFY_MORNING), r.type === 'income' ? 'Coming in tomorrow 💰' : 'Due tomorrow 🗓️', `${what}: ${amt}`);
      }
    }
  }
  if (n.reminders) {
    // The morning of each reminder in the next week (500 + a number).
    calEvents(t, addDays(t, 7)).filter((e) => e.kind === 'remind').forEach((e, k) => {
      add(500 + k, notifyAt(e.date, NOTIFY_MORNING), `🔔 ${e.label}`, e.amount ? `Today: ${money(Math.abs(e.amount))}${e.amount > 0 ? ' coming in' : ''}` : 'Your reminder for today');
    });
  }
  const w = weekInfo(t);
  if (n.limit && w.B && w.spent >= w.B * 0.8) {
    // Once a week: tomorrow morning, unless this week's warning has already been shown.
    const tomorrow = addDays(t, 1); const shown = n.limitWarnAt && n.limitWarnAt >= w.start && n.limitWarnAt <= t;
    if (tomorrow <= w.end && !shown) {
      add(300, notifyAt(tomorrow, NOTIFY_MORNING), w.remaining > 0 ? 'Weekly limit almost used ⚠️' : 'Over your weekly limit',
        w.remaining > 0 ? `${money(w.remaining, { short: true })} left this week.` : `${money(-w.remaining, { short: true })} over this week.`);
    }
  }
  if (n.summary) {
    const vs = w.B ? (w.remaining >= 0 ? `, ${money(w.remaining, { short: true })} under limit 🎉` : `, ${money(-w.remaining, { short: true })} over limit`) : '';
    add(400, notifyAt(w.end, NOTIFY_SUMMARY), 'Your week', `Spent ${money(w.spent, { short: true })}${vs}`);
  }
  return out;
}
/* Replaces the planned notifications with a fresh plan. Waits a moment so a burst of saves plans only once. */
let notifyTimer;
function scheduleNotifications() {
  const LN = window.Capacitor?.Plugins?.LocalNotifications;
  if (!isNativeApp() || !LN) return;
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(async () => {
    try {
      let plan = planNotifications();
      // Switches on but Android no longer allows notifications (turned off in the phone's settings, or never asked
      // after an update): turn the switches off so Settings tells the truth; turning one on asks again.
      if (plan.length && (await LN.checkPermissions()).display !== 'granted') {
        state.settings.notify = { ...notifySettings(), daily: false, bills: false, limit: false, summary: false, reminders: false };
        save(); if (ui.view === 'settings') render();
        plan = [];
      }
      const warn = plan.find((x) => x.id === 300);
      // Remember the day the limit warning shows, so it comes once a week (saved with the next change).
      // Planned but no longer needed (an expense was deleted): forget it, so it can still come later this week.
      if (warn) state.settings.notify = { ...notifySettings(), limitWarnAt: toISO(warn.at) };
      else if (notifySettings().limitWarnAt > today()) state.settings.notify = { ...notifySettings(), limitWarnAt: '' };
      const { notifications: pending = [] } = await LN.getPending();
      if (pending.length) await LN.cancel({ notifications: pending.map((x) => ({ id: x.id })) });
      // isExactNotification: false, or the plugin opens Android's "Alarms & reminders" page on every start
      // (the app doesn't ask for exact alarms, so it isn't listed there and the page comes back each time).
      if (plan.length) await LN.schedule({ notifications: plan.map((x) => ({ id: x.id, title: x.title, body: x.body, isExactNotification: false, schedule: { at: x.at, allowWhileIdle: true } })) });
    } catch (e) { console.error('Notifications', e); }
  }, 1000);
}
/* Turning a switch on: Android asks once for permission. Returns false if the person said no. */
async function allowNotifications() {
  const LN = window.Capacitor?.Plugins?.LocalNotifications; if (!LN) return false;
  try {
    let p = await LN.checkPermissions();
    if (p.display !== 'granted') p = await LN.requestPermissions();
    return p.display === 'granted';
  } catch { return false; }
}
function notifyPanel() {
  if (!isNativeApp()) return '';
  const n = notifySettings();
  const row = (key, title, hint, extra = '') => `<div class="set-row"><div class="set-label"><b>${title}</b><span class="hint">${hint}</span></div>
    <div class="set-ctrl">${extra}<input type="checkbox" class="switch" data-notify="${key}" ${n[key] ? 'checked' : ''} aria-label="${title}"></div></div>`;
  return `<section class="set-group"><h2 class="set-title">Notifications</h2><div class="set-card">
    ${row('daily', 'Daily reminder', 'A nudge to add the day’s spending. Skipped on days you already added something.',
      `<input class="input notify-time" type="time" id="notifyTime" value="${esc(n.dailyTime)}" aria-label="Reminder time" ${n.daily ? '' : 'disabled'}>`)}
    ${row('bills', 'Payment due tomorrow', 'The day before a scheduled payment or income, at 9:00.')}
    ${row('limit', 'Weekly limit warning', 'Once a week, the morning after you pass 80% of your weekly limit.')}
    ${row('summary', 'Weekly summary', 'On the last evening of your week: what you spent and how it went.')}
    ${row('reminders', 'Your reminders', 'At 9:00 on the day of each reminder you add on the Calendar.')}
  </div><p class="hint set-foot">Your phone shows these itself. Nothing is sent anywhere.</p></section>`;
}
/* Turns one kind of phone notification on, after Android allows it (Android 13+ asks; older versions just allow).
   Never asks for exact alarms, so no version sends the person to a special settings page. False if not allowed. */
async function turnOnNotify(key) {
  if (!(await allowNotifications())) {
    toast('Notifications are off for Pocket Ledger. Turn them on in your phone’s Settings → Apps → Pocket Ledger → Notifications.');
    return false;
  }
  state.settings.notify = { ...notifySettings(), [key]: true }; save();
  return true;
}
function bindNotifyPanel(root) {
  $$('[data-notify]', root).forEach((box) => box.onchange = async () => {
    if (box.checked) box.checked = await turnOnNotify(box.dataset.notify);
    else { state.settings.notify = { ...notifySettings(), [box.dataset.notify]: false }; save(); }
    if (box.dataset.notify === 'daily') $('#notifyTime', root).disabled = !box.checked;
  });
  const time = $('#notifyTime', root);
  if (time) time.onchange = () => { if (time.value) { state.settings.notify = { ...notifySettings(), dailyTime: time.value }; save(); } };
}

/* ================= app updates ================= */
/* Web: sw.js sends "update-ready" when it has downloaded newer files into the cache;
   reloading then shows the new version straight away.
   Phone: Google Play says whether a newer version is out (see checkPlayUpdate); "Update" opens the Play Store.
   The card uses the theme's own colours (surface, ink, accent), so it reads well in every theme, light or dark. */
function showUpdateBanner({ text = 'A new version of Pocket Ledger is ready.', onUpdate } = {}) {
  if ($('#updateBanner')) return; // several files can change at once; show one banner
  const el = document.createElement('div');
  el.id = 'updateBanner'; el.className = 'update-banner'; el.setAttribute('role', 'status');
  el.innerHTML = `<span class="update-icon">${icon('download')}</span>
    <div class="update-text"><strong>Update available</strong><span>${esc(text)}</span></div>
    <button class="btn small primary" id="updNow">Update</button>
    <button class="icon-btn" id="updLater" aria-label="Not now">${icon('x')}</button>`;
  document.body.appendChild(el);
  // Wait a moment so any change typed just before is saved (save() waits 150ms).
  $('#updNow').onclick = onUpdate || (() => setTimeout(() => location.reload(), 250));
  $('#updLater').onclick = () => el.remove();
}
/* Play Store version codes are made in android/app/build.gradle: 1.9.3 -> 10903. This turns one back into "1.9.3". */
const versionFromCode = (code) => `${Math.floor(code / 10000)}.${Math.floor(code / 100) % 100}.${code % 100}`;
/* Phone app only: asks Google Play (through the AppUpdate plugin) if a newer version is out.
   Any failure (no internet, installed from outside Play) just means no card. */
async function checkPlayUpdate() {
  const AppUpdate = window.Capacitor?.Plugins?.AppUpdate;
  if (!isNativeApp() || !AppUpdate) return;
  try {
    const info = await AppUpdate.getAppUpdateInfo();
    if (info.updateAvailability !== 2) return; // 2 = UPDATE_AVAILABLE
    const code = +info.availableVersionCode;
    showUpdateBanner({
      text: code ? `Version ${versionFromCode(code)} is on Google Play.` : 'A newer version is on Google Play.',
      onUpdate: () => AppUpdate.openAppStore().catch(() => {}),
    });
  } catch { /* no update info: carry on quietly */ }
}
/* ---------- feedback (Settings → Feedback) ----------
   The person writes their message here; Send opens their own email app with it filled in, addressed to the developer.
   Nothing is sent by the app itself, so no new data is collected. The app version and device help with problems. */
const FEEDBACK_EMAIL = 'kesharadhananjanaofc@gmail.com';
const FEEDBACK_KINDS = [
  ['idea', 'Idea', 'What would make Pocket Ledger better for you?'],
  ['problem', 'Problem', 'What happened, and what did you expect? The steps to make it happen again help a lot.'],
  ['other', 'Something else', 'Write anything you like.'],
];
function feedbackMail(kind, message) {
  const label = (FEEDBACK_KINDS.find(([k]) => k === kind) || FEEDBACK_KINDS[2])[1];
  const where = isNativeApp() ? 'Android app' : hasApi() ? 'Windows app' : 'web';
  const body = `${message}\n\n--\nPocket Ledger ${APP_VERSION} (${where})\n${navigator.userAgent}`;
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(`Pocket Ledger ${label.toLowerCase()}`)}&body=${encodeURIComponent(body)}`;
}
/* Phone and browser: going to a mailto: link hands it to the email app. Windows app: main.py opens it. */
function openEmail(url) {
  if (hasApi() && window.pywebview.api.open_email) return window.pywebview.api.open_email(url);
  window.location.href = url;
}
function feedbackForm(kind = 'idea') {
  openModal({
    title: 'Send feedback',
    body: `<div class="stack">
      <div class="seg type" id="fbKind" role="radiogroup" aria-label="What is it about?">${FEEDBACK_KINDS.map(([k, l]) => `<button type="button" role="radio" data-v="${k}" aria-checked="${k === kind}" class="${k === kind ? 'on' : ''}">${l}</button>`).join('')}</div>
      <label class="field"><span>Your message</span><textarea class="input" id="fbMsg" rows="6" maxlength="3000" placeholder="${esc(FEEDBACK_KINDS.find(([k]) => k === kind)[2])}" autofocus></textarea></label>
      <p class="hint" style="margin:0">Send opens your email app with this message, ready to go to <b>${FEEDBACK_EMAIL}</b>. The app version and your phone or browser type are added to help fix problems. You can read everything before you send it.</p>
    </div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="fbSend">Send</button>',
    onMount: (m) => {
      $$('#fbKind button', m).forEach((b) => b.onclick = () => {
        kind = b.dataset.v;
        $$('#fbKind button', m).forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); });
        $('#fbMsg', m).placeholder = FEEDBACK_KINDS.find(([k]) => k === kind)[2];
      });
      $('#fbSend', m).onclick = () => {
        const message = $('#fbMsg', m).value.trim();
        if (!message) { toast('Write a message first'); $('#fbMsg', m).focus(); return; }
        openEmail(feedbackMail(kind, message));
        closeModal(); toast('Opening your email app. Thank you!');
      };
    },
  });
}
/* Phone app only: opens the app's Google Play page so people can leave a rating (the AppReview plugin). */
function openPlayPage() {
  const AppReview = window.Capacitor?.Plugins?.AppReview;
  if (!AppReview) return toast('Could not open Google Play');
  AppReview.openAppStore().catch(() => toast('Could not open Google Play'));
}
/* Asking for a rating: only people who have really used the app (20+ entries over a week or more), and at most
   once every 120 days. Google decides whether the stars actually show, and never tells us. */
const REVIEW_MIN_TX = 20, REVIEW_MIN_DAYS = 7, REVIEW_AGAIN_DAYS = 120;
function reviewDue(st = state, t = today()) {
  const asked = st.settings.reviewAsked;
  if (asked && daysBetween(asked, t) < REVIEW_AGAIN_DAYS) return false;
  const mine = st.transactions.filter((x) => !x.auto); // scheduled ones added by the app don't count
  if (mine.length < REVIEW_MIN_TX) return false;
  const first = mine.reduce((m, x) => (x.date < m ? x.date : m), st.settings.startedOn || t);
  return daysBetween(first, t) >= REVIEW_MIN_DAYS;
}
/* Phone app only: called right after a new transaction is saved, a happy moment to ask. */
function askForReview() {
  const AppReview = window.Capacitor?.Plugins?.AppReview;
  if (!isNativeApp() || !AppReview || !reviewDue()) return;
  state.settings.reviewAsked = today(); save();
  // Wait for the form to close and the "Added" message to show first.
  setTimeout(() => AppReview.requestReview().catch(() => {}), 1500);
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
  for (const k of ['accounts', 'categories', 'transactions', 'budgets', 'goals', 'recurring', 'reminders']) if (!Array.isArray(d[k])) d[k] = base[k];
  d.version = 1;
  return d;
}
/* Combines a backup from another device ("theirs") into this device's data ("mine"). Nothing is deleted.
   Items with the same id are the same item, so they are never added twice. Each device made its own
   starter accounts and categories with different ids, so those also match by name.
   Returns { state, added } where added counts the new items in each list. Neither input is changed. */
function mergeStates(mine, theirs) {
  const out = JSON.parse(JSON.stringify(mine)); theirs = JSON.parse(JSON.stringify(theirs));
  const added = { transactions: 0, accounts: 0, categories: 0, goals: 0, budgets: 0, recurring: 0, reminders: 0 };
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
  mergeList('reminders', null, (x) => x, (m, r) => { if (r.date > m.date) m.date = r.date; if (r.done) m.done = true; }); // done on either device counts

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
      <b>Replace</b> deletes what’s on this device${cloud()?.info().signedIn ? ' <b>and in your account</b>' : ''} and uses the backup instead.</p>`,
    foot: `<button class="btn" data-close>Cancel</button><button class="btn danger" id="rReplace">Replace my data</button><button class="btn primary" id="rMerge">Merge</button>`,
    onMount: (m) => {
      // Signed in: the person chose to replace the account's data too, so sync may delete what isn't in the backup.
      $('#rReplace', m).onclick = () => { closeModal(); cloud()?.allowBulkDelete(); state = migrate(data); finish('Backup restored'); };
      $('#rMerge', m).onclick = () => { closeModal(); const r = mergeStates(state, migrate(data)); state = r.state; finish(mergeSummary(r.added)); };
    },
  });
}
/* "Added 12 transactions, 1 account", or a note that the backup had nothing new. */
function mergeSummary(a) {
  const parts = [[a.transactions, 'transaction', 'transactions'], [a.accounts, 'account', 'accounts'], [a.categories, 'category', 'categories'],
    [a.goals, 'goal', 'goals'], [a.budgets, 'budget', 'budgets'], [a.recurring, 'scheduled payment', 'scheduled payments'], [a.reminders, 'reminder', 'reminders']]
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
  checkPlayUpdate();
  scheduleNotifications();
  // Back in the app after a while (a new day, maybe): plan the reminders again from today.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleNotifications(); });
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
    periodRange, categoryRows, deleteTx, goalEffect, txForm, niceMax, plural, showUpdateBanner, checkPlayUpdate, versionFromCode, drawBarChart, fabOnScroll, planNotifications, scheduleNotifications, notifyPanel,
    calcEval, toolMath, calcPad, settleCalc,
    cloudPanel, accountForm, confirmMerge, syncLine, onCloudChange, renderSoon, backupDue, saveBackup, snoozeBackup, reviewDue, askForReview, openPlayPage, turnOnNotify, FEATURES, afterWelcome, setStyle, weekDots, reportSentence, donutChart, phoneBar, catIcon, viewHomeAes, greetingHtml, styleChooser, feedbackForm, feedbackMail, FEEDBACK_EMAIL, viewCalendar, openCalendar, calEvents, calDayMarks, calAmt, forecast, firstShortDay, nextPayday, dailySpend, reminderForm, remAmount, lastBackupText, hideTip, TIP_TOUCH_MS, hideSplash, SPLASH_MIN_MS,
  };
} else {
  let booted = false;
  const start = () => { if (!booted) { booted = true; boot(); } };
  window.addEventListener('pywebviewready', start);
  // Outside the desktop app (plain browser), fall back to local storage.
  setTimeout(() => { if (!window.pywebview) start(); }, 700);
}
})();

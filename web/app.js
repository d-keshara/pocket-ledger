/* Pocket Ledger — app logic. Plain JS, no dependencies. */
(() => {
'use strict';

/* ================= constants ================= */
const APP_VERSION = '1.3.0';
const AUTHOR = 'D. Kezara';
const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948', '#5f6b66', '#0f6b5c'];
const CURRENCIES = [
  ['LKR', 'Rs'], ['USD', '$'], ['EUR', '€'], ['GBP', '£'], ['INR', '₹'], ['AUD', 'A$'], ['CAD', 'C$'],
  ['SGD', 'S$'], ['AED', 'AED'], ['SAR', 'SAR'], ['QAR', 'QAR'], ['JPY', '¥'], ['MYR', 'RM'], ['PKR', 'Rs'],
  ['BDT', '৳'], ['NPR', 'Rs'], ['ZAR', 'R'], ['NZD', 'NZ$'], ['PHP', '₱'], ['NGN', '₦'], ['KES', 'KSh'],
];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
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
};

const hasApi = () => !!(window.pywebview && window.pywebview.api && window.pywebview.api.save_data);
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      if (hasApi()) await window.pywebview.api.save_data(state);
      else localStorage.setItem('pocket-ledger', JSON.stringify(state));
    } catch (e) { toast('Could not save your data: ' + e); }
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
      state.transactions.push({ id: uid(), type: r.type, amount: r.amount, date: r.nextDate, categoryId: r.categoryId, accountId: r.accountId, note: r.note, recurringId: r.id });
      r.nextDate = nextOccurrence(r, r.nextDate); n++;
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
const tip = () => $('#tip');
document.addEventListener('mousemove', (e) => {
  const el = e.target.closest?.('[data-tip]');
  const t = tip(); if (!t) return;
  if (!el) { t.classList.remove('show'); return; }
  t.innerHTML = el.getAttribute('data-tip');
  t.classList.add('show');
  const w = t.offsetWidth, h = t.offsetHeight;
  let x = e.clientX + 14, y = e.clientY - h - 10;
  if (x + w > innerWidth - 8) x = e.clientX - w - 14;
  if (y < 8) y = e.clientY + 16;
  t.style.left = x + 'px'; t.style.top = y + 'px';
});

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
function openModal({ title, body, foot, onMount, wide }) {
  closeModal();
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'overlay';
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
function closeModal() { $('#overlay')?.remove(); }
function confirmBox(title, text, okLabel, onOk) {
  openModal({
    title, body: `<p style="margin:0">${text}</p>`,
    foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="okb">${esc(okLabel)}</button>`,
    onMount: (m) => { $('#okb', m).onclick = () => { closeModal(); onOk(); }; },
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
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
    title = t.note || 'Transfer'; sub = `${esc(from)} to ${esc(to)}`; glyphColor = '#5f6b66'; letter = '⇄'; amtCls = ''; amt = money(t.amount);
  } else {
    title = t.note || c?.name || 'Uncategorised';
    sub = `${esc(c?.name || 'Uncategorised')} · ${esc(acc(t.accountId)?.name || '')}`;
    glyphColor = c?.color || '#5f6b66'; letter = (c?.name || '?')[0];
    amtCls = t.type === 'income' ? 'pos' : ''; amt = money(t.type === 'income' ? t.amount : -t.amount, { sign: true });
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
      <label class="field"><span>Amount (${esc(state.settings.symbol)})</span><input class="input amount" id="fAmount" type="number" min="0" step="0.01" inputmode="decimal" value="${draft.amount}" placeholder="0" autofocus></label>
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
    <div class="v">${money(r.v, { short: true })}<small>${total ? Math.round(r.v / total * 100) : 0}%</small></div></div>`).join('')}</div>`;
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

/* ================= views ================= */
/* On phones only the first four pages fit in the bottom bar; the rest live behind "More". */
const PHONE_BAR = ['dashboard', 'transactions', 'budgets', 'reports'];
const NAV = [
  ['dashboard', 'This week', 'home'], ['transactions', 'Transactions', 'list'], ['budgets', 'Budgets', 'target'],
  ['goals', 'Savings goals', 'flag'], ['recurring', 'Scheduled', 'repeat'], ['reports', 'Reports', 'chart'],
  ['accounts', 'Accounts', 'wallet'], ['settings', 'Settings', 'gear'],
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

  let lead;
  if (!w.B) {
    lead = `<div class="runway-lead"><div class="label">Spent this week</div><div class="big">${money(w.spent)}</div>
      <p class="sub">Set a weekly limit and you'll see how much you can safely spend each day, so money lasts until the week ends.</p>
      <button class="btn primary" id="setBudget">${icon('target')}Set weekly limit</button></div>`;
  } else {
    const over = w.leftToday < 0; const ratio = w.spent / w.B;
    lead = `<div class="runway-lead">
      <div class="label">${over ? 'Over today’s share by' : 'You can spend today'}</div>
      <div class="big ${over ? 'over' : ''}">${money(Math.abs(w.leftToday))}</div>
      <p class="sub">${w.remaining >= 0 ? `${money(w.remaining)} left of ${money(w.B)} this week` : `${money(-w.remaining)} over this week’s ${money(w.B)} limit`}</p>
      <div class="tank ${ratio > 1 ? 'over' : ratio > .8 ? 'warn' : ''}"><i style="width:${clamp(100 - ratio * 100, 0, 100)}%"></i></div>
      <div class="tank-legend"><span>${w.daysLeft} day${w.daysLeft > 1 ? 's' : ''} to go</span><span>${Math.round(clamp(1 - ratio, 0, 1) * 100)}% left</span></div>
      <button class="btn small ghost setb" id="setBudget">${icon('edit')}Change weekly limit</button></div>`;
  }
  const even = w.B / 7;
  const scaleMax = Math.max(even * 1.5, ...w.days.map((d) => d.spent), 1);
  const daysHtml = w.days.map((d, i) => {
    const dt = parseISO(d.date); const future = i > w.todayIdx; const isToday = i === w.todayIdx;
    const allowance = future ? w.perDayAfter : (isToday ? w.allowanceToday : even);
    const h = (d.spent / scaleMax) * 100; const ah = w.B ? (Math.min(allowance, scaleMax) / scaleMax) * 100 : 0;
    const over = w.B && d.spent > allowance + 0.001;
    const tipTxt = `${fmtDate(d.date, { full: true })}<br>${future ? `Plan up to <b>${esc(money(allowance))}</b>` : `Spent <b>${esc(money(d.spent))}</b>${w.B ? `<br>Daily share ${esc(money(allowance))}` : ''}`}`;
    return `<div class="day ${future ? 'future' : ''} ${isToday ? 'today' : ''}" data-tip="${esc(tipTxt)}">
      <div class="amt">${future ? (w.B ? money(allowance, { short: true }) : '') : money(d.spent, { short: true })}</div>
      <div class="col">${future ? '' : `<div class="fill ${over ? 'over' : ''}" style="height:${h}%"></div>`}${w.B ? `<div class="allow" style="bottom:${ah}%"></div>` : ''}</div>
      <div class="dn">${isToday ? 'Today' : DAY_SHORT[dt.getDay()]}</div></div>`;
  }).join('');
  const diff = w.spent - lastWSamePoint;
  const notes = `<div class="runway-note">
    <span>At this pace the week ends at <b>${money(projected)}</b>${w.B ? (projected > w.B ? ` <span class="neg">(${money(projected - w.B)} over)</span>` : ' <span class="pos">(within limit)</span>') : ''}</span>
    <span>Same point last week <b>${money(lastWSamePoint)}</b> ${lastWSamePoint || w.spent ? `<span class="${diff > 0 ? 'neg' : 'pos'}">${diff > 0 ? '+' : '−'}${money(Math.abs(diff)).replace('−', '')}</span>` : ''}</span>
    <span>No-spend days <b>${noSpend}</b></span>
  </div>`;

  // budget alerts
  const alerts = budgetStatus().filter((b) => b.ratio >= .9);
  const alertHtml = alerts.length ? `<div class="alert ${alerts.some((a) => a.ratio > 1) ? 'over' : 'warn'}">${icon('alert')}<div>${alerts.map((a) => `<b>${esc(a.name)}</b> ${a.ratio > 1 ? `is ${money(a.spent - a.amount)} over its ${a.period} budget` : `has ${money(a.amount - a.spent)} left this ${a.period === 'weekly' ? 'week' : 'month'}`}`).join(' · ')}</div></div>` : '';

  const weekEx = expensesIn(w.start, w.end);
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date) || 0).slice(0, 7);
  const upcoming = state.recurring.filter((r) => r.active && r.nextDate <= addDays(t, 14)).sort((a, b) => a.nextDate.localeCompare(b.nextDate)).slice(0, 5);
  const saved = mInc - mExp;

  return `<div class="head"><div><h1>${esc(greeting())}</h1><p>${fmtDate(t, { full: true })} · week of ${fmtDate(w.start, { full: true, noDay: true })} – ${fmtDate(w.end, { full: true, noDay: true })}</p></div>
    <div class="actions"><button class="btn" data-add="income">${icon('plus')}Income</button><button class="btn primary" data-add="expense">${icon('plus')}Expense</button></div></div>
    <section class="runway" aria-label="This week">${lead}<div class="days">${daysHtml}</div>${notes}</section>
    ${alertHtml}
    ${backupCard()}
    <div class="stats">
      <div class="stat"><div class="k">Total balance</div><div class="v">${money(totalBalance())}</div><div class="d">${state.accounts.length} account${state.accounts.length === 1 ? '' : 's'}</div></div>
      <div class="stat"><div class="k">Income in ${MONTH_SHORT[now().getMonth()]}</div><div class="v pos">${money(mInc)}</div><div class="d">${plural(incomeIn(mFrom, mTo).length, 'payment')}</div></div>
      <div class="stat"><div class="k">Spent in ${MONTH_SHORT[now().getMonth()]}</div><div class="v">${money(mExp)}</div><div class="d">${money(mExp / Math.max(1, parseISO(t).getDate()), { short: true })} a day on average</div></div>
      <div class="stat"><div class="k">Kept this month</div><div class="v ${saved < 0 ? 'neg' : ''}">${money(saved)}</div><div class="d">${mInc ? Math.round(saved / mInc * 100) + '% of income' : 'Add income to see your savings rate'}</div></div>
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
        ${upcoming.length ? `<div class="tx-list">${upcoming.map((r) => `<div class="tx"><div class="glyph" style="background:${cat(r.categoryId)?.color || '#5f6b66'}">${esc(catName(r.categoryId)[0])}</div><div style="min-width:0"><div class="t1">${esc(r.note || catName(r.categoryId))}</div><div class="t2">${fmtDate(r.nextDate)} · ${FREQ[r.frequency]}</div></div><div class="amt ${r.type === 'income' ? 'pos' : ''}">${money(r.type === 'income' ? r.amount : -r.amount, { sign: true })}</div><div></div></div>`).join('')}</div>`
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
  const f = ui.tx; const [from, to] = periodRange(f.period, f.from, f.to); const q = f.q.trim().toLowerCase();
  return state.transactions.filter((t) => inRange(t, from, to)
    && (f.type === 'all' || t.type === f.type)
    && (f.cat === 'all' || t.categoryId === f.cat)
    && (f.acc === 'all' || t.accountId === f.acc || t.toAccountId === f.acc)
    && (!q || (t.note || '').toLowerCase().includes(q) || catName(t.categoryId).toLowerCase().includes(q) || String(t.amount).includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date));
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
      <div class="summary-bar"><span>Income <b class="pos">${money(inc)}</b></span><span>Expenses <b>${money(ex)}</b></span><span>Net <b class="${inc - ex < 0 ? 'neg' : ''}">${money(inc - ex, { sign: true })}</b></span><span>${list.length} transaction${list.length === 1 ? '' : 's'}</span></div>
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
    body: `<div class="stack"><label class="field"><span>Most I want to spend per week (${esc(s.symbol)})</span><input class="input amount" id="wb" type="number" min="0" step="1" value="${s.weeklyBudget || ''}" placeholder="0" autofocus></label>
      <p class="hint">Fixed costs like rent and bills don’t count toward this. Set it to 0 to turn the limit off.</p></div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="wbSave">Save limit</button>',
    onMount: (m) => {
      const go = () => { s.weeklyBudget = round2(Math.max(0, parseFloat($('#wb', m).value) || 0)); save(); closeModal(); render(); toast('Weekly limit saved'); };
      $('#wbSave', m).onclick = go; $('#wb', m).onkeydown = (e) => e.key === 'Enter' && go();
    },
  });
}
function budgetForm(b = {}) {
  openModal({
    title: b.id ? 'Edit budget' : 'New category budget',
    body: `<div class="stack"><label class="field"><span>Category</span><select class="input" id="bc">${catOptions('expense', b.categoryId)}</select></label>
      <div class="grid2"><label class="field"><span>Limit (${esc(state.settings.symbol)})</span><input class="input" id="ba" type="number" min="0" value="${b.amount || ''}" autofocus></label>
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
      <div class="big">${money(g.saved)}</div><div class="meta">${plan}</div>
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
      <div class="grid2"><label class="field"><span>Target amount (${esc(state.settings.symbol)})</span><input class="input" id="gt" type="number" min="0" value="${g.target || ''}"></label>
      <label class="field"><span>Target date <span class="muted" style="font-weight:400">(optional)</span></span><input class="input" id="gd" type="date" value="${g.deadline || ''}"></label></div>
      ${g.id ? '' : `<label class="field"><span>Already saved (${esc(state.settings.symbol)})</span><input class="input" id="gs" type="number" min="0" value="0"></label>`}</div>`,
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
    body: `<div class="stack"><label class="field"><span>Amount (${esc(state.settings.symbol)})</span><input class="input amount" id="ga" type="number" min="0" autofocus></label>
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
    <div class="panel">${list.length ? `<p class="hint" style="margin:0 0 6px">Scheduled expenses cost about <b class="num" style="font-size:15px;color:var(--ink)">${money(monthlyCost)}</b> a month.</p>
    <table class="table rec-table"><thead><tr><th>Name</th><th>Category</th><th>Repeats</th><th>Next</th><th class="r">Amount</th><th></th></tr></thead><tbody>
    ${list.map((r) => `<tr style="${r.active ? '' : 'opacity:.5'}"><td><b>${esc(r.note || catName(r.categoryId))}</b><div class="muted" style="font-size:12.5px">${esc(acc(r.accountId)?.name || '')}<span class="phone-only"> · ${FREQ[r.frequency]}</span></div></td>
      <td><i class="dot" style="background:${cat(r.categoryId)?.color}"></i> ${esc(catName(r.categoryId))}</td><td>${FREQ[r.frequency]}</td><td>${r.active ? fmtDate(r.nextDate) : 'Paused'}</td>
      <td class="r num ${r.type === 'income' ? 'pos' : ''}" style="font-size:15px">${money(r.type === 'income' ? r.amount : -r.amount, { sign: true })}</td>
      <td class="r" style="white-space:nowrap"><button class="icon-btn" data-rec-toggle="${r.id}" aria-label="${r.active ? 'Pause' : 'Resume'}" data-tip="${r.active ? 'Pause' : 'Resume'}">${icon(r.active ? 'pause' : 'play')}</button><button class="icon-btn" data-rec-edit="${r.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-rec-del="${r.id}" aria-label="Delete">${icon('trash')}</button></td></tr>`).join('')}
    </tbody></table>` : empty('repeat', 'Nothing scheduled', 'Add your salary and regular bills so you never forget to log them.', `<button class="btn primary" id="addRec2">${icon('plus')}Schedule a payment</button>`)}</div>`;
}
function recForm(r = {}) {
  let type = r.type || 'expense';
  const body = () => `<div class="stack"><div class="seg type" id="rtype">${['expense', 'income'].map((v) => `<button type="button" data-v="${v}" class="${v === type ? 'on' : ''}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>
    <label class="field"><span>Name</span><input class="input" id="rn" value="${esc(r.note || '')}" placeholder="${type === 'income' ? 'e.g. Salary' : 'e.g. Netflix, Rent'}" autofocus maxlength="60"></label>
    <div class="grid2"><label class="field"><span>Amount (${esc(state.settings.symbol)})</span><input class="input" id="ra" type="number" min="0" value="${r.amount || ''}"></label>
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
        const rec = { type, amount, note: $('#rn', m).value.trim(), categoryId: $('#rc', m).value, frequency: $('#rf', m).value, nextDate, anchorDay: parseISO(nextDate).getDate(), accountId: $('#racc', m).value };
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
      <div class="stat"><div class="k">Income</div><div class="v pos">${money(tIn)}</div><div class="d">${plural(inc.length, 'payment')}</div></div>
      <div class="stat"><div class="k">Expenses</div><div class="v">${money(tEx)}</div><div class="d">${plural(ex.length, 'purchase')}</div></div>
      <div class="stat"><div class="k">Kept</div><div class="v ${tIn - tEx < 0 ? 'neg' : ''}">${money(tIn - tEx)}</div><div class="d">${tIn ? Math.round((tIn - tEx) / tIn * 100) + '% savings rate' : 'No income in this period'}</div></div>
      <div class="stat"><div class="k">Average day</div><div class="v">${money(tEx / days, { short: true })}</div><div class="d">across ${days} day${days > 1 ? 's' : ''}</div></div>
    </div>
    <div class="cols">
      <div class="panel"><h2>Income and expenses by month</h2><div class="legend"><span><i style="background:var(--good)"></i>Income</span><span><i style="background:var(--danger)"></i>Expenses</span></div>${barChart(monthGroups)}</div>
      <div class="panel"><h2>Spending by category</h2>${rows.length ? hbars(rows.slice(0, 10), tEx) : empty('chart', 'No spending in this period', 'Pick a longer period or add expenses.')}</div>
    </div>
    ${daily}
    <div class="cols">
      <div class="panel"><h2>Which days cost you most <small>${ex.length ? `${DAY_SHORT[peak]} is your priciest day` : ''}</small></h2>${barChart(wdGroups, { height: 190 })}<p class="hint" style="margin-top:8px">Average spent on each weekday in this period.</p></div>
      <div class="panel"><h2>Biggest expenses</h2>${top.length ? `<table class="table"><tbody>${top.map((x) => `<tr><td>${esc(x.note || catName(x.categoryId))}<div class="muted" style="font-size:12.5px">${esc(catName(x.categoryId))} · ${fmtDate(x.date, { full: true })}</div></td><td class="r num" style="font-size:15px">${money(x.amount)}</td></tr>`).join('')}</tbody></table>` : empty('list', 'No expenses', 'Nothing was spent in this period.')}</div>
    </div>`;
}

/* ---------- accounts ---------- */
function viewAccounts() {
  return `<div class="head"><div><h1>Accounts</h1><p>Total across all accounts: <b class="num" style="font-size:17px;color:var(--ink)">${money(totalBalance())}</b></p></div>
    <div class="actions"><button class="btn" id="transfer">${icon('swap')}Move money</button><button class="btn primary" id="addAcc">${icon('plus')}New account</button></div></div>
    <div class="cards">${state.accounts.map((a) => { const n = state.transactions.filter((t) => t.accountId === a.id || t.toAccountId === a.id).length; const b = accountBalance(a);
      return `<div class="card"><div class="top"><div style="display:flex;gap:10px;align-items:center"><i class="dot" style="background:${a.color};width:12px;height:12px"></i><h3>${esc(a.name)}</h3></div>
      <div><button class="icon-btn" data-acc-edit="${a.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn" data-acc-del="${a.id}" aria-label="Delete">${icon('trash')}</button></div></div>
      <div class="big ${b < 0 ? 'neg' : ''}">${money(b)}</div><div class="meta">${n} transaction${n === 1 ? '' : 's'} · started at ${money(+a.initial || 0)}</div></div>`; }).join('')}</div>
    ${state.accounts.length ? '' : `<div class="panel">${empty('wallet', 'No accounts', 'Add where your money lives: cash, bank, card or mobile wallet.')}</div>`}`;
}
function accForm(a = {}) {
  openModal({
    title: a.id ? 'Edit account' : 'New account',
    body: `<div class="stack"><label class="field"><span>Name</span><input class="input" id="an" value="${esc(a.name || '')}" placeholder="e.g. Cash, Savings, Credit card, eZ Cash" autofocus maxlength="40"></label>
      <label class="field"><span>Starting balance (${esc(state.settings.symbol)})</span><input class="input" id="ai" type="number" value="${a.initial ?? 0}"></label>
      <p class="hint">Enter what’s in the account right now. For a credit card you owe money on, use a negative number.</p>
      <div class="field"><span>Colour</span>${swatches(a.color || PALETTE[state.accounts.length % PALETTE.length])}</div></div>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="as">Save account</button>',
    onMount: (m) => { const color = bindSwatches(m); $('#as', m).onclick = () => {
      const name = $('#an', m).value.trim(); if (!name) return toast('Give the account a name');
      const rec = { name, initial: round2(parseFloat($('#ai', m).value) || 0), color: color() };
      if (a.id) Object.assign(state.accounts.find((x) => x.id === a.id), rec); else state.accounts.push({ id: uid(), ...rec });
      save(); closeModal(); render(); toast('Account saved');
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
  return `<div class="head"><div><h1>Settings</h1><p>Make it yours. Everything is stored only on this device.</p></div></div>
    <div class="cols" style="margin-top:0">
      <div class="panel"><h2>Profile</h2><div class="stack">
        <label class="field"><span>Your name</span><input class="input" id="sName" value="${esc(s.name)}" maxlength="30"></label>
        <div class="grid2">
          <label class="field"><span>Currency</span><select class="input" id="sCur">${CURRENCIES.map(([c, sym]) => `<option value="${c}" ${s.currency === c ? 'selected' : ''}>${c} (${sym})</option>`).join('')}</select></label>
          <label class="field"><span>Symbol shown</span><input class="input" id="sSym" value="${esc(s.symbol)}" maxlength="5"></label>
          <label class="field"><span>Week starts on</span><select class="input" id="sWeek">${[1, 0, 6].map((d) => `<option value="${d}" ${s.weekStart === d ? 'selected' : ''}>${['Sunday', 'Monday', '', '', '', '', 'Saturday'][d]}</option>`).join('')}</select></label>
          <label class="field"><span>Appearance</span><select class="input" id="sTheme">${[['system', 'Match Windows'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="sDec" ${s.decimals ? 'checked' : ''}> Show cents / decimals</label>
      </div></div>
      <div class="panel"><h2>Your data</h2><div class="stack">
        <p class="hint" style="margin:0">Back up regularly so you never lose your history. A backup can be restored on another device.</p>
        <p class="hint" id="lastBackup" style="margin:0;color:var(--ink-2)">${lastBackupText()}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="backup">${icon('download')}Save backup</button><button class="btn" id="restore">${icon('upload')}Restore backup</button><button class="btn" id="csvAll">${icon('download')}Export all as CSV</button></div>
        <p class="hint" id="dataLoc" style="margin:0"></p>
        <div style="border-top:1px solid var(--line);padding-top:14px"><button class="btn danger" id="reset">${icon('trash')}Erase all data</button></div>
        <p class="hint" style="margin:0">Shortcuts: N new expense · I new income · Esc close</p>
      </div></div>
    </div>
    <div class="cols">
      <div class="panel"><h2>Expense categories <button class="btn small" data-cat-add="expense">${icon('plus')}Add</button></h2>${catList('expense')}</div>
      <div class="panel"><h2>Income categories <button class="btn small" data-cat-add="income">${icon('plus')}Add</button></h2>${catList('income')}</div>
    </div>
    <section class="about" aria-label="About">
      ${logo(44)}
      <div class="about-text"><strong>Pocket Ledger</strong><span>Version ${APP_VERSION}</span></div>
      <div class="about-credit">Designed and developed by <b>${AUTHOR}</b><span>© ${now().getFullYear()} ${AUTHOR}. Your data never leaves your device.</span></div>
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
function applyTheme() {
  const t = state?.settings.theme || 'system';
  if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
}

/* ================= onboarding ================= */
function viewWelcome() {
  const s = state.settings;
  return `<div class="welcome"><div class="welcome-inner"><div class="modal"><div class="modal-body" style="padding:30px 32px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">${logo(40)}<div><h1>Pocket Ledger</h1><p class="muted" style="margin:0">Know what you can spend today, and make it to the end of the week.</p></div></div>
    <div class="stack">
      <label class="field"><span>What should we call you?</span><input class="input" id="wName" placeholder="Your first name" maxlength="30" autofocus></label>
      <div class="grid2"><label class="field"><span>Currency</span><select class="input" id="wCur">${CURRENCIES.map(([c, sym]) => `<option value="${c}" ${s.currency === c ? 'selected' : ''}>${c} (${sym})</option>`).join('')}</select></label>
      <label class="field"><span>Week starts on</span><select class="input" id="wWeek"><option value="1">Monday</option><option value="0">Sunday</option><option value="6">Saturday</option></select></label></div>
      <div class="grid2"><label class="field"><span>Cash you have now</span><input class="input" id="wCash" type="number" min="0" placeholder="0"></label>
      <label class="field"><span>Money in the bank now</span><input class="input" id="wBank" type="number" min="0" placeholder="0"></label></div>
      <label class="field"><span>Most you want to spend in a week</span><input class="input" id="wLimit" type="number" min="0" placeholder="e.g. 5000"></label>
      <p class="hint">Leave out rent and bills. You can change any of this later in Settings.</p>
      <button class="btn primary" id="wGo" style="padding:11px">Start tracking</button>
    </div></div></div>
    <p class="welcome-credit">Designed and developed by ${AUTHOR} · v${APP_VERSION}</p></div></div>`;
}
function bindWelcome() {
  $('#wGo').onclick = () => {
    const s = state.settings; const cur = $('#wCur').value;
    s.name = $('#wName').value.trim(); s.currency = cur; s.symbol = CURRENCIES.find((c) => c[0] === cur)[1];
    s.weekStart = +$('#wWeek').value; s.weeklyBudget = round2(parseFloat($('#wLimit').value) || 0); s.onboarded = true;
    state.accounts[0].initial = round2(parseFloat($('#wCash').value) || 0);
    if (state.accounts[1]) state.accounts[1].initial = round2(parseFloat($('#wBank').value) || 0);
    save(); render();
  };
  $('#wName').focus();
}
function logo(size = 30) {
  return `<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="6" width="28" height="20" rx="5" fill="#5fd3b8"/><rect x="2" y="11" width="28" height="4" fill="#12302a" opacity=".35"/><rect x="18" y="17" width="12" height="7" rx="3.5" fill="#12302a"/><circle cx="22" cy="20.5" r="1.6" fill="#5fd3b8"/></svg>`;
}

/* ================= render & bindings ================= */
function render() {
  applyTheme();
  const root = $('#root');
  if (!state.settings.onboarded) { root.innerHTML = viewWelcome(); bindWelcome(); return; }
  const views = { dashboard: viewDashboard, transactions: viewTransactions, budgets: viewBudgets, goals: viewGoals, recurring: viewRecurring, reports: viewReports, accounts: viewAccounts, settings: viewSettings };
  const scroll = $('.main')?.scrollTop || 0;
  chartSpecs.length = 0;
  const w = weekInfo();
  root.innerHTML = `<div class="app"><aside class="side"><div class="brand">${logo()}<span class="brand-name">Pocket Ledger</span></div>
    <nav class="nav">${NAV.map(([k, l, ic]) => `<button data-nav="${k}" class="${ui.view === k ? 'on' : ''} ${PHONE_BAR.includes(k) ? '' : 'phone-hide'}" ${ui.view === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span></button>`).join('')}
      <button class="more-btn ${PHONE_BAR.includes(ui.view) ? '' : 'on'}" id="moreBtn">${icon('more')}<span>More</span></button></nav>
    <div class="side-foot">${w.B ? `Left this week<strong>${money(w.remaining)}</strong>` : `Balance<strong>${money(totalBalance())}</strong>`}
      <div class="credit">Designed &amp; developed by ${AUTHOR.replace(' ', '&nbsp;')}</div></div></aside>
    <main class="main"><div class="page">${views[ui.view]()}</div></main>
    <button class="fab" data-add="expense" aria-label="Add expense">${icon('plus')}</button></div>`;
  drawCharts();
  $('.main').scrollTop = scroll;
  bindCommon(root);
  if (ui.view === 'transactions') bindTransactions(root);
  if (ui.view === 'settings') bindSettings(root);
  if (ui.view === 'reports') $$('#rp button', root).forEach((b) => b.onclick = () => { ui.reportPeriod = b.dataset.v; render(); });
}
function bindCommon(root) {
  const on = (sel, fn) => $$(sel, root).forEach((el) => el.onclick = () => fn(el));
  on('[data-nav]', (el) => { ui.view = el.dataset.nav; $('.main').scrollTop = 0; render(); $('.main').scrollTop = 0; });
  on('[data-go]', (el) => { ui.view = el.dataset.go; render(); $('.main').scrollTop = 0; });
  on('[data-add]', (el) => txForm({ type: el.dataset.add }));
  on('#moreBtn', () => openModal({
    title: 'More',
    body: `<div class="nav more-list">${NAV.filter(([k]) => !PHONE_BAR.includes(k)).map(([k, l, ic]) => `<button data-nav="${k}" class="${ui.view === k ? 'on' : ''}">${icon(ic)}<span>${l}</span></button>`).join('')}</div>`,
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
  $('#sDec', root).onchange = (e) => { s.decimals = e.target.checked; save(); render(); };
  $('#backup', root).onclick = saveBackup;
  $('#csvAll', root).onclick = () => exportCsv(state.transactions);
  $('#restore', root).onclick = async () => {
    const apply = (data) => {
      if (!data || !Array.isArray(data.transactions) || !data.settings) return toast('That file isn’t a Pocket Ledger backup');
      confirmBox('Restore this backup?', `It has ${data.transactions.length} transactions and will replace everything currently in the app.`, 'Replace my data', () => { state = migrate(data); save(); render(); toast('Backup restored'); });
    };
    if (hasApi()) { try { apply(await window.pywebview.api.open_backup()); } catch (e) { toast('Could not read that file'); } }
    else { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { apply(JSON.parse(await i.files[0].text())); } catch { toast('Could not read that file'); } }; i.click(); }
  };
  $('#reset', root).onclick = () => confirmBox('Erase all data?', 'Every transaction, budget, goal and setting will be deleted from this computer. Save a backup first if you might want it back.', 'Erase everything', () => { state = defaultState(); save(); ui.view = 'dashboard'; render(); });
  if (hasApi()) window.pywebview.api.data_location().then((p) => { const el = $('#dataLoc'); if (el) el.textContent = 'Saved automatically to ' + p; });
  else $('#dataLoc', root).textContent = 'Saved automatically in this browser.';
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
if ('serviceWorker' in navigator) {
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
async function boot() {
  const data = await loadState();
  state = data ? migrate(data) : defaultState();
  postDueRecurring();
  render();
  // Re-render at midnight so "today" stays correct if the app is left open.
  setInterval(() => { const t = today(); if (t !== boot.last) { boot.last = t; postDueRecurring(); if (!$('#overlay')) render(); } }, 60000);
  boot.last = today();
}
/* Automated tests (tests/app.test.mjs) set __LEDGER_TEST__ before loading this file
   to reach the functions inside, and start the app themselves. */
if (window.__LEDGER_TEST__) {
  window.__ledger = {
    get state() { return state; }, set state(v) { state = v; }, ui,
    defaultState, migrate, render, money, esc, addDays, addMonths, daysBetween, weekStartOf, toISO, parseISO,
    weekInfo, accountBalance, totalBalance, postDueRecurring, nextOccurrence, budgetStatus, filteredTx,
    periodRange, categoryRows, deleteTx, goalEffect, txForm, niceMax, plural, showUpdateBanner,
    backupDue, saveBackup, snoozeBackup, lastBackupText,
  };
} else {
  let booted = false;
  const start = () => { if (!booted) { booted = true; boot(); } };
  window.addEventListener('pywebviewready', start);
  // Outside the desktop app (plain browser), fall back to local storage.
  setTimeout(() => { if (!window.pywebview) start(); }, 700);
}
})();

/* Makes the Google Play phone screenshots in store/screenshots (1080 x 2160, a 360 x 720 phone at 3x).
 *
 * Run:  node tools/store-screenshots.mjs
 * Needs Google Chrome (set CHROME=... if it isn't in the usual Windows place) and Node 22+.
 *
 * It serves web/ on a local port, opens the app in a hidden Chrome in test mode (nothing is saved, no real data is
 * touched), fills it with the same believable sample data every time, and saves one picture per screen below.
 * Change SHOTS to change what is shown; the files are named in upload order.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'web');
const OUT = path.join(ROOT, 'store', 'screenshots');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const NOW = '2026-11-27T19:30:00'; // a Friday evening, just after payday: "Good evening", a healthy month
const PORT = 47700, DEBUG = 9340;

/* ---------- the sample data, built inside the page (L = the app's test hooks) */
const DEMO = `
  const L = window.__ledger; const S = L.defaultState();
  Object.assign(S.settings, { onboarded: true, name: 'Kezara', weeklyBudget: 10000, weekStart: 1, startedOn: '2026-09-01',
    lastBackup: '2026-11-18', theme: 'light', palette: 'forest', style: 'professional' });
  const [cash, bank] = S.accounts; cash.initial = 8000; bank.initial = 22000;
  const c = (n) => S.categories.find((x) => x.name.startsWith(n)).id;
  let id = 0; const tx = (date, type, amount, cat, note, acc = cash.id) => S.transactions.push({ id: 's' + id++, type, amount, date, categoryId: c(cat), accountId: acc, note });
  // October, so "vs last month" and the reports have something to compare
  tx('2026-10-01', 'expense', 25000, 'Rent', 'Rent', bank.id); tx('2026-10-25', 'income', 120000, 'Salary', 'Salary', bank.id);
  [['03', 3600, 'Food', 'Groceries'], ['06', 1800, 'Eating', 'Dinner out'], ['09', 4100, 'Bills', 'Electricity'], ['12', 2950, 'Shopping', 'Shoes'],
   ['15', 3300, 'Food', 'Groceries'], ['18', 1500, 'Entertainment', 'Cinema'], ['21', 2600, 'Food', 'Groceries'], ['27', 2200, 'Eating', 'Birthday lunch']]
    .forEach(([d, v, k, n]) => tx('2026-10-' + d, 'expense', v, k, n));
  // November up to today (the 19th)
  tx('2026-11-01', 'expense', 25000, 'Rent', 'Rent', bank.id); tx('2026-11-12', 'income', 15000, 'Freelance', 'Logo design', bank.id);
  tx('2026-11-25', 'income', 120000, 'Salary', 'Salary', bank.id);
  [['02', 3450, 'Food', 'Groceries'], ['03', 260, 'Transport', 'Bus'], ['04', 950, 'Eating', 'Lunch with Nadee'], ['05', 4200, 'Bills', 'Electricity'],
   ['06', 1500, 'Entertainment', 'Cinema'], ['07', 2800, 'Food', 'Groceries'], ['08', 1990, 'Phone', 'Mobile plan'], ['09', 450, 'Eating', 'Coffee'],
   ['10', 3900, 'Shopping', 'Shirt'], ['11', 300, 'Transport', 'Bus'], ['12', 1350, 'Health', 'Pharmacy'], ['13', 3100, 'Food', 'Groceries'],
   ['14', 2200, 'Eating', 'Dinner out'], ['15', 2500, 'Gifts', "Amma's birthday"], ['17', 260, 'Transport', 'Bus'], ['17', 850, 'Eating', 'Lunch'],
   ['18', 1650, 'Food', 'Groceries'], ['18', 380, 'Eating', 'Coffee'], ['19', 950, 'Eating', 'Lunch'], ['19', 260, 'Transport', 'Bus'],
   ['20', 1100, 'Eating', 'Dinner out'], ['21', 2600, 'Food', 'Groceries'],
   // this week (Mon 23 to today, Fri 27): within the daily share except Wednesday's payday dinner
   ['23', 640, 'Food', 'Bread and milk'], ['23', 260, 'Transport', 'Bus'], ['24', 1200, 'Eating', 'Lunch with Nadee'], ['25', 2400, 'Eating', 'Payday dinner'],
   ['26', 340, 'Eating', 'Coffee'], ['26', 260, 'Transport', 'Bus'], ['27', 490, 'Food', 'Fruit'], ['27', 260, 'Transport', 'Bus']]
    .forEach(([d, v, k, n]) => tx('2026-11-' + d, 'expense', v, k, n));
  S.recurring.push(
    { id: 'r1', type: 'expense', amount: 25000, note: 'Rent', categoryId: c('Rent'), frequency: 'monthly', nextDate: '2026-12-01', anchorDay: 1, accountId: bank.id, active: true },
    { id: 'r2', type: 'income', amount: 120000, note: 'Salary', categoryId: c('Salary'), frequency: 'monthly', nextDate: '2026-12-25', anchorDay: 25, accountId: bank.id, active: true },
    { id: 'r3', type: 'expense', amount: 1490, note: 'Netflix', categoryId: c('Entertainment'), frequency: 'monthly', nextDate: '2026-11-30', anchorDay: 30, accountId: bank.id, active: true },
    { id: 'r4', type: 'expense', amount: 1990, note: 'Mobile plan', categoryId: c('Phone'), frequency: 'monthly', nextDate: '2026-12-08', anchorDay: 8, accountId: cash.id, active: true });
  S.reminders.push(
    { id: 'm1', title: 'School fees', date: '2026-12-03', amount: 3000, dir: 'out', frequency: 'monthly', anchorDay: 3, done: false },
    { id: 'm2', title: 'Call the insurance agent', date: '2026-12-02', amount: 0, dir: 'out', frequency: '', anchorDay: 2, done: false });
  S.goals.push(
    { id: 'g1', name: 'New laptop', target: 250000, saved: 85000, deadline: '2027-04-30' },
    { id: 'g2', name: 'Trip to Ella', target: 40000, saved: 31000, deadline: '2026-12-20' },
    { id: 'g3', name: 'Emergency fund', target: 100000, saved: 42000 });
  S.budgets.push({ id: 'b1', categoryId: c('Eating'), amount: 8000, period: 'monthly' }, { id: 'b2', categoryId: c('Food'), amount: 15000, period: 'monthly' },
    { id: 'b3', categoryId: c('Shopping'), amount: 6000, period: 'monthly' }, { id: 'b4', categoryId: c('Entertainment'), amount: 3000, period: 'monthly' });
  L.state = S;
  document.getElementById('splash')?.remove();
  const st = document.createElement('style');
  st.textContent = '::-webkit-scrollbar { display: none; } .main, .modal { scrollbar-width: none; } .toast-wrap { display: none; }';
  document.head.appendChild(st);
`;

/* ---------- the screens, in upload order: [file name, what to do after the sample data is in] */
const SHOTS = [
  ['1-this-week.png', `L.render();`],
  ['2-calendar.png', `L.openCalendar();`],
  ['3-aesthetic-home.png', `L.setStyle('aesthetic'); L.render();`],
  ['4-spending-chart.png', `L.setStyle('aesthetic'); L.ui.view = 'reports'; L.ui.reportPeriod = 'month'; L.render();
    const m = document.querySelector('.main'); m.scrollTop = document.querySelector('.hero').offsetTop - 16;`],
  ['5-add-expense.png', `L.setStyle('aesthetic'); L.render(); document.querySelector('.qa-tile[data-fab="expense"]').click();
    const a = document.querySelector('#fAmount'); a.value = '1250'; a.blur(); document.querySelector('#fCats .chip').click();
    document.querySelector('#fNote').value = 'Groceries for the week';`],
  ['6-savings-goals.png', `L.setStyle('aesthetic'); L.ui.view = 'goals'; L.render();`],
  ['7-dark-mode.png', `L.state.settings.theme = 'dark'; L.setStyle('aesthetic'); L.openCalendar();`],
  ['8-transactions.png', `L.ui.view = 'transactions'; L.render();`],
];

/* ---------- a tiny static server for web/ */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(WEB, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(WEB) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(PORT);

/* ---------- Chrome, driven through its DevTools protocol */
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-shots-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${profile}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cdpTab() {
  for (let i = 0; i < 50; i++) { try { return await (await fetch(`http://localhost:${DEBUG}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(200); } }
  throw new Error('Chrome did not start. Is CHROME set to chrome.exe?');
}
async function shot(file, step) {
  const tab = await cdpTab();
  const ws = new WebSocket(tab.webSocketDebuggerUrl); let n = 0; const wait = {};
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) wait[d.id](d); };
  await new Promise((r) => (ws.onopen = r));
  const send = (method, params = {}) => new Promise((r) => { const i = ++n; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 720, deviceScaleFactor: 3, mobile: true });
  await send('Network.enable'); await send('Network.setBypassServiceWorker', { bypass: true }); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__LEDGER_TEST__ = true; window.__LEDGER_NOW__ = '${NOW}';` });
  await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
  await sleep(1500);
  const r = await send('Runtime.evaluate', { expression: `(async () => { ${DEMO} ${step} await document.fonts.ready; return 'ok'; })()`, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(`${file}: ${r.result.exceptionDetails.exception?.description}`);
  await sleep(900); // animations settle
  const img = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(img.result.data, 'base64'));
  ws.close(); await fetch(`http://localhost:${DEBUG}/json/close/${tab.id}`).catch(() => {});
  console.log('saved', file);
}
try {
  for (const [file, step] of SHOTS) await shot(file, step);
} finally {
  chrome.kill(); server.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold a file for a moment */ }
}

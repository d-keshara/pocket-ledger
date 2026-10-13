/* Automated tests for Pocket Ledger.
 * Note: arrays made inside jsdom are a different "Array" than Node's, so we
 * copy them with [...arr] before deepEqual.
 * Run with:  npm test
 *
 * Each test loads web/app.js into a fake browser (jsdom), pretends "now" is
 * Wednesday 7 Oct 2026 (week starts Monday 5 Oct), and checks one behaviour.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const APP_SRC = fs.readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
const NBSP = ' '; // the thin space money() puts between symbol and number

function makeApp(now = '2026-10-07T10:00:00') {
  const dom = new JSDOM(
    '<!doctype html><body><div id="root"></div><div id="tip"></div><div id="toasts"></div></body>',
    { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true },
  );
  const w = dom.window;
  w.__LEDGER_TEST__ = true;
  w.__LEDGER_NOW__ = now;
  w.eval(APP_SRC);
  const L = w.__ledger;
  L.state = L.defaultState();
  L.state.settings.onboarded = true;
  const S = L.state;
  const expenseCat = (name) => S.categories.find((c) => c.type === 'expense' && c.name.startsWith(name));
  const incomeCat = () => S.categories.find((c) => c.type === 'income');
  const [cash, bank] = S.accounts;
  let n = 0;
  const add = (tx) => { const t = { id: 't' + n++, accountId: cash.id, note: '', ...tx }; S.transactions.push(t); return t; };
  return { w, doc: w.document, L, S, cash, bank, expenseCat, incomeCat, add, close: () => w.close() };
}

/* ---------------------------------------------------------------- dates */
describe('dates', () => {
  test('addMonths clamps to the last day of shorter months', (t) => {
    const { L, close } = makeApp(); t.after(close);
    assert.equal(L.addMonths('2026-01-31', 1), '2026-02-28');
    assert.equal(L.addMonths('2028-01-31', 1), '2028-02-29'); // leap year
    assert.equal(L.addMonths('2026-12-15', 1), '2027-01-15'); // crosses the year
  });

  test('addMonths keeps the anchor day after a short month', (t) => {
    const { L, close } = makeApp(); t.after(close);
    // A bill on the 31st, which fell on Feb 28, must go back to the 31st in March.
    assert.equal(L.addMonths('2026-02-28', 1, 31), '2026-03-31');
  });

  test('addDays and daysBetween cross month and year ends', (t) => {
    const { L, close } = makeApp(); t.after(close);
    assert.equal(L.addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(L.addDays('2026-03-01', -1), '2026-02-28');
    assert.equal(L.daysBetween('2026-01-01', '2027-01-01'), 365);
  });

  test('weekStartOf follows the "week starts on" setting', (t) => {
    const { L, S, close } = makeApp(); t.after(close);
    S.settings.weekStart = 1; assert.equal(L.weekStartOf('2026-10-07'), '2026-10-05'); // Monday
    S.settings.weekStart = 0; assert.equal(L.weekStartOf('2026-10-07'), '2026-10-04'); // Sunday
    S.settings.weekStart = 6; assert.equal(L.weekStartOf('2026-10-07'), '2026-10-03'); // Saturday
    S.settings.weekStart = 1; assert.equal(L.weekStartOf('2026-10-05'), '2026-10-05'); // already the start
  });
});

/* ---------------------------------------------------------------- money */
describe('money formatting', () => {
  test('shows symbol, thousands separator and 2 decimals', (t) => {
    const { L, close } = makeApp(); t.after(close);
    assert.equal(L.money(1234.5), `Rs${NBSP}1,234.50`);
  });

  test('negative amounts use a real minus sign, sign option adds +', (t) => {
    const { L, close } = makeApp(); t.after(close);
    assert.equal(L.money(-50), `−Rs${NBSP}50.00`);
    assert.equal(L.money(50, { sign: true }), `+Rs${NBSP}50.00`);
    assert.equal(L.money(0, { sign: true }), `Rs${NBSP}0.00`);
  });

  test('short and compact forms', (t) => {
    const { L, close } = makeApp(); t.after(close);
    assert.equal(L.money(1234.56, { short: true }), `Rs${NBSP}1,235`);
    assert.equal(L.money(12500, { compact: true, short: true }), `Rs${NBSP}13k`);
    assert.equal(L.money(2500000, { compact: true, short: true }), `Rs${NBSP}2.5M`);
  });

  test('decimals setting and JPY have no cents', (t) => {
    const { L, S, close } = makeApp(); t.after(close);
    S.settings.decimals = false; assert.equal(L.money(99.99), `Rs${NBSP}100`);
    S.settings.decimals = true; S.settings.currency = 'JPY'; S.settings.symbol = '¥';
    assert.equal(L.money(1500), `¥${NBSP}1,500`);
  });
});

/* ------------------------------------------------------- weekly runway */
describe('weekly runway (what you can spend today)', () => {
  test('shares what is left across the remaining days', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    S.settings.weeklyBudget = 7000;
    const food = expenseCat('Food').id;
    add({ type: 'expense', amount: 1000, date: '2026-10-05', categoryId: food }); // Mon
    add({ type: 'expense', amount: 2000, date: '2026-10-06', categoryId: food }); // Tue
    add({ type: 'expense', amount: 500, date: '2026-10-07', categoryId: food });  // Wed = today
    const w = L.weekInfo();
    assert.equal(w.spent, 3500);
    assert.equal(w.daysLeft, 5);               // Wed..Sun
    assert.equal(w.allowanceToday, 800);       // (7000 - 3000 spent before today) / 5
    assert.equal(w.leftToday, 300);            // 800 - 500 spent today
    assert.equal(w.remaining, 3500);
    assert.equal(w.perDayAfter, 800);          // (3500 - 300 still left today) / 4 days
  });

  test('fixed costs (rent) and other weeks are not counted', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    S.settings.weeklyBudget = 7000;
    add({ type: 'expense', amount: 18000, date: '2026-10-06', categoryId: expenseCat('Rent').id });
    add({ type: 'expense', amount: 900, date: '2026-10-12', categoryId: expenseCat('Food').id }); // next week
    add({ type: 'expense', amount: 900, date: '2026-10-04', categoryId: expenseCat('Food').id }); // last week
    assert.equal(L.weekInfo().spent, 0);
  });

  test('overspending today gives a negative "left today"', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    S.settings.weeklyBudget = 7000;
    add({ type: 'expense', amount: 2000, date: '2026-10-07', categoryId: expenseCat('Shopping').id });
    const w = L.weekInfo();
    assert.equal(w.allowanceToday, 1400);  // 7000 / 5
    assert.equal(w.leftToday, -600);
  });

  test('no weekly limit means no allowance', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const w = L.weekInfo();
    assert.equal(w.B, 0);
    assert.equal(w.allowanceToday, 0);
  });
});

/* ------------------------------------------------------------ balances */
describe('account balances', () => {
  test('income, expenses, transfers and goal money all move balances correctly', (t) => {
    const { L, S, cash, bank, add, expenseCat, incomeCat, close } = makeApp(); t.after(close);
    cash.initial = 1000;
    S.goals.push({ id: 'g1', name: 'Phone', target: 5000, saved: 0 });
    add({ type: 'income', amount: 500, date: '2026-10-01', categoryId: incomeCat().id });
    add({ type: 'expense', amount: 200, date: '2026-10-02', categoryId: expenseCat('Food').id });
    add({ type: 'transfer', amount: 300, date: '2026-10-03', toAccountId: bank.id });
    add({ type: 'transfer', amount: 100, date: '2026-10-04', goalId: 'g1' });                     // into a goal
    add({ type: 'transfer', amount: 50, date: '2026-10-05', accountId: null, toAccountId: cash.id, fromGoalId: 'g1' }); // out of a goal
    assert.equal(L.accountBalance(cash), 950); // 1000 + 500 - 200 - 300 - 100 + 50
    assert.equal(L.accountBalance(bank), 300);
    assert.equal(L.totalBalance(), 1250);
  });

  test('balances do not drift with decimal amounts', (t) => {
    const { L, cash, add, expenseCat, close } = makeApp(); t.after(close);
    cash.initial = 0.3;
    add({ type: 'expense', amount: 0.1, date: '2026-10-01', categoryId: expenseCat('Food').id });
    add({ type: 'expense', amount: 0.2, date: '2026-10-01', categoryId: expenseCat('Food').id });
    assert.equal(L.accountBalance(cash), 0); // 0.3 - 0.1 - 0.2 is 5.5e-17 without rounding
  });
});

/* ----------------------------------------------------------- recurring */
describe('scheduled payments', () => {
  test('posts every missed payment and keeps the anchor day', (t) => {
    const { L, S, cash, expenseCat, close } = makeApp(); t.after(close);
    S.recurring.push({ id: 'r1', type: 'expense', amount: 1990, note: 'Netflix', categoryId: expenseCat('Entertainment').id,
      frequency: 'monthly', nextDate: '2026-07-31', anchorDay: 31, accountId: cash.id, active: true });
    L.postDueRecurring();
    assert.deepEqual([...S.transactions.map((x) => x.date)], ['2026-07-31', '2026-08-31', '2026-09-30']);
    assert.equal(S.recurring[0].nextDate, '2026-10-31');
  });

  test('running it twice does not double-post', (t) => {
    const { L, S, cash, expenseCat, close } = makeApp(); t.after(close);
    S.recurring.push({ id: 'r1', type: 'expense', amount: 100, categoryId: expenseCat('Food').id,
      frequency: 'weekly', nextDate: '2026-09-23', anchorDay: 23, accountId: cash.id, active: true });
    L.postDueRecurring(); L.postDueRecurring();
    assert.equal(S.transactions.length, 3); // 23 Sep, 30 Sep, 7 Oct (today)
  });

  test('paused payments are not posted', (t) => {
    const { L, S, cash, expenseCat, close } = makeApp(); t.after(close);
    S.recurring.push({ id: 'r1', type: 'expense', amount: 100, categoryId: expenseCat('Food').id,
      frequency: 'monthly', nextDate: '2026-01-01', anchorDay: 1, accountId: cash.id, active: false });
    L.postDueRecurring();
    assert.equal(S.transactions.length, 0);
  });
});

/* ------------------------------------------------------------- budgets */
describe('budgets', () => {
  test('weekly and monthly budgets count the right period', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    const eat = expenseCat('Eating').id;
    S.budgets.push({ id: 'b1', categoryId: eat, amount: 3000, period: 'weekly' });
    S.budgets.push({ id: 'b2', categoryId: eat, amount: 10000, period: 'monthly' });
    add({ type: 'expense', amount: 3300, date: '2026-10-06', categoryId: eat }); // this week
    add({ type: 'expense', amount: 1000, date: '2026-10-01', categoryId: eat }); // this month, last week
    const [weekly, monthly] = L.budgetStatus();
    assert.equal(weekly.spent, 3300);
    assert.ok(weekly.ratio > 1, 'weekly budget should be over');
    assert.equal(monthly.spent, 4300);
    assert.equal(monthly.daysLeft, 25); // 7..31 Oct
  });
});

/* --------------------------------------------------- search & filters */
describe('transaction filters', () => {
  test('search ignores case and matches notes, categories and amounts', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 450, date: '2026-10-02', categoryId: expenseCat('Eating').id, note: 'Kottu with friends' });
    add({ type: 'expense', amount: 120, date: '2026-10-03', categoryId: expenseCat('Transport').id, note: 'Bus' });
    Object.assign(L.ui.tx, { q: 'KOTTU', period: 'all', type: 'all', cat: 'all', acc: 'all' });
    assert.equal(L.filteredTx().length, 1);
    L.ui.tx.q = 'transport'; assert.equal(L.filteredTx()[0].note, 'Bus');
    L.ui.tx.q = '450'; assert.equal(L.filteredTx().length, 1);
    void S;
  });

  test('period filter keeps only this month, newest first', (t) => {
    const { L, add, expenseCat, close } = makeApp(); t.after(close);
    const food = expenseCat('Food').id;
    add({ type: 'expense', amount: 1, date: '2026-09-30', categoryId: food });
    add({ type: 'expense', amount: 2, date: '2026-10-01', categoryId: food });
    add({ type: 'expense', amount: 3, date: '2026-10-07', categoryId: food });
    Object.assign(L.ui.tx, { q: '', period: 'month', type: 'all', cat: 'all', acc: 'all' });
    assert.deepEqual([...L.filteredTx().map((x) => x.amount)], [3, 2]);
  });
});

/* --------------------------------------------------- delete, undo, edit */
describe('editing data', () => {
  test('deleting money put into a goal takes it back out, and Undo restores it', (t) => {
    const { L, S, doc, add, close } = makeApp(); t.after(close);
    S.goals.push({ id: 'g1', name: 'Phone', target: 5000, saved: 1000 });
    const tx = add({ type: 'transfer', amount: 200, date: '2026-10-07', goalId: 'g1' });
    L.render();
    L.deleteTx(tx.id);
    assert.equal(S.goals[0].saved, 800);
    assert.equal(S.transactions.length, 0);
    doc.querySelector('.toast button').click(); // Undo
    assert.equal(S.goals[0].saved, 1000);
    assert.equal(S.transactions.length, 1);
  });

  test('changing a transfer into an expense leaves no old transfer fields', (t) => {
    const { L, S, doc, bank, add, close } = makeApp(); t.after(close);
    const tx = add({ type: 'transfer', amount: 300, date: '2026-10-07', toAccountId: bank.id });
    L.render();
    L.txForm(tx);
    doc.querySelector('#typeSeg [data-v="expense"]').click();
    doc.querySelector('#fCats .chip').click();
    doc.querySelector('#fSave').click();
    const saved = S.transactions[0];
    assert.equal(saved.type, 'expense');
    assert.ok(saved.categoryId, 'expense should have a category');
    assert.equal('toAccountId' in saved, false, 'toAccountId must be removed');
    assert.equal(L.accountBalance(bank), 0);
  });

  test('the add form refuses zero or empty amounts', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.render();
    L.txForm({ type: 'expense' });
    doc.querySelector('#fAmount').value = '0';
    doc.querySelector('#fSave').click();
    assert.equal(S.transactions.length, 0);
    assert.ok(doc.querySelector('#overlay'), 'form stays open');
  });
});

/* ------------------------------------------------------ old backups */
describe('backups', () => {
  test('migrate fills in anything an older backup is missing', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const old = { settings: { name: 'Kezara', currency: 'USD', symbol: '$' }, transactions: [{ id: 'a', type: 'income', amount: 5, date: '2026-01-01' }] };
    const d = L.migrate(old);
    assert.equal(d.settings.name, 'Kezara');
    assert.equal(d.settings.weekStart, 1);       // default filled in
    assert.equal(d.goals.length, 0);
    assert.equal(d.recurring.length, 0);
    assert.ok(d.categories.length > 0);
    assert.equal(d.transactions.length, 1);       // nothing lost
  });
});

/* ------------------------------------------------- safety & rendering */
describe('rendering', () => {
  test('every page renders without errors, with and without data', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close);
    const pages = ['dashboard', 'transactions', 'budgets', 'goals', 'recurring', 'reports', 'accounts', 'settings'];
    for (const v of pages) { L.ui.view = v; L.render(); assert.ok(doc.querySelector('h1'), `${v} (empty) has a heading`); }
    S.settings.weeklyBudget = 5000;
    add({ type: 'expense', amount: 450, date: '2026-10-06', categoryId: expenseCat('Food').id, note: 'Lunch' });
    S.goals.push({ id: 'g1', name: 'Trip', target: 1000, saved: 400, deadline: '2026-12-01' });
    for (const v of pages) { L.ui.view = v; L.render(); assert.ok(doc.querySelector('h1'), `${v} (with data) has a heading`); }
    for (const p of ['week', 'month', 'lastmonth', '3m', 'year', 'all']) { L.ui.view = 'reports'; L.ui.reportPeriod = p; L.render(); }
  });

  test('shows the welcome screen until set up, with the credit', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.settings.onboarded = false;
    L.render();
    assert.ok(doc.querySelector('#wGo'));
    assert.match(doc.querySelector('.welcome-credit').textContent, /D\. Kezara/);
  });

  test('settings shows the About section with version and credit', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'settings'; L.render();
    const about = doc.querySelector('.about').textContent;
    assert.match(about, /Designed and developed by D\. Kezara/);
    assert.match(about, /Version \d+\.\d+\.\d+/);
  });

  test('text typed by the user cannot inject HTML', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 1, date: '2026-10-07', categoryId: expenseCat('Food').id, note: '<img src=x onerror="window.hacked=1">' });
    S.categories[0].name = '<b>bold</b>';
    for (const v of ['dashboard', 'transactions', 'settings']) { L.ui.view = v; L.render(); }
    assert.equal(doc.querySelector('#root img'), null);
    assert.equal([...doc.querySelectorAll('#root b')].some((b) => b.textContent === 'bold'), false);
    assert.equal(L.esc('<a href="x">'), '&lt;a href=&quot;x&quot;&gt;');
  });
});

/* ---------------------------------------------------- update banner */
describe('update banner', () => {
  test('shows only one banner even if several files changed', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.showUpdateBanner();
    L.showUpdateBanner();
    L.showUpdateBanner();
    assert.equal(doc.querySelectorAll('.update-banner').length, 1);
    assert.match(doc.querySelector('.update-banner').textContent, /new version/);
  });

  test('"Not now" button closes the banner', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);   // Arrange: start a fake app

    L.showUpdateBanner();                                   // Act: show the banner...
    doc.querySelector('#updLater').click();                 //      ...and click "Not now"

    assert.equal(doc.querySelector('.update-banner'), null);  // Assert: it should be gone
  });
});

/* --------------------------------------------------- backup reminder */
describe('backup reminder', () => {
  // Adds `count` small expenses, the oldest one `oldestDaysAgo` days before today (7 Oct).
  const addHistory = (app, count, oldestDaysAgo) => {
    for (let i = 0; i < count; i++) {
      app.add({ type: 'expense', amount: 100, date: app.L.addDays('2026-10-07', -oldestDaysAgo + i), categoryId: app.expenseCat('Food').id });
    }
  };

  test('new users with under 5 transactions are not nagged', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 4, 60);
    assert.equal(app.L.backupDue(), 0);
  });

  test('never backed up: due once the oldest transaction is 14+ days old', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 5, 20);
    assert.equal(app.L.backupDue(), 20);
  });

  test('a recent backup means no reminder', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 5, 60);
    app.S.settings.lastBackup = '2026-10-04'; // 3 days ago
    assert.equal(app.L.backupDue(), 0);
    app.S.settings.lastBackup = '2026-09-23'; // exactly 14 days ago
    assert.equal(app.L.backupDue(), 14);
  });

  test('"Remind me in 7 days" hides the card and snoozes for a week', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 5, 30);
    app.L.ui.view = 'dashboard'; app.L.render();
    assert.ok(app.doc.querySelector('.alert.backup'), 'card is shown');
    app.doc.querySelector('#backupLater').click();
    assert.equal(app.S.settings.backupSnoozeUntil, '2026-10-14');
    assert.equal(app.doc.querySelector('.alert.backup'), null);
  });

  test('saving a backup records the date and removes the card', async (t) => {
    const app = makeApp(); t.after(app.close);
    app.w.URL.createObjectURL = () => 'blob:test'; // jsdom has no real file downloads
    addHistory(app, 5, 30);
    app.L.ui.view = 'dashboard'; app.L.render();
    await app.L.saveBackup();
    assert.equal(app.S.settings.lastBackup, '2026-10-07');
    assert.equal(app.doc.querySelector('.alert.backup'), null);
    assert.equal(app.L.lastBackupText(), 'Last backup: Wed, 7 Oct (today).');
  });

  test('old saved data gets the new backup fields (Rule 1: never break saved data)', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const d = L.migrate({ settings: { name: 'Kezara' }, transactions: [] });
    assert.equal(d.settings.lastBackup, '');
    assert.equal(d.settings.backupSnoozeUntil, '');
  });

  test('the reminder comes back when the snooze date has passed', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 5, 30);

    app.S.settings.backupSnoozeUntil = '2026-10-10';           // snoozed until 3 days from now
    assert.equal(app.L.backupDue(), 0);                          // while snoozed: no reminder

    app.S.settings.backupSnoozeUntil = '2026-10-01';           // snooze ended last week
    assert.equal(app.L.backupDue(), 30);                         // oldest transaction is 30 days old
  });
});

/* ------------------------------------------------- tooltips on touch */
describe('tooltips on phones', () => {
  // Fake a finger tap: pointerdown (with pointerType "touch") then click.
  const tap = (w, el) => {
    const down = new w.Event('pointerdown', { bubbles: true });
    Object.defineProperty(down, 'pointerType', { value: 'touch' });
    el.dispatchEvent(down);
    el.click();
  };
  const setup = (t) => {
    const app = makeApp(); t.after(app.close);
    app.S.settings.weeklyBudget = 4000;
    app.L.ui.view = 'dashboard'; app.L.render();
    return app;
  };
  const tipShown = (doc) => doc.querySelector('#tip').classList.contains('show');

  test('tapping a day shows its tooltip', (t) => {
    const { w, doc } = setup(t);
    tap(w, doc.querySelector('.day[data-tip]'));
    assert.ok(tipShown(doc));
    assert.match(doc.querySelector('#tip').textContent, /Spent|Plan up to/);
  });

  test('scrolling hides the tooltip (the bug from the screenshots)', (t) => {
    const { w, doc } = setup(t);
    tap(w, doc.querySelector('.day[data-tip]'));
    doc.querySelector('.main').dispatchEvent(new w.Event('scroll')); // scroll events don't bubble; capture catches them
    assert.equal(tipShown(doc), false);
  });

  test('tapping somewhere else hides it', (t) => {
    const { w, doc } = setup(t);
    tap(w, doc.querySelector('.day[data-tip]'));
    tap(w, doc.querySelector('h1'));
    assert.equal(tipShown(doc), false);
  });

  test('changing page hides it', (t) => {
    const { w, doc, L } = setup(t);
    tap(w, doc.querySelector('.day[data-tip]'));
    L.ui.view = 'reports'; L.render();
    assert.equal(tipShown(doc), false);
  });

  test('it fades out by itself after a moment', async (t) => {
    const { w, doc, L } = setup(t);
    tap(w, doc.querySelector('.day[data-tip]'));
    await new Promise((r) => setTimeout(r, L.TIP_TOUCH_MS + 150));
    assert.equal(tipShown(doc), false);
  });
});

/* ------------------------------------------------- splash & credit */
describe('splash and credit', () => {
  test('the splash fades out once the app has started', async (t) => {
    const { w, doc, L, close } = makeApp(); t.after(close);
    doc.body.insertAdjacentHTML('afterbegin', '<div class="splash" id="splash"></div>');
    L.hideSplash();
    await new Promise((r) => setTimeout(r, L.SPLASH_MIN_MS + 100));
    const el = doc.getElementById('splash');
    assert.ok(!el || el.classList.contains('hide'), 'splash is hidden');
    void w;
  });

  test('the phone "More" menu shows the credit', (t) => {
    const { doc, L, close } = makeApp(); t.after(close);
    L.render();
    doc.querySelector('#moreBtn').click();
    assert.match(doc.querySelector('.more-credit').textContent, /Designed & developed by D\. Kezara/);
  });
});

/* ------------------------------------------- 1.5.0: theme switch, numbers, fixes */
describe('theme switch on the home page', () => {
  test('tapping Dark switches the theme, remembers it and moves the pill', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.render();
    const dark = doc.querySelector('.theme-toggle [data-theme-set="dark"]');
    assert.equal(doc.querySelector('.theme-toggle [aria-checked="true"]').dataset.themeSet, 'system');
    dark.click();
    assert.equal(S.settings.theme, 'dark');
    assert.equal(doc.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(dark.getAttribute('aria-checked'), 'true');
    assert.equal(doc.querySelector('.theme-toggle').style.getPropertyValue('--i'), '2');
    doc.querySelector('.theme-toggle [data-theme-set="system"]').click();
    assert.equal(doc.documentElement.hasAttribute('data-theme'), false);
  });
});

describe('highlighted amounts', () => {
  test('big amounts split symbol, digits and cents', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.settings.weeklyBudget = 7000;
    L.render();
    const big = doc.querySelector('.runway-lead .big');
    assert.equal(big.querySelector('.cur').textContent, 'Rs');
    assert.equal(big.querySelector('.dec').textContent, '.00');
    assert.match(big.textContent, /^Rs1,400\.00$/);
  });

  test('"same point last week" shows no sign when nothing changed', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.render();
    assert.doesNotMatch(doc.querySelector('.runway-note').textContent, /−/);
  });
});

describe('1.5.0 bug fixes', () => {
  test('a filter on a deleted category falls back to all categories', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 5, date: '2026-10-07', categoryId: expenseCat('Food').id });
    Object.assign(L.ui.tx, { q: '', period: 'all', type: 'all', cat: 'gone', acc: 'gone-too' });
    assert.equal(L.filteredTx().length, 1);
    assert.equal(L.ui.tx.cat, 'all');
    void S;
  });

  test('on the same day, the transaction added last is listed first', (t) => {
    const { L, add, expenseCat, close } = makeApp(); t.after(close);
    const food = expenseCat('Food').id;
    add({ type: 'expense', amount: 1, date: '2026-10-07', categoryId: food });
    add({ type: 'expense', amount: 2, date: '2026-10-07', categoryId: food });
    add({ type: 'expense', amount: 3, date: '2026-10-06', categoryId: food });
    Object.assign(L.ui.tx, { q: '', period: 'all', type: 'all', cat: 'all', acc: 'all' });
    assert.deepEqual([...L.filteredTx().map((x) => x.amount)], [2, 1, 3]);
  });

  test('switching type in the scheduled-payment form and cancelling changes nothing', (t) => {
    const { L, S, doc, cash, expenseCat, close } = makeApp(); t.after(close);
    S.recurring.push({ id: 'r1', type: 'expense', amount: 900, note: 'Rent', categoryId: expenseCat('Rent').id, frequency: 'monthly', nextDate: '2026-10-31', anchorDay: 31, accountId: cash.id, active: true });
    L.ui.view = 'recurring'; L.render();
    doc.querySelector('[data-rec-edit="r1"]').click();
    doc.querySelector('#rn').value = 'Changed';
    doc.querySelector('#rtype [data-v="income"]').click();
    doc.querySelector('[data-close]').click();
    assert.equal(S.recurring[0].note, 'Rent');
    assert.equal(S.recurring[0].type, 'expense');
  });

  test('saving a scheduled payment without changing its date keeps the 31st', (t) => {
    const { L, S, doc, cash, expenseCat, close } = makeApp(); t.after(close);
    S.recurring.push({ id: 'r1', type: 'expense', amount: 900, note: 'Rent', categoryId: expenseCat('Rent').id, frequency: 'monthly', nextDate: '2026-11-30', anchorDay: 31, accountId: cash.id, active: true });
    L.ui.view = 'recurring'; L.render();
    doc.querySelector('[data-rec-edit="r1"]').click();
    doc.querySelector('#rs').click();
    assert.equal(S.recurring[0].anchorDay, 31);
  });
});

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

  test('two devices posting the same payment make the same transaction id (for sync)', (t) => {
    const a = makeApp(); const b = makeApp(); t.after(a.close); t.after(b.close);
    for (const d of [a, b]) {
      d.S.recurring.push({ id: 'r1', type: 'expense', amount: 50000, note: 'Rent', categoryId: d.expenseCat('Rent').id,
        frequency: 'monthly', nextDate: '2026-09-01', anchorDay: 1, accountId: d.cash.id, active: true });
      d.L.postDueRecurring();
    }
    assert.deepEqual([...a.S.transactions.map((x) => x.id)], ['r1-2026-09-01', 'r1-2026-10-01']);
    assert.deepEqual([...b.S.transactions.map((x) => x.id)], [...a.S.transactions.map((x) => x.id)]);
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

/* ------------------------------------------------- merging backups */
describe('merging a backup from another device', () => {
  // Two devices that were set up separately: same starter names, different random ids.
  const twoDevices = (L) => {
    const mine = L.defaultState(); const theirs = L.defaultState();
    const food = (s) => s.categories.find((c) => c.name.startsWith('Food')).id;
    return { mine, theirs, food };
  };

  test('adds what is new and never adds the same transaction twice', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const { mine, theirs, food } = twoDevices(L);
    mine.transactions.push({ id: 'm1', type: 'expense', amount: 100, date: '2026-10-01', categoryId: food(mine), accountId: mine.accounts[0].id, note: '' });
    theirs.transactions.push({ id: 'm1', type: 'expense', amount: 100, date: '2026-10-01', categoryId: food(theirs), accountId: theirs.accounts[0].id, note: '' });
    theirs.transactions.push({ id: 't1', type: 'expense', amount: 250, date: '2026-10-02', categoryId: food(theirs), accountId: theirs.accounts[0].id, note: '' });
    const once = L.mergeStates(mine, theirs);
    assert.equal(once.state.transactions.length, 2);
    assert.equal(once.added.transactions, 1);
    const twice = L.mergeStates(once.state, theirs);             // merging the same file again changes nothing
    assert.equal(twice.added.transactions, 0);
    assert.equal(twice.state.transactions.length, 2);
    assert.equal(mine.transactions.length, 1);                   // the inputs are not changed
  });

  test('starter accounts and categories match by name, so they are not doubled', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const { mine, theirs, food } = twoDevices(L);
    theirs.transactions.push({ id: 't1', type: 'expense', amount: 300, date: '2026-10-02', categoryId: food(theirs), accountId: theirs.accounts[0].id, note: '' });
    const { state, added } = L.mergeStates(mine, theirs);
    assert.equal(state.accounts.length, mine.accounts.length);
    assert.equal(state.categories.length, mine.categories.length);
    assert.equal(added.accounts + added.categories, 0);
    const tx = state.transactions[0];
    assert.equal(tx.accountId, mine.accounts[0].id);             // points at this device's Cash
    assert.equal(tx.categoryId, food(mine));
    L.state = state;
    assert.equal(L.accountBalance(state.accounts[0]), -300);
  });

  test('a new account from the other device comes with its transactions', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const { mine, theirs } = twoDevices(L);
    theirs.accounts.push({ id: 'card', name: 'Credit card', initial: 1000, color: '#000' });
    theirs.transactions.push({ id: 't1', type: 'transfer', amount: 200, date: '2026-10-02', accountId: 'card', toAccountId: theirs.accounts[0].id, note: '' });
    const { state, added } = L.mergeStates(mine, theirs);
    assert.equal(added.accounts, 1);
    L.state = state;
    assert.equal(L.accountBalance(state.accounts.find((a) => a.id === 'card')), 800);
    assert.equal(L.accountBalance(state.accounts[0]), 200);     // this device's Cash received it
  });

  test('a scheduled payment posted on both devices is kept only once', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const { mine, theirs, food } = twoDevices(L);
    const rent = { id: 'r1', type: 'expense', amount: 900, note: 'Rent', frequency: 'monthly', anchorDay: 1, active: true };
    mine.recurring.push({ ...rent, categoryId: food(mine), accountId: mine.accounts[0].id, nextDate: '2026-10-01' });
    theirs.recurring.push({ ...rent, categoryId: food(theirs), accountId: theirs.accounts[0].id, nextDate: '2026-11-01' });
    mine.transactions.push({ id: 'a', type: 'expense', amount: 900, date: '2026-09-01', recurringId: 'r1', note: 'Rent' });
    theirs.transactions.push({ id: 'b', type: 'expense', amount: 900, date: '2026-09-01', recurringId: 'r1', note: 'Rent' });
    theirs.transactions.push({ id: 'c', type: 'expense', amount: 900, date: '2026-10-01', recurringId: 'r1', note: 'Rent' });
    const { state } = L.mergeStates(mine, theirs);
    assert.deepEqual([...state.transactions.map((x) => x.date)].sort(), ['2026-09-01', '2026-10-01']);
    assert.equal(state.recurring.length, 1);
    assert.equal(state.recurring[0].nextDate, '2026-11-01');     // won't post October again
  });

  test('money saved into a shared goal on the other device is added to it', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const { mine, theirs } = twoDevices(L);
    mine.goals.push({ id: 'g1', name: 'Bike', target: 5000, saved: 1000, deadline: '' });
    theirs.goals.push({ id: 'g1', name: 'Bike', target: 5000, saved: 1500, deadline: '' });
    theirs.goals.push({ id: 'g2', name: 'Phone', target: 9000, saved: 700, deadline: '' });
    theirs.transactions.push({ id: 't1', type: 'transfer', amount: 500, date: '2026-10-02', accountId: theirs.accounts[0].id, goalId: 'g1', note: '' });
    theirs.transactions.push({ id: 't2', type: 'transfer', amount: 700, date: '2026-10-02', accountId: theirs.accounts[0].id, goalId: 'g2', note: '' });
    const { state } = L.mergeStates(mine, theirs);
    assert.equal(state.goals.find((g) => g.id === 'g1').saved, 1500);
    assert.equal(state.goals.find((g) => g.id === 'g2').saved, 700); // new goal: its amount already counts t2
  });

  test('this device keeps its own settings', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const { mine, theirs } = twoDevices(L);
    mine.settings.name = 'Phone'; theirs.settings.name = 'Laptop';
    assert.equal(L.mergeStates(mine, theirs).state.settings.name, 'Phone');
  });

  test('the Merge button keeps this device’s transactions and adds the backup’s', (t) => {
    const { L, doc, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 50, date: '2026-10-07', categoryId: expenseCat('Food').id });
    const backup = L.defaultState();
    backup.transactions.push({ id: 'x1', type: 'expense', amount: 75, date: '2026-10-06', categoryId: backup.categories[0].id, accountId: backup.accounts[0].id, note: '' });
    L.restoreBox(backup);
    doc.querySelector('#rMerge').click();
    assert.deepEqual([...L.state.transactions.map((x) => x.amount)].sort(), [50, 75]);
    assert.equal(doc.querySelector('#overlay'), null);           // the dialog closed
  });

  test('the Replace button swaps in the backup', (t) => {
    const { L, doc, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 50, date: '2026-10-07', categoryId: expenseCat('Food').id });
    const backup = L.defaultState();
    backup.transactions.push({ id: 'x1', type: 'expense', amount: 75, date: '2026-10-06', categoryId: backup.categories[0].id, accountId: backup.accounts[0].id, note: '' });
    L.restoreBox(backup);
    doc.querySelector('#rReplace').click();
    assert.deepEqual([...L.state.transactions.map((x) => x.amount)], [75]);
  });

  test('the message says what was added', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const none = { transactions: 0, accounts: 0, categories: 0, goals: 0, budgets: 0, recurring: 0 };
    assert.equal(L.mergeSummary({ ...none, transactions: 12, accounts: 1 }), 'Added 12 transactions, 1 account');
    assert.equal(L.mergeSummary({ ...none, categories: 2 }), 'Added 2 categories');
    assert.equal(L.mergeSummary(none), 'Nothing new in this backup');
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

/* ------------------------------------------------------ sync & account */
/* A pretend window.PocketCloud (the real one is web/sync.js), so these tests never use the internet. */
function fakeCloud(w, { signedIn = false, verified = true, fail = null } = {}) {
  const calls = [];
  const c = {
    available: true, signedIn, verified, email: signedIn ? 'me@example.com' : '',
    info: () => ({ status: 'ready', signedIn: c.signedIn, email: c.email, verified: c.verified }),
    onChange: () => () => {}, start: () => {}, attach: () => {}, changed: () => {},
    signUp: async (email, password) => { calls.push(['signUp', email, password]); if (fail) throw { code: fail }; Object.assign(c, { signedIn: true, email, verified: false }); },
    signIn: async (method, o) => { calls.push(['signIn', method, o.email, o.password]); if (fail) throw { code: fail }; Object.assign(c, { signedIn: true, email: o.email }); },
    signOut: async () => { calls.push(['signOut']); c.signedIn = false; },
    resetPassword: async (email) => { calls.push(['reset', email]); },
    sendVerification: async () => { calls.push(['verify']); },
    refresh: async () => { calls.push(['refresh']); c.verified = true; },
    deleteAccount: async (pw) => { calls.push(['delete', pw]); if (fail) throw { code: fail }; c.signedIn = false; },
    friendlyError: (e) => ({ 'auth/invalid-credential': 'Wrong email or password.', 'auth/email-already-in-use': 'There’s already an account with this email.' }[e.code] || 'Something went wrong. Try again.'),
  };
  w.PocketCloud = c;
  return { c, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0)); // let the async click handlers finish
const red = (doc, id) => doc.querySelector('#' + id).getAttribute('aria-invalid') === 'true';
const errText = (doc, id) => doc.querySelector(`#${id}-err`).textContent;
function openForm(L, doc, button) { L.ui.view = 'settings'; L.render(); doc.querySelector(button).click(); }
function fill(doc, values) { for (const [id, v] of Object.entries(values)) doc.querySelector('#' + id).value = v; }

describe('sync & account', () => {
  test('without sync.js, there is no Sync section or home button, and Settings still works', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.render();
    assert.equal(doc.querySelector('.cloud-btn'), null);
    L.ui.view = 'settings'; L.render();
    assert.ok(doc.querySelector('#backup'));
    assert.equal(doc.querySelector('#cloudUp'), null);
    assert.match(doc.body.textContent, /Everything is stored only on this device/);
  });

  test('the home page has a Sign in button that opens the form, and shows Account once signed in', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    fakeCloud(w);
    L.render();
    doc.querySelector('#cloudHead').click();
    assert.match(doc.querySelector('#overlay h2').textContent, /Sign in/);
    fill(doc, { ce: 'me@example.com', cp: 'whatever1' });
    doc.querySelector('#cgo').click(); await tick();
    assert.equal(doc.querySelector('#cloudHead'), null);
    assert.match(doc.querySelector('.cloud-btn.on').getAttribute('aria-label'), /me@example.com/);
  });

  test('creating an account sends the email and password and closes the form', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w);
    openForm(L, doc, '#cloudUp');
    fill(doc, { ce: ' me@example.com ', cp: 'secret123', cp2: 'secret123' });
    doc.querySelector('#cgo').click(); await tick();
    assert.deepEqual(calls[0], ['signUp', 'me@example.com', 'secret123']); // an email box drops the spaces itself
    assert.equal(doc.querySelector('#overlay'), null);
    assert.match(doc.body.textContent, /me@example.com/);
    assert.doesNotMatch(doc.body.textContent, /Your data never leaves your device/);
  });

  test('a weak password is stopped before asking Firebase, and the rules show what is missing', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w);
    openForm(L, doc, '#cloudUp');
    fill(doc, { ce: 'me@example.com', cp: 'abcdefgh', cp2: 'abcdefgh' }); // long enough, but no number
    doc.querySelector('#cp').dispatchEvent(new w.Event('input'));
    assert.deepEqual([...doc.querySelectorAll('#pwRules li')].map((li) => li.className), ['ok', 'ok', '']);
    doc.querySelector('#cgo').click();
    assert.equal(calls.length, 0);
    assert.ok(red(doc, 'cp'));
    assert.match(doc.querySelectorAll('#pwRules li')[2].className, /bad/);
  });

  test('the two passwords must match', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w);
    openForm(L, doc, '#cloudUp');
    fill(doc, { ce: 'me@example.com', cp: 'secret123', cp2: 'secret124' });
    doc.querySelector('#cgo').click();
    assert.equal(calls.length, 0);
    assert.ok(red(doc, 'cp2'));
    assert.ok(!red(doc, 'cp'));
    assert.match(errText(doc, 'cp2'), /don’t match/);
  });

  test('a badly typed or empty email is marked red under the email box', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w);
    openForm(L, doc, '#cloudIn');
    doc.querySelector('#cgo').click();
    assert.equal(calls.length, 0);
    assert.match(errText(doc, 'ce'), /Enter your email/);
    assert.match(errText(doc, 'cp'), /Enter your password/);
    fill(doc, { ce: 'me@example', cp: 'x' });
    doc.querySelector('#cgo').click();
    assert.ok(red(doc, 'ce'));
    assert.match(errText(doc, 'ce'), /doesn’t look right/);
    assert.equal(calls.length, 0);
  });

  test('a wrong password turns both boxes red, and typing again clears it', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    fakeCloud(w, { fail: 'auth/invalid-credential' });
    openForm(L, doc, '#cloudIn');
    fill(doc, { ce: 'me@example.com', cp: 'nope' });
    doc.querySelector('#cgo').click(); await tick();
    assert.ok(doc.querySelector('#overlay'), 'the form should stay open');
    assert.ok(red(doc, 'ce') && red(doc, 'cp'));
    assert.match(doc.querySelector('.form-error').textContent, /Wrong email or password/);
    assert.equal(doc.querySelector('#cgo').disabled, false);
    doc.querySelector('#cp').dispatchEvent(new w.Event('input'));
    assert.ok(!red(doc, 'ce') && !red(doc, 'cp'));
    assert.equal(doc.querySelector('.form-error').hidden, true);
  });

  test('an email that already has an account is shown under the email box', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    fakeCloud(w, { fail: 'auth/email-already-in-use' });
    openForm(L, doc, '#cloudUp');
    fill(doc, { ce: 'me@example.com', cp: 'secret123', cp2: 'secret123' });
    doc.querySelector('#cgo').click(); await tick();
    assert.ok(red(doc, 'ce'));
    assert.match(errText(doc, 'ce'), /already an account/);
  });

  test('the eye button shows and hides the password', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    fakeCloud(w);
    openForm(L, doc, '#cloudIn');
    const eye = doc.querySelector('[data-eye="cp"]');
    eye.click();
    assert.equal(doc.querySelector('#cp').type, 'text');
    assert.equal(eye.getAttribute('aria-pressed'), 'true');
    eye.click();
    assert.equal(doc.querySelector('#cp').type, 'password');
  });

  test('forgot password sends a reset email and says so without telling if the account exists', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w);
    openForm(L, doc, '#cloudIn');
    doc.querySelector('#cforgot').click();
    assert.equal(calls.length, 0);
    assert.ok(red(doc, 'ce'));
    fill(doc, { ce: 'me@example.com' });
    doc.querySelector('#cforgot').click(); await tick();
    assert.deepEqual(calls[0], ['reset', 'me@example.com']);
    assert.match(doc.querySelector('.form-error.ok').textContent, /If me@example.com has an account/);
  });

  test('an unconfirmed email can be confirmed or the link sent again', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w, { signedIn: true, verified: false });
    L.ui.view = 'settings'; L.render();
    assert.match(doc.body.textContent, /email not confirmed yet/);
    doc.querySelector('#cloudResend').click(); await tick();
    doc.querySelector('#cloudCheck').click(); await tick();
    assert.deepEqual(calls.map((c) => c[0]), ['verify', 'refresh']);
    assert.doesNotMatch(doc.body.textContent, /email not confirmed yet/);
  });

  test('signing out keeps all the data on this device', async (t) => {
    const { L, S, w, doc, add, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w, { signedIn: true });
    add({ type: 'expense', amount: 100, date: '2026-10-07' });
    L.ui.view = 'settings'; L.render();
    doc.querySelector('#cloudOut').click(); await tick();
    assert.deepEqual(calls[0], ['signOut']);
    assert.equal(S.transactions.length, 1);
    assert.ok(doc.querySelector('#cloudUp'), 'shows the sign-in buttons again');
  });

  test('deleting the account asks for the password first, and a wrong one is marked red', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w, { signedIn: true, fail: 'auth/invalid-credential' });
    L.ui.view = 'settings'; L.render();
    doc.querySelector('#cloudDel').click();
    doc.querySelector('#dgo').click();
    assert.equal(calls.length, 0);
    assert.ok(red(doc, 'dp'));
    fill(doc, { dp: 'wrong123' });
    doc.querySelector('#dgo').click(); await tick();
    assert.deepEqual(calls[0], ['delete', 'wrong123']);
    assert.equal(errText(doc, 'dp'), 'Wrong password.');
  });
});

describe('sync screens', () => {
  test('the welcome screen offers "Sign in" for people who already use the app elsewhere', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    fakeCloud(w);
    L.state.settings.onboarded = false; L.render();
    doc.querySelector('#wSignIn').click();
    assert.match(doc.querySelector('#overlay h2').textContent, /Sign in/);
  });

  test('Settings shows how syncing is going', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { c } = fakeCloud(w, { signedIn: true });
    c.info = () => ({ status: 'ready', signedIn: true, email: 'me@example.com', verified: true, sync: { state: 'offline' } });
    L.ui.view = 'settings'; L.render();
    assert.match(doc.body.textContent, /Waiting for internet/);
    c.info = () => ({ status: 'ready', signedIn: true, email: 'me@example.com', verified: true, sync: { state: 'error', error: { code: 'permission-denied' } } });
    L.render();
    assert.match(doc.querySelector('.sync-line.bad').textContent, /permission-denied/);
  });

  test('"Erase all data" warns that it also erases the account when signed in', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    fakeCloud(w, { signedIn: true });
    L.ui.view = 'settings'; L.render();
    doc.querySelector('#reset').click();
    assert.match(doc.querySelector('#overlay').textContent, /also from your other devices/);
  });

  test('asking to add another account’s data: yes, no, and closing the box (= no)', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    fakeCloud(w, { signedIn: true });
    let p = L.confirmMerge(); doc.querySelector('#mYes').click();
    assert.equal(await p, true);
    p = L.confirmMerge(); doc.querySelector('#mNo').click();
    assert.equal(await p, false);
    p = L.confirmMerge(); doc.querySelector('[data-close]').click();
    assert.equal(await p, false);
    assert.equal(doc.querySelector('#overlay'), null);
  });
});

describe('fixes from the bug review', () => {
  test('moving a scheduled payment back to a date already posted does not post it twice', (t) => {
    const { L, S, cash, expenseCat, close } = makeApp(); t.after(close);
    S.recurring.push({ id: 'r1', type: 'expense', amount: 900, note: 'Rent', categoryId: expenseCat('Rent').id, frequency: 'monthly', nextDate: '2026-10-01', anchorDay: 1, accountId: cash.id, active: true });
    L.postDueRecurring();
    S.recurring[0].nextDate = '2026-10-01'; // moved back
    L.postDueRecurring();
    assert.deepEqual([...S.transactions.map((x) => x.id)], ['r1-2026-10-01']);
    assert.equal(S.recurring[0].nextDate, '2026-11-01');
  });

  test('a payment the app posted is marked, and editing it removes the mark', (t) => {
    const { L, S, doc, cash, expenseCat, close } = makeApp(); t.after(close);
    S.recurring.push({ id: 'r1', type: 'expense', amount: 900, note: 'Rent', categoryId: expenseCat('Rent').id, frequency: 'monthly', nextDate: '2026-10-01', anchorDay: 1, accountId: cash.id, active: true });
    L.postDueRecurring();
    assert.equal(S.transactions[0].auto, true);
    L.txForm(S.transactions[0]);
    doc.querySelector('#fSave').click();
    assert.equal(S.transactions[0].auto, undefined);
    assert.equal(S.transactions[0].recurringId, 'r1');
  });

  test('a sync status change does not wipe what someone is typing', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { c } = fakeCloud(w, { signedIn: true });
    let sync = { state: 'syncing' };
    c.info = () => ({ status: 'ready', signedIn: true, email: 'me@example.com', verified: true, sync });
    L.ui.view = 'settings'; L.render();
    L.onCloudChange(); // the first call just notes who is signed in
    const name = doc.querySelector('#sName');
    name.focus(); name.value = 'Half typed';
    sync = { state: 'synced', lastSynced: Date.now() };
    L.onCloudChange();
    assert.equal(doc.querySelector('#sName'), name, 'the same box, not redrawn');
    assert.equal(name.value, 'Half typed');
    assert.match(doc.querySelector('.sync-line').textContent, /Synced/);
  });

  test('data from another device waits until the person stops typing', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'settings'; L.render();
    const name = doc.querySelector('#sName');
    name.focus(); name.value = 'Half typed';
    L.renderSoon();
    assert.equal(doc.querySelector('#sName'), name, 'not redrawn while typing');
    assert.equal(name.value, 'Half typed');
  });
});

describe('home page: today first', () => {
  test('without a weekly limit: this week is the big number, with today’s income and expenses in two boxes', (t) => {
    const { L, S, doc, add, expenseCat, incomeCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 650, date: '2026-10-07', categoryId: expenseCat('Food').id });
    add({ type: 'expense', amount: 100, date: '2026-10-05', categoryId: expenseCat('Food').id });
    add({ type: 'income', amount: 2500, date: '2026-10-07', categoryId: incomeCat().id });
    L.render();
    assert.match(doc.querySelector('.runway-lead .label').textContent, /Spent this week/);
    assert.match(doc.querySelector('.runway-lead .big').textContent, /^Rs750\.00$/);
    const minis = [...doc.querySelectorAll('.mini')].map((m) => m.textContent.replace(/\s+/g, ' ').trim());
    assert.deepEqual(minis, ['Income today+Rs2,500.00', 'Expenses todayRs650.00']); // label, then the number
    assert.match(doc.querySelector('#setBudget').textContent, /Set a weekly limit/);
    assert.match(doc.querySelector('.home-head p').textContent, /^Wednesday, 7 October$/);
  });

  test('with a weekly limit: what is left today is the big number', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close);
    S.settings.weeklyBudget = 7000; // Wednesday: 5 days left, so 1,400 a day
    add({ type: 'expense', amount: 400, date: '2026-10-07', categoryId: expenseCat('Food').id });
    L.render();
    assert.match(doc.querySelector('.runway-lead .label').textContent, /Left to spend today/);
    assert.match(doc.querySelector('.runway-lead .big').textContent, /^Rs1,000\.00$/);
    assert.match(doc.querySelector('.runway-note').textContent, /6,600 left this week/);
  });

  test('days without spending show no "0" above their bar', (t) => {
    const { L, doc, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 650, date: '2026-10-07', categoryId: expenseCat('Food').id });
    L.render();
    const labels = [...doc.querySelectorAll('.day .amt')].map((a) => a.textContent.trim());
    assert.deepEqual(labels.slice(0, 3), ['', '', 'Rs650']); // Mon, Tue empty; Wed (today) 650
  });
});

describe('weekly limit box', () => {
  test('typing numbers is not blocked, and Enter saves', (t) => {
    const { L, S, w, doc, close } = makeApp(); t.after(close);
    L.render();
    doc.querySelector('#setBudget').click();
    const box = doc.querySelector('#wb');
    const digit = new w.KeyboardEvent('keydown', { key: '5', bubbles: true, cancelable: true });
    box.dispatchEvent(digit);
    assert.equal(digit.defaultPrevented, false, 'a digit key must not be cancelled');
    box.value = '5000';
    box.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert.equal(S.settings.weeklyBudget, 5000);
    assert.equal(doc.querySelector('#overlay'), null);
  });
});

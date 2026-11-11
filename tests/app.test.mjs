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
  L.state.settings.startedOn = '2026-01-01'; // using the app for months (tests of a first week set their own date)
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

  test('a day under its share stays under after midnight (it was turning red on the next day)', (t) => {
    // Thursday 8 Oct: nothing spent Mon-Wed, so Thursday's share is 7000 / 4 = 1750. Spend 1500 = under.
    for (const now of ['2026-10-08T20:00:00', '2026-10-09T09:00:00']) { // Thursday evening, then Friday morning
      const { L, S, doc, add, expenseCat, close } = makeApp(now); t.after(close);
      S.settings.weeklyBudget = 7000;
      add({ type: 'expense', amount: 1500, date: '2026-10-08', categoryId: expenseCat('Food').id });
      const thu = L.weekInfo().days[3];
      assert.equal(thu.share, 1750, now);                 // the same share on both days, not 7000 / 7 = 1000
      L.ui.view = 'dashboard'; L.render();
      assert.equal(doc.querySelectorAll('.day .fill.over').length, 0, now);
      assert.match(doc.querySelectorAll('.day')[3].getAttribute('data-tip'), /Daily share Rs\s?1,750/, now);
    }
  });

  test('once the weekly limit is used up: Rs 0 left today, a red "over this week" badge, and no lines for the rest of the week', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close); // Wed 7 Oct, week Mon 5 - Sun 11
    S.settings.weeklyBudget = 5000;
    const food = expenseCat('Food').id;
    add({ type: 'expense', amount: 3000, date: '2026-10-05', categoryId: food });
    add({ type: 'expense', amount: 2500, date: '2026-10-06', categoryId: food }); // limit used up on Tuesday
    add({ type: 'expense', amount: 400, date: '2026-10-07', categoryId: food });
    L.ui.view = 'dashboard'; L.render();
    assert.match(doc.querySelector('.runway-lead .label').textContent, /Left to spend today/);
    assert.match(doc.querySelector('.runway-lead .big').textContent, /^Rs\s?0\.00$/);
    assert.match(doc.querySelector('.over-badge').textContent, /Rs\s?900 over this week/);
    assert.match(doc.querySelector('.runway-lead').textContent, /Your limit resets on Monday/);
    const days = [...doc.querySelectorAll('.day')];
    for (const d of days.slice(3)) { // Thu-Sun
      assert.equal(d.querySelector('.allow'), null);
      assert.equal(d.querySelector('.share').textContent.trim(), '–');
      assert.match(d.getAttribute('data-tip'), /Weekly limit used up/);
    }
    assert.ok(days[0].querySelector('.allow'), 'past days keep their line');
  });

  test('over today’s share (week not used up): Rs 0 left today and a red "over today" badge; none when under', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close);
    S.settings.weeklyBudget = 7000; // Wednesday: 1,400 a day
    add({ type: 'expense', amount: 2000, date: '2026-10-07', categoryId: expenseCat('Food').id });
    L.ui.view = 'dashboard'; L.render();
    assert.match(doc.querySelector('.runway-lead .big').textContent, /^Rs\s?0\.00$/);
    assert.match(doc.querySelector('.over-badge').textContent, /Rs\s?600 over today/);
    assert.equal(doc.querySelector('.reset-note'), null);
    S.transactions[0].amount = 400; L.render();
    assert.equal(doc.querySelector('.over-badge'), null);
  });

  test('bar numbers: spent always on top, the day’s share always under the day name', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close);
    S.settings.weeklyBudget = 7000;
    add({ type: 'expense', amount: 500, date: '2026-10-05', categoryId: expenseCat('Food').id });
    L.ui.view = 'dashboard'; L.render();
    const days = [...doc.querySelectorAll('.day')];
    assert.match(days[0].querySelector('.amt').textContent, /500/);       // Mon: spent
    assert.match(days[0].querySelector('.share').textContent, /1,000/);   // Mon: its share 7000 / 7
    assert.equal(days[5].querySelector('.amt').textContent.trim(), '');   // Sat (future): nothing spent, empty top
    assert.ok(days[5].querySelector('.share').textContent.trim() !== '', 'future day shows its share under the name');
  });

  test('past days with nothing spent have no dashed line, but still show their share under the day', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close); // Wed 7 Oct
    S.settings.weeklyBudget = 6000;
    add({ type: 'expense', amount: 2000, date: '2026-10-07', categoryId: expenseCat('Food').id }); // only today
    L.ui.view = 'dashboard'; L.render();
    const days = [...doc.querySelectorAll('.day')];
    for (const d of days.slice(0, 2)) { // Mon, Tue: nothing spent
      assert.equal(d.querySelector('.allow'), null);
      assert.notEqual(d.querySelector('.share').textContent.trim(), '–');
    }
    assert.ok(days[2].querySelector('.allow'), 'today keeps its line');
    assert.ok(days[3].querySelector('.allow'), 'future days keep their line');
  });

  test('an expense dated later this week is planned, not spent: no "over" badge, but the coming days keep it aside', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close); // Wed 7 Oct
    S.settings.weeklyBudget = 6000;
    const food = expenseCat('Food').id;
    add({ type: 'expense', amount: 1750, date: '2026-10-06', categoryId: food });
    add({ type: 'expense', amount: 2000, date: '2026-10-07', categoryId: food });
    add({ type: 'expense', amount: 2500, date: '2026-10-10', categoryId: food }); // Saturday, not happened yet
    const w = L.weekInfo();
    assert.equal(w.spent, 3750);
    assert.equal(w.planned, 2500);
    assert.equal(w.remaining, 2250);                 // 6000 - 3750 actually spent
    assert.equal(w.perDayAfter, 0);                  // 2250 left - 2500 planned: nothing more for the coming days
    L.ui.view = 'dashboard'; L.render();
    assert.match(doc.querySelector('.over-badge').textContent, /over today/); // over today's share, not "over this week"
    assert.match(doc.querySelector('.stats').textContent, /Spent in Oct\s*Rs\s?3,750\.00/);
    assert.match(doc.querySelector('.runway-note').textContent, /Rs\s?2,500\s*planned later this week/);
  });

  test('first week, started on Thursday: no share before, limit cut to the days left, normal daily amount', (t) => {
    const { L, S, doc, close } = makeApp('2026-10-08T10:00:00'); t.after(close); // Thursday 8 Oct; week Mon 5 - Sun 11
    S.settings.startedOn = '2026-10-08';
    S.settings.weeklyBudget = 7000;
    const w = L.weekInfo();
    assert.equal(w.firstIdx, 3);
    assert.equal(w.B, 4000);                    // 7000 x 4/7
    assert.equal(w.allowanceToday, 1000);       // the normal 7000 / 7, not 7000 / 4
    assert.ok(w.days.slice(0, 3).every((d) => d.beforeStart && d.share === 0));
    L.ui.view = 'dashboard'; L.render();
    const days = [...doc.querySelectorAll('.day')];
    assert.equal(days[0].querySelector('.allow'), null);
    assert.match(days[0].getAttribute('data-tip'), /Before you started/);
    assert.match(doc.querySelector('.runway-note').textContent, /First week:\s*Rs\s?4,000\s*limit, from Thursday/);
    assert.match(doc.querySelector('#setBudget').textContent, /Rs\s?7,000/); // the full limit is still the setting
    // The next week is a full week.
    assert.equal(L.weekInfo('2026-10-12').B, 7000);
  });

  test('an older entry backdated before the start date counts as the start', (t) => {
    const { L, S, add, expenseCat, close } = makeApp('2026-10-08T10:00:00'); t.after(close);
    S.settings.startedOn = '2026-10-08';
    S.settings.weeklyBudget = 7000;
    add({ type: 'expense', amount: 100, date: '2026-10-05', categoryId: expenseCat('Food').id }); // Monday
    assert.equal(L.weekInfo().firstIdx, 0);
    assert.equal(L.weekInfo().B, 7000);
  });

  test('a tiny share keeps its dashed line a little above the bottom edge', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close);
    S.settings.weeklyBudget = 5000;
    add({ type: 'expense', amount: 4900, date: '2026-10-05', categoryId: expenseCat('Food').id }); // 100 left for 5 days
    L.ui.view = 'dashboard'; L.render();
    const today = doc.querySelectorAll('.day')[2];
    assert.equal(today.querySelector('.allow').style.bottom, '5%');
  });

  test('every day keeps the share it had: what was left of the limit / days left then', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close); // Wed 7 Oct
    S.settings.weeklyBudget = 7000;
    const food = expenseCat('Food').id;
    add({ type: 'expense', amount: 1000, date: '2026-10-05', categoryId: food }); // Mon
    add({ type: 'expense', amount: 2000, date: '2026-10-06', categoryId: food }); // Tue (over its share)
    const shares = L.weekInfo().days.map((d) => Math.round(d.share));
    assert.equal(shares.slice(0, 3).join(), '1000,1000,800'); // Mon 7000/7, Tue 6000/6, Wed (today) 4000/5
    assert.equal(L.weekInfo().days[2].share, L.weekInfo().allowanceToday);
  });

  test('an expense dated later this week shows on that day as planned, and does not change the pace', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close); // Wed 7 Oct
    S.settings.weeklyBudget = 7000;
    const food = expenseCat('Food').id;
    add({ type: 'expense', amount: 300, date: '2026-10-07', categoryId: food });  // today
    add({ type: 'expense', amount: 2500, date: '2026-10-10', categoryId: food }); // Saturday, dated ahead
    L.ui.view = 'dashboard'; L.render();
    const sat = doc.querySelectorAll('.day')[5];
    assert.ok(sat.querySelector('.fill.planned'), 'Saturday shows a planned bar');
    assert.equal(sat.querySelector('.fill.over'), null);           // never red: its share is on top of what is planned
    assert.match(sat.querySelector('.amt').textContent, /2,500/);
    assert.match(sat.getAttribute('data-tip'), /Already planned/);
    // Pace: 300 spent over Mon-Wed (3 days) -> 700 for the week, not (300 + 2500) / 3 * 7.
    assert.match(doc.querySelector('.runway-note').textContent, /On pace for\s*Rs\s?700/);
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

  test('the welcome form fills in the starting balances on a new device', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.settings.onboarded = false; L.render();
    doc.querySelector('#wName').value = 'Kezara'; doc.querySelector('#wCash').value = '1500'; doc.querySelector('#wBank').value = '5000';
    doc.querySelector('#wGo').click();
    assert.equal(L.state.accounts[0].initial, 1500);
    assert.equal(L.state.accounts[1].initial, 5000);
    assert.equal(L.state.settings.name, 'Kezara');
  });

  test('signing in from the welcome screen: Get started never overwrites the synced accounts', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.settings.onboarded = false; L.render();
    // the account's real data arrives from the cloud while the welcome screen is still open
    const synced = L.defaultState();
    Object.assign(synced.settings, { onboarded: true, name: 'Banda', weeklyBudget: 4000 });
    synced.accounts[1].initial = 9656.95;
    L.state = synced;
    doc.querySelector('#wName').value = 'Someone'; doc.querySelector('#wBank').value = '5000'; doc.querySelector('#wLimit').value = '';
    doc.querySelector('#wGo').click();
    assert.equal(L.state.accounts[1].initial, 9656.95, 'the bank balance is kept');
    assert.equal(L.state.settings.name, 'Banda');
    assert.equal(L.state.settings.weeklyBudget, 4000);
    assert.ok(!doc.querySelector('#wGo'), 'the app opens');
  });

  test('the colour theme picker in Settings changes the app colours and remembers the choice', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'settings'; L.render();
    assert.equal(doc.querySelector('[data-pal="forest"]').getAttribute('aria-checked'), 'true', 'Forest is the default');
    doc.querySelector('[data-pal="navy"]').click();
    assert.equal(S.settings.palette, 'navy');
    assert.equal(doc.documentElement.getAttribute('data-palette'), 'navy');
    assert.equal(doc.querySelector('[data-pal="navy"]').getAttribute('aria-checked'), 'true');
    doc.querySelector('[data-pal="forest"]').click();
    assert.equal(doc.documentElement.hasAttribute('data-palette'), false, 'Forest uses the original colours');
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

  test('the button says "Update" and runs the action it was given', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    let clicked = 0;
    L.showUpdateBanner({ text: 'Version 1.9.3 is on Google Play.', onUpdate: () => clicked++ });
    assert.equal(doc.querySelector('#updNow').textContent, 'Update');
    assert.match(doc.querySelector('.update-banner').textContent, /Update available/);
    assert.match(doc.querySelector('.update-banner').textContent, /1\.9\.3 is on Google Play/);
    doc.querySelector('#updNow').click();
    assert.equal(clicked, 1);
  });

  test('Play Store version codes turn back into version names', (t) => {
    const { L, close } = makeApp(); t.after(close);
    assert.equal(L.versionFromCode(10903), '1.9.3');
    assert.equal(L.versionFromCode(21000), '2.10.0');
  });
});

/* ------------------------------------------------- Play Store update */
describe('Play Store update card (phone app)', () => {
  // A fake phone: Capacitor says "native", and the AppUpdate plugin answers with `info`.
  const fakePhone = (w, info, opened = []) => {
    w.Capacitor = { isNativePlatform: () => true, Plugins: { AppUpdate: {
      getAppUpdateInfo: async () => { if (info instanceof Error) throw info; return info; },
      openAppStore: async () => { opened.push(true); },
    } } };
  };

  test('shows the card with the new version when Play has an update, and Update opens the store', async (t) => {
    const { w, L, doc, close } = makeApp(); t.after(close);
    const opened = [];
    fakePhone(w, { updateAvailability: 2, availableVersionCode: 10903 }, opened);
    await L.checkPlayUpdate();
    assert.match(doc.querySelector('.update-banner').textContent, /Version 1\.9\.3 is on Google Play/);
    doc.querySelector('#updNow').click();
    assert.equal(opened.length, 1);
  });

  test('no card when the app is up to date, when Play cannot be reached, or on the web', async (t) => {
    const { w, L, doc, close } = makeApp(); t.after(close);
    fakePhone(w, { updateAvailability: 1, availableVersionCode: 10902 }); // 1 = UPDATE_NOT_AVAILABLE
    await L.checkPlayUpdate();
    fakePhone(w, new Error('offline'));
    await L.checkPlayUpdate();
    delete w.Capacitor; // web version
    await L.checkPlayUpdate();
    assert.equal(doc.querySelector('.update-banner'), null);
  });
});

/* ------------------------------------------ transactions: Upcoming */
describe('transactions dated after today', () => {
  test('they are listed first under "Upcoming", soonest first, and not in the totals', (t) => {
    const { L, doc, add, expenseCat, close } = makeApp(); t.after(close); // Wed 7 Oct
    const food = expenseCat('Food').id;
    add({ type: 'expense', amount: 300, date: '2026-10-06', categoryId: food, note: 'Yesterday lunch' });
    add({ type: 'expense', amount: 9000, date: '2026-10-20', categoryId: food, note: 'Rent later' });
    add({ type: 'expense', amount: 2500, date: '2026-10-10', categoryId: food, note: 'Phone bill' });
    L.ui.view = 'transactions'; L.render();
    const up = doc.querySelector('.tx-upcoming');
    assert.ok(up, 'there is an Upcoming section');
    const upNotes = [...up.querySelectorAll('.tx .t1')].map((x) => x.textContent);
    assert.equal(upNotes.join('|'), 'Phone bill|Rent later');               // soonest first
    assert.doesNotMatch(up.textContent, /Yesterday lunch/);
    assert.match(doc.querySelector('.summary-bar').textContent, /Expenses\s*Rs\s?300\.00/); // only what has happened
  });
});

describe('tap a transaction to edit it', () => {
  test('tapping the row (or Enter on it) opens the edit window, and Delete there removes it', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 450, date: '2026-10-07', categoryId: expenseCat('Food').id, note: 'Lunch' });
    L.ui.view = 'transactions'; L.render();
    const row = doc.querySelector('[data-edit-row]');
    row.querySelector('.t2').click();                          // anywhere on the row
    assert.match(doc.querySelector('#overlay h2').textContent, /Edit/);
    assert.equal(doc.querySelector('#fAmount').value, '450');
    doc.querySelector('[data-close]').click();
    doc.querySelector('[data-edit-row]').onkeydown({ key: 'Enter', target: doc.querySelector('[data-edit-row]'), preventDefault() {} });
    assert.ok(doc.querySelector('#overlay'));
    doc.querySelector('#fDel').click();
    assert.equal(S.transactions.length, 0);
  });
});

describe('budgets: tap a budget to edit or delete it', () => {
  test('the row opens the edit window; Delete there removes it, with Undo', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.budgets.push({ id: 'b1', categoryId: S.categories.find((c) => c.type === 'expense').id, amount: 9000, period: 'monthly' });
    L.ui.view = 'budgets'; L.render();
    doc.querySelector('[data-edit-row-budget="b1"] .bar').click();
    assert.match(doc.querySelector('#overlay h2').textContent, /Edit budget/);
    doc.querySelector('#bDel').click();
    assert.equal(S.budgets.length, 0);
    doc.querySelector('.toast button').click(); // Undo
    assert.equal(S.budgets.length, 1);
  });
});

/* ------------------------------------------------- settings controls */
describe('settings page controls', () => {
  test('week start and mode are buttons; cents is a switch', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'settings'; L.render();
    doc.querySelector('[data-week="0"]').click();
    assert.equal(S.settings.weekStart, 0);
    assert.equal(doc.querySelector('[data-week="0"]').getAttribute('aria-checked'), 'true');
    doc.querySelector('[data-mode="dark"]').click();
    assert.equal(S.settings.theme, 'dark');
    const cents = doc.querySelector('#sDec');
    assert.ok(cents.classList.contains('switch'));
    cents.checked = false; cents.onchange({ target: cents });
    assert.equal(S.settings.decimals, false);
  });
});

/* ------------------------------------------- accounts below zero */
describe('spending more than an account holds', () => {
  const openExpense = (L, doc, amount) => {
    L.txForm({ type: 'expense' });
    doc.querySelector('#fAmount').value = String(amount);
    doc.querySelector('#fSave').click();
  };

  test('warns in the form; "Go back" saves nothing, "Save anyway" saves', (t) => {
    const { L, S, doc, cash, close } = makeApp(); t.after(close);
    cash.initial = 500;
    openExpense(L, doc, 800);
    assert.equal(S.transactions.length, 0);
    assert.match(doc.querySelector('#negWarn').textContent, /This takes Cash to\s*−Rs\s?300\.00/);
    doc.querySelector('#negBack').click();
    assert.equal(doc.querySelector('#negWarn'), null);
    assert.equal(S.transactions.length, 0);
    doc.querySelector('#fSave').click();
    doc.querySelector('#negOk').click();
    assert.equal(S.transactions.length, 1);
    assert.equal(L.accountBalance(cash), -300);
  });

  test('no warning when the account has enough, or can go below zero (credit card)', (t) => {
    const { L, S, doc, cash, close } = makeApp(); t.after(close);
    cash.initial = 1000;
    openExpense(L, doc, 800);
    assert.equal(S.transactions.length, 1);
    cash.credit = true;
    openExpense(L, doc, 5000);
    assert.equal(doc.querySelector('#negWarn'), null);
    assert.equal(S.transactions.length, 2);
  });

  test('editing: lowering an expense on an account that is already below zero does not warn', (t) => {
    const { L, S, doc, cash, add, expenseCat, close } = makeApp(); t.after(close);
    const tx = add({ type: 'expense', amount: 900, date: '2026-10-07', categoryId: expenseCat('Food').id }); // Cash: -900
    L.txForm(tx);
    doc.querySelector('#fAmount').value = '400';
    doc.querySelector('#fSave').click();
    assert.equal(doc.querySelector('#negWarn'), null);
    assert.equal(S.transactions[0].amount, 400);
  });
});

/* ------------------------------------------ transactions: Filters button */
describe('transactions filters (phones fold them behind a Filters button)', () => {
  test('the button opens and closes the filters, counts the changed ones, and Reset puts them back', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'transactions'; L.render();
    const more = () => doc.querySelector('#fMore');
    assert.ok(!more().classList.contains('open'));
    assert.equal(doc.querySelector('.filter-count'), null);         // nothing changed: no number
    doc.querySelector('#fToggle').click();
    assert.ok(more().classList.contains('open'));
    assert.equal(doc.querySelector('#fToggle').getAttribute('aria-expanded'), 'true');
    const type = doc.querySelector('#ftype'); type.value = 'income'; type.onchange({ target: type });
    const period = doc.querySelector('#fperiod'); period.value = 'all'; period.onchange({ target: period });
    assert.equal(doc.querySelector('.filter-count').textContent, '2');
    doc.querySelector('#fReset').click();
    assert.equal(L.ui.tx.type, 'all');
    assert.equal(L.ui.tx.period, 'month');
    assert.equal(doc.querySelector('.filter-count'), null);
  });
});

/* ------------------------------------------- home page accounts strip */
describe('accounts on the home page', () => {
  test('each account shows with its balance, and tapping one opens Accounts', (t) => {
    const { L, S, doc, add, expenseCat, cash, close } = makeApp(); t.after(close);
    S.accounts.push({ id: 'card', name: 'A very long credit card account name', color: '#4a3aa7', initial: -1200 });
    add({ type: 'expense', amount: 300, date: '2026-10-07', categoryId: expenseCat('Food').id, accountId: cash.id });
    L.ui.view = 'dashboard'; L.render();
    const tiles = doc.querySelectorAll('.acc-strip .acc-tile');
    assert.equal(tiles.length, S.accounts.length);
    assert.match(tiles[2].textContent, /A very long credit card account name/);
    assert.ok(tiles[2].querySelector('.acc-bal.neg'), 'a negative balance is red');
    tiles[0].click();
    assert.equal(L.ui.view, 'accounts');
  });

  test('with only one account there is no strip (the total says it all)', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.accounts.splice(1);
    L.ui.view = 'dashboard'; L.render();
    assert.equal(doc.querySelector('.acc-strip'), null);
  });
});

/* ------------------------------------------------ phone notifications */
describe('phone notifications (Android app)', () => {
  // Today in the tests is Wednesday 7 Oct 2026, 10:00. The week is Mon 5 - Sun 11 Oct.
  // Every switch off, then the ones a test turns on (a new install starts with all of them on).
  const on = (S, o) => { S.settings.notify = { ...S.settings.notify, daily: false, bills: false, limit: false, summary: false, ...o }; };
  const when = (x) => `${x.at.getFullYear()}-${String(x.at.getMonth() + 1).padStart(2, '0')}-${String(x.at.getDate()).padStart(2, '0')} ${String(x.at.getHours()).padStart(2, '0')}:${String(x.at.getMinutes()).padStart(2, '0')}`;

  test('a new install starts with every switch on; with all off, nothing is planned', (t) => {
    const { L, S, close } = makeApp(); t.after(close);
    const n = S.settings.notify;
    assert.deepEqual([n.daily, n.bills, n.limit, n.summary], [true, true, true, true]);
    on(S, {});
    assert.equal(L.planNotifications().length, 0);
  });

  test('after the welcome screen the phone asks for permission; a no turns every switch off', async (t) => {
    for (const answer of ['granted', 'denied']) {
      const { w, L, S, close } = makeApp(); t.after(close);
      w.Capacitor = { isNativePlatform: () => true, Plugins: { LocalNotifications: {
        checkPermissions: async () => ({ display: 'prompt' }), requestPermissions: async () => ({ display: answer }),
        getPending: async () => ({ notifications: [] }), cancel: async () => {}, schedule: async () => {},
      } } };
      await L.firstRunNotifications();
      const n = S.settings.notify;
      assert.deepEqual([n.daily, n.bills, n.limit, n.summary], answer === 'granted' ? [true, true, true, true] : [false, false, false, false]);
    }
  });

  test('daily reminder: 7 evenings at the chosen time, but not tonight if something was added today', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    on(S, { daily: true, dailyTime: '21:30' });
    let plan = L.planNotifications();
    assert.equal(plan.length, 7);
    assert.equal(when(plan[0]), '2026-10-07 21:30');
    add({ type: 'expense', amount: 200, date: '2026-10-07', categoryId: expenseCat('Food').id });
    plan = L.planNotifications();
    assert.equal(plan.length, 6);
    assert.equal(when(plan[0]), '2026-10-08 21:30');
  });

  test('payment due tomorrow: the morning before each scheduled payment in the next week', (t) => {
    const { L, S, cash, expenseCat, close } = makeApp(); t.after(close);
    on(S, { bills: true });
    S.recurring.push({ id: 'r1', type: 'expense', amount: 18000, note: 'Rent', categoryId: expenseCat('Rent').id,
      frequency: 'monthly', nextDate: '2026-10-10', anchorDay: 10, accountId: cash.id, active: true });
    S.recurring.push({ id: 'r2', type: 'expense', amount: 500, note: 'Paused gym', categoryId: expenseCat('Health').id,
      frequency: 'monthly', nextDate: '2026-10-09', anchorDay: 9, accountId: cash.id, active: false });
    const plan = L.planNotifications();
    assert.equal(plan.length, 1);
    assert.equal(when(plan[0]), '2026-10-09 09:00');
    assert.equal(plan[0].title, 'Due tomorrow 🗓️');
    assert.match(plan[0].body, /^Rent: Rs\s?18,000\.00$/);
  });

  test('weekly limit warning: the morning after passing 80%, once a week', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    on(S, { limit: true });
    S.settings.weeklyBudget = 7000;
    add({ type: 'expense', amount: 5000, date: '2026-10-06', categoryId: expenseCat('Food').id });
    assert.equal(L.planNotifications().length, 0); // 71%: not yet
    add({ type: 'expense', amount: 1000, date: '2026-10-07', categoryId: expenseCat('Food').id });
    const plan = L.planNotifications();
    assert.equal(when(plan[0]), '2026-10-08 09:00');
    assert.match(plan[0].body, /^Rs\s?1,000 left this week\.$/);
    on(S, { limitWarnAt: '2026-10-07' }); // already shown this week
    assert.equal(L.planNotifications().length, 0);
  });

  test('weekly summary: the last evening of the week', (t) => {
    const { L, S, add, expenseCat, close } = makeApp(); t.after(close);
    on(S, { summary: true });
    S.settings.weeklyBudget = 7000;
    add({ type: 'expense', amount: 2500, date: '2026-10-06', categoryId: expenseCat('Food').id });
    const [x] = L.planNotifications();
    assert.equal(when(x), '2026-10-11 19:00');
    assert.match(x.body, /^Spent Rs\s?2,500, Rs\s?4,500 under limit/);
  });

  test('the Notifications section is only in the phone app; a refused permission leaves the switch off', async (t) => {
    const { w, L, S, doc, close } = makeApp(); t.after(close);
    on(S, {});
    L.ui.view = 'settings'; L.render();
    assert.ok(!/Notifications/.test(doc.querySelector('#root').textContent), 'not on the web');
    w.Capacitor = { isNativePlatform: () => true, Plugins: { LocalNotifications: {
      checkPermissions: async () => ({ display: 'prompt' }), requestPermissions: async () => ({ display: 'denied' }),
    } } };
    L.render();
    const box = doc.querySelector('[data-notify="daily"]');
    assert.ok(box, 'shown in the phone app');
    box.checked = true; box.onchange();
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(box.checked, false);
    assert.equal(S.settings.notify.daily, false);
  });
});

/* --------------------------------------------- round + while scrolling */
describe('round + button while scrolling (phones)', () => {
  test('hides on scrolling down, comes back on scrolling up and near the top, stays while its menu is open', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'dashboard'; L.render();
    const main = doc.querySelector('.main'), wrap = () => doc.querySelector('#fabWrap');
    const scrollTo = (y) => { main.scrollTop = y; L.fabOnScroll({ get scrollTop() { return y; } }); };
    scrollTo(0); scrollTo(300);
    assert.ok(wrap().classList.contains('fab-hide'), 'hidden after scrolling down');
    scrollTo(200);
    assert.ok(!wrap().classList.contains('fab-hide'), 'back after scrolling up');
    scrollTo(500); scrollTo(20);
    assert.ok(!wrap().classList.contains('fab-hide'), 'back near the top');
    wrap().classList.add('open'); scrollTo(400);
    assert.ok(!wrap().classList.contains('fab-hide'), 'not hidden while the quick actions are open');
  });
});

/* ------------------------------------------------ chart day labels */
describe('bar chart labels', () => {
  test('the scale uses round steps (0, 10k, 20k ... 50k), not 13k, 25k, 38k', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const svg = L.drawBarChart([{ label: 'Oct', values: [{ v: 45000, cls: 'x', name: 'x' }] }], { width: 330 });
    const ticks = [...svg.matchAll(/<text class="axis"[^>]*text-anchor="end">([^<]+)</g)].map((m) => m[1]).join(',');
    assert.match(ticks, /^Rs\s?0,Rs\s?10k,Rs\s?20k,Rs\s?30k,Rs\s?40k,Rs\s?50k$/);
  });

  test('on a phone-width chart every weekday and month has its label', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const groups = (labels) => labels.map((label) => ({ label, values: [{ v: 1, cls: 'x', name: 'x' }] }));
    const labels = (svg) => [...svg.matchAll(/<text class="axis"[^>]*text-anchor="middle">([^<]+)</g)].map((m) => m[1]).join(',');
    assert.equal(labels(L.drawBarChart(groups(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']), { width: 330 })), 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
    assert.equal(labels(L.drawBarChart(groups(['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']), { width: 330 })), 'Jun,Jul,Aug,Sep,Oct,Nov');
    // 31 days on a phone still skips some, so the numbers never run into each other
    const many = labels(L.drawBarChart(groups(Array.from({ length: 31 }, (_, i) => String(i + 1))), { width: 330 })).split(',');
    assert.ok(many.length < 31 && many.length > 8, many.join());
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

  test('signed-in (syncing) users never see the reminder; signed-out users still do', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 10, 30); // a backup is due
    const { c } = fakeCloud(app.w, { signedIn: true });
    app.L.ui.view = 'dashboard'; app.L.render();
    assert.equal(app.doc.querySelector('.alert.backup'), null);
    c.signedIn = false; app.L.render();
    assert.ok(app.doc.querySelector('.alert.backup'), 'shown again after signing out');
  });

  test('no flash on opening: signed in last time means no card, even before the sign-in is restored', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 10, 30);
    const { c } = fakeCloud(app.w, { signedIn: false });
    const info = c.info; c.info = () => ({ ...info(), status: 'loading', remembered: true }); // Firebase still starting
    app.L.ui.view = 'dashboard'; app.L.render();
    assert.equal(app.doc.querySelector('.alert.backup'), null);
  });

  test('Budgets page: over the weekly limit says how much over, not "Rs 0.00 left"', (t) => {
    const app = makeApp(); t.after(app.close);
    app.S.settings.weeklyBudget = 1000;
    app.add({ type: 'expense', amount: 1250, date: '2026-10-06', categoryId: app.expenseCat('Food').id });
    app.L.ui.view = 'budgets'; app.L.render();
    const foot = app.doc.querySelector('.meter-foot').textContent;
    assert.match(foot, /Rs\s?250\.00 over/);
    assert.doesNotMatch(foot, /left/);
  });

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
    synced: true,
    info: () => ({ status: 'ready', signedIn: c.signedIn, email: c.email, verified: c.verified, sync: { state: c.synced ? 'synced' : 'offline' } }),
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
    assert.match(doc.body.textContent, /Your money data is stored only on this device/);
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
    // The form turns into a clear "you're signed in" screen with the email and the sync status; Done closes it.
    assert.match(doc.querySelector('.done-panel').textContent, /You’re signed in/);
    assert.match(doc.querySelector('.done-panel').textContent, /me@example.com/);
    assert.ok(doc.querySelector('.done-panel .sync-line'));
    doc.querySelector('#doneOk').click();
    assert.equal(doc.querySelector('#overlay'), null);
  });

  test('creating an account sends the email and password and shows the "account ready" screen', async (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w);
    openForm(L, doc, '#cloudUp');
    fill(doc, { ce: ' me@example.com ', cp: 'secret123', cp2: 'secret123' });
    doc.querySelector('#cgo').click(); await tick();
    assert.deepEqual(calls[0], ['signUp', 'me@example.com', 'secret123']); // an email box drops the spaces itself
    assert.match(doc.querySelector('.done-panel').textContent, /Your account is ready.*Open it to confirm/s);
    doc.querySelector('#doneOk').click();
    assert.equal(doc.querySelector('#overlay'), null);
    assert.match(doc.body.textContent, /me@example.com/);
    assert.doesNotMatch(doc.body.textContent, /stored only on this device/);
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
    assert.match(doc.querySelector('.modal').textContent, /still on this device/);
    doc.querySelector('.modal [data-close]').click();
    assert.equal(S.transactions.length, 1, '“Keep my data” keeps it');
  });

  test('after signing out, the popup can remove the data from this device', async (t) => {
    const { L, w, doc, add, close } = makeApp(); t.after(close);
    fakeCloud(w, { signedIn: true });
    add({ type: 'expense', amount: 100, date: '2026-10-07' });
    L.ui.view = 'settings'; L.render();
    doc.querySelector('#cloudOut').click(); await tick();
    doc.querySelector('#soWipe').click();
    assert.equal(L.state.transactions.length, 0);
  });

  test('the popup does not offer removing data that has not synced yet', async (t) => {
    const { L, w, doc, add, close } = makeApp(); t.after(close);
    const { c } = fakeCloud(w, { signedIn: true }); c.synced = false;
    add({ type: 'expense', amount: 100, date: '2026-10-07' });
    L.ui.view = 'settings'; L.render();
    doc.querySelector('#cloudOut').click(); await tick();
    assert.equal(doc.querySelector('#soWipe'), null);
    assert.equal(L.state.transactions.length, 1);
  });

  test('“Sign out and remove data” asks first, then signs out and empties this device', async (t) => {
    const { L, w, doc, add, close } = makeApp(); t.after(close);
    const { calls } = fakeCloud(w, { signedIn: true });
    add({ type: 'expense', amount: 100, date: '2026-10-07' });
    L.ui.view = 'settings'; L.render();
    doc.querySelector('#cloudOutWipe').click();
    assert.equal(calls.length, 0, 'nothing happens before confirming');
    doc.querySelector('#okb').click(); await tick();
    assert.deepEqual(calls[0], ['signOut']);
    assert.equal(L.state.transactions.length, 0);
  });

  test('“Sign out and remove data” is refused while changes are still waiting to sync', async (t) => {
    const { L, w, doc, add, close } = makeApp(); t.after(close);
    const { c, calls } = fakeCloud(w, { signedIn: true }); c.synced = false;
    add({ type: 'expense', amount: 100, date: '2026-10-07' });
    L.ui.view = 'settings'; L.render();
    doc.querySelector('#cloudOutWipe').click(); await tick();
    assert.equal(calls.length, 0);
    assert.equal(L.state.transactions.length, 1);
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

/* ------------------------------------------------------ calculator */
describe('calculator', () => {
  test('works out sums, with percentages like a shop calculator', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const c = L.calcEval;
    assert.equal(c('1200+350*2'), 1900);
    assert.equal(c('1000-10%'), 900);
    assert.equal(c('1000+18%'), 1180);
    assert.equal(c('200*15%'), 30);
    assert.equal(c('(450+120)/3'), 190);
    assert.equal(c('(450+120'), 570, 'a forgotten bracket is closed');
    assert.equal(c('1,250 × 2'), 2500);
    assert.equal(c('10÷4'), 2.5);
    assert.equal(c('−50+20'), -30);
    assert.equal(c('12+'), 12, 'a sign left at the end is ignored');
    assert.equal(c('0.1+0.2'), 0.3);
    for (const bad of ['', 'abc', '5/0', '1++*2', 'alert(1)', '2)']) assert.equal(c(bad), null, bad);
  });

  test('a sum typed in the amount box is saved as its answer', async (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.state.accounts.forEach((a) => { a.initial = 100000; }); // money in the accounts, so no below-zero warning
    L.txForm({ type: 'expense' });
    doc.querySelector('#fAmount').value = '1200+350*2';
    doc.querySelector('#fSave').click();
    assert.equal(S.transactions.at(-1).amount, 1900);
  });

  test('pressing Enter in the amount box also uses the answer', (t) => {
    const { L, S, w, doc, close } = makeApp(); t.after(close);
    L.state.accounts.forEach((a) => { a.initial = 100000; }); // money in the accounts, so no below-zero warning
    L.txForm({ type: 'expense' });
    const box = doc.querySelector('#fAmount'); box.value = '100+50';
    box.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.equal(S.transactions.at(-1).amount, 150);
  });

  test('a sum it cannot work out is marked red and nothing is saved', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    const before = S.transactions.length;
    L.txForm({ type: 'expense' });
    doc.querySelector('#fAmount').value = '12+*abc';
    doc.querySelector('#fSave').click();
    assert.equal(S.transactions.length, before);
    assert.equal(doc.querySelector('#fAmount').getAttribute('aria-invalid'), 'true');
  });

  test('the keypad puts its answer into the amount box', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.txForm({ type: 'expense' });
    const box = doc.querySelector('#fAmount');
    L.calcPad(box);
    for (const k of ['1', '2', '0', '0', '+', '3', '5', '0', '×', '2']) doc.querySelector(`#calcPad [data-k="${k}"]`).click();
    assert.match(doc.querySelector('#calcPad .calc-res').textContent, /1,900/);
    doc.querySelector('#calcUse').click();
    assert.equal(box.value, '1900');
    assert.equal(doc.querySelector('#calcPad'), null, 'the keypad closed');
    assert.ok(doc.querySelector('#overlay'), 'the transaction form is still open');
  });

  test('the home page calculator button opens the keypad, and its answer can become an expense', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.state.accounts.forEach((a) => { a.initial = 100000; }); // money in the accounts, so no below-zero warning
    L.ui.view = 'dashboard'; L.render();
    doc.querySelector('[data-calc-pad]').click();
    for (const k of ['5', '0', '0', '+', '2', '5', '0']) doc.querySelector(`#calcPad [data-k="${k}"]`).click();
    doc.querySelector('#calcPad [data-calc-add="expense"]').click();
    assert.equal(doc.querySelector('#calcPad'), null);
    assert.equal(doc.querySelector('#fAmount').value, '750');
    doc.querySelector('#fSave').click();
    assert.equal(S.transactions.at(-1).amount, 750);
  });

  test('the round + button opens the quick actions, and each one does its job', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'dashboard'; L.render();
    const wrap = doc.querySelector('#fabWrap');
    doc.querySelector('#fab').click();
    assert.ok(wrap.classList.contains('open'));
    doc.querySelector('[data-fab="income"]').click();
    assert.ok(!wrap.classList.contains('open'), 'the menu closed');
    assert.ok(doc.querySelector('#typeSeg [data-v="income"].on'), 'the income form opened');
    doc.querySelector('[data-close]').click();
    doc.querySelector('#fab').click(); doc.querySelector('[data-fab="calc"]').click();
    assert.ok(doc.querySelector('#calcPad'));
    L.render(); doc.querySelector('#fab').click(); doc.querySelector('[data-fab-close]').click();
    assert.ok(!doc.querySelector('#fabWrap').classList.contains('open'), 'tapping outside closes it');
  });

  test('money tools give the right answers', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const m = L.toolMath;
    assert.deepEqual({ ...m.discount(2500, 20) }, { off: 500, pay: 2000 });
    assert.deepEqual({ ...m.split(3000, 4, 10) }, { all: 3300, each: 825, extra: 0, last: 825 });
    const loan = m.loan(100000, 12, 12);
    assert.equal(loan.monthly, 8884.88);
    assert.equal(m.loan(1200, 0, 12).monthly, 100, 'no interest: just divided');
    assert.deepEqual({ ...m.saving(10000, 2000, 56) }, { left: 8000, weeks: 8, months: 2, perWeek: 1000, perMonth: 4000 });
  });

  test('money tools add up: split cents, loan totals, whole weeks for saving', (t) => {
    const { L, close } = makeApp(); t.after(close);
    const m = L.toolMath;
    const s3 = m.split(1000, 3);
    assert.equal(s3.each, 333.33); assert.equal(s3.extra, 1); assert.equal(s3.last, 333.34); // 333.33 + 333.33 + 333.34
    assert.equal(m.split(4500, 4, 10).each, 1237.5);
    assert.equal(m.split(4500, 4, 10).extra, 0);
    const loan = m.loan(100000, 12, 24);
    assert.equal(loan.monthly, 4707.35);                       // same as a bank's monthly payment
    assert.equal(loan.total, round(4707.35 * 24));             // 112,976.40: each month x months
    assert.equal(loan.interest, round(loan.total - 100000));
    const sv = m.saving(60000, 0, 10);                         // 10 days = 2 weekly payments
    assert.equal(sv.weeks, 2); assert.equal(sv.perWeek, 30000);
    assert.ok(sv.perWeek * sv.weeks >= 60000);
  });

  test('loan: flat rate charges interest on the full amount for the whole time', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    const flat = L.toolMath.loan(1500000, 12, 60, 'flat');   // 1.5M x 12% x 5 years = 900,000 interest
    assert.equal(flat.interest, 900000);
    assert.equal(flat.total, 2400000);
    assert.equal(flat.monthly, 40000);
    assert.ok(flat.monthly > L.toolMath.loan(1500000, 12, 60).monthly, 'flat costs more than reducing balance');
    L.ui.view = 'tools'; L.render();
    const set = (f, v) => { const i = doc.querySelector(`[data-tool="loan"][data-f="${f}"]`); i.value = v; i.dispatchEvent(new w.Event('input', { bubbles: true })); };
    set('amount', '1500000'); set('rate', '12'); set('months', '60');
    assert.match(doc.querySelector('#out-loan').textContent, /flat rate \(leasing quote\): Rs\s?40,000\.00 a month/);
    doc.querySelector('[data-loan-kind="flat"]').click();
    assert.equal(doc.querySelector('[data-loan-kind="flat"]').getAttribute('aria-checked'), 'true');
    assert.match(doc.querySelector('#out-loan .tool-row.strong').textContent, /Rs\s?40,000\.00/);
    assert.match(doc.querySelector('#out-loan').textContent, /reducing balance \(bank loan\)/);
  });

  test('a discount over 100% or a negative tip is refused, not shown as a negative amount', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'tools'; L.render();
    const set = (tool, f, v) => { const i = doc.querySelector(`[data-tool="${tool}"][data-f="${f}"]`); i.value = v; i.dispatchEvent(new w.Event('input', { bubbles: true })); };
    set('discount', 'price', '2500'); set('discount', 'pct', '120');
    assert.match(doc.querySelector('#out-discount').textContent, /between 0 and 100%/);
    set('split', 'total', '1000'); set('split', 'people', '3');
    assert.match(doc.querySelector('#out-split').textContent, /One person pays Rs\s?333\.34/);
    set('split', 'extra', '-5');
    assert.match(doc.querySelector('#out-split').textContent, /can’t be below 0%/);
  });

  test('the Calculator page works out a tool as you type', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'tools'; L.render();
    const set = (f, v) => { const i = doc.querySelector(`[data-tool="split"][data-f="${f}"]`); i.value = v; i.dispatchEvent(new w.Event('input', { bubbles: true })); };
    set('total', '3000'); set('people', '4');
    assert.match(doc.querySelector('#out-split').textContent, /Each person pays.*750/);
  });
});
const round = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------ asking for a Play rating */
describe('rate the app', () => {
  // Adds `count` expenses, the oldest one `oldestDaysAgo` days before today (7 Oct).
  const addHistory = (app, count, oldestDaysAgo) => {
    for (let i = 0; i < count; i++) {
      app.add({ type: 'expense', amount: 100, date: app.L.addDays('2026-10-07', -Math.max(oldestDaysAgo - i, 0)), categoryId: app.expenseCat('Food').id });
    }
  };
  const fakePhone = (w, calls) => {
    w.Capacitor = { isNativePlatform: () => true, Plugins: { AppReview: {
      requestReview: async () => { calls.push('review'); },
      openAppStore: async () => { calls.push('store'); },
    } } };
    w.setTimeout = (fn) => fn(); // skip the short wait before the stars
  };

  test('not asked until 20 entries over at least a week', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 19, 30);
    assert.equal(app.L.reviewDue(), false); // too few entries
    const fresh = makeApp(); t.after(fresh.close);
    fresh.S.settings.startedOn = '2026-10-04'; // installed 3 days ago
    addHistory(fresh, 25, 3);
    assert.equal(fresh.L.reviewDue(), false); // too new
    addHistory(app, 1, 30);
    assert.equal(app.L.reviewDue(), true);
  });

  test('scheduled entries the app added itself do not count', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 19, 30);
    app.add({ type: 'expense', amount: 100, date: '2026-10-01', categoryId: app.expenseCat('Food').id, auto: true });
    assert.equal(app.L.reviewDue(), false);
  });

  test('asked at most once every 120 days', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 20, 200);
    app.S.settings.reviewAsked = '2026-07-01'; // 98 days ago
    assert.equal(app.L.reviewDue(), false);
    app.S.settings.reviewAsked = '2026-06-09'; // 120 days ago
    assert.equal(app.L.reviewDue(), true);
  });

  test('on the phone, asks Google Play and remembers the day', (t) => {
    const app = makeApp(); t.after(app.close);
    const calls = [];
    fakePhone(app.w, calls);
    addHistory(app, 20, 30);
    app.L.askForReview();
    assert.deepEqual(calls, ['review']);
    assert.equal(app.S.settings.reviewAsked, '2026-10-07');
    app.L.askForReview(); // just asked: not again
    assert.deepEqual(calls, ['review']);
  });

  test('never asks on the web or desktop, and Settings has no Rate button there', (t) => {
    const app = makeApp(); t.after(app.close);
    addHistory(app, 20, 30);
    app.L.askForReview();
    assert.equal(app.S.settings.reviewAsked, '');
    app.L.ui.view = 'settings'; app.L.render();
    assert.equal(app.doc.querySelector('#rateApp'), null);
  });

  test('Settings → Feedback: write an idea, Send opens the email app with it filled in', (t) => {
    const { L, w, doc, close } = makeApp(); t.after(close);
    let opened = '';
    w.pywebview = { api: { save_data: () => {}, data_location: async () => 'C:/data.json', open_email: (url) => { opened = url; return true; } } }; // the Windows app
    L.ui.view = 'settings'; L.render();
    assert.match(doc.querySelector('.page').textContent, /Feedback[\s\S]*Send an idea or feedback[\s\S]*Report a problem/);
    assert.equal(doc.querySelector('#rateApp'), null, 'no Play Store row outside the phone app');
    doc.querySelector('#fbProblem').click();
    assert.equal(doc.querySelector('#fbKind [aria-checked="true"]').dataset.v, 'problem');
    doc.querySelector('#fbSend').click();
    assert.equal(opened, '', 'an empty message is not sent');
    doc.querySelector('#fbMsg').value = 'The calendar shows the wrong month & day';
    doc.querySelector('#fbSend').click();
    assert.match(opened, /^mailto:kesharadhananjanaofc@gmail\.com\?subject=Pocket%20Ledger%20problem&body=/);
    const body = decodeURIComponent(opened.split('&body=')[1]);
    assert.match(body, /^The calendar shows the wrong month & day\n\n--\nPocket Ledger \d+\.\d+\.\d+ \(Windows app, Professional look\)/);
    assert.equal(doc.querySelector('#fbMsg'), null, 'the form closed');
  });

  test('switching the kind changes the hint in the message box', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.feedbackForm('idea');
    assert.match(doc.querySelector('#fbMsg').placeholder, /better for you/);
    doc.querySelector('#fbKind [data-v="problem"]').click();
    assert.match(doc.querySelector('#fbMsg').placeholder, /What happened/);
  });

  test('Settings on the phone has "Rate on Google Play", which opens the store', (t) => {
    const app = makeApp(); t.after(app.close);
    const calls = [];
    fakePhone(app.w, calls);
    app.L.ui.view = 'settings'; app.L.render();
    app.doc.querySelector('#rateApp').click();
    assert.deepEqual(calls, ['store']);
  });
});

/* ------------------------------------------ calendar */
describe('calendar page', () => {
  // Rent on the 1st of every month, salary on the 25th: both still to come (today is Wed 7 Oct 2026).
  const schedule = ({ S, cash, expenseCat, incomeCat }) => {
    S.recurring.push({ id: 'rent', type: 'expense', amount: 15000, note: 'Rent', categoryId: expenseCat('Rent').id,
      frequency: 'monthly', nextDate: '2026-11-01', anchorDay: 1, accountId: cash.id, active: true });
    S.recurring.push({ id: 'pay', type: 'income', amount: 50000, note: 'Salary', categoryId: incomeCat().id,
      frequency: 'monthly', nextDate: '2026-10-25', anchorDay: 25, accountId: cash.id, active: true });
  };
  const open = (app, day) => { app.L.openCalendar(day); return app.doc; };

  test('the Home calendar button opens the Calendar page on today', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'dashboard'; L.render();
    doc.querySelector('#openCal').click();
    assert.equal(L.ui.view, 'calendar');
    assert.match(doc.querySelector('.cal-title').textContent, /October\s*2026/);
    assert.equal(doc.querySelector('.cal-day.today').dataset.calDay, '2026-10-07');
    assert.equal(doc.querySelectorAll('[data-cal-day]').length, 31);
    assert.ok(doc.querySelector('.nav [data-nav="calendar"]'), 'Calendar is in the menu');
  });

  test('scheduled payments show on every future day they repeat on', (t) => {
    const app = makeApp(); t.after(app.close);
    schedule(app);
    const ev = app.L.calEvents('2026-10-01', '2026-12-31').map((e) => `${e.date} ${e.label}`);
    assert.deepEqual([...ev], ['2026-10-25 Salary', '2026-11-01 Rent', '2026-11-25 Salary', '2026-12-01 Rent', '2026-12-25 Salary']);
    const doc = open(app, '2026-11-10');
    assert.ok(doc.querySelector('[data-cal-day="2026-11-01"] .mk.bill'));
    assert.ok(doc.querySelector('[data-cal-day="2026-11-25"] .mk.income'));
  });

  test('paused payments and reached goals are left out; goal target dates are marked', (t) => {
    const app = makeApp(); t.after(app.close);
    schedule(app); app.S.recurring[0].active = false;
    app.S.goals.push({ id: 'g1', name: 'Laptop', target: 90000, saved: 20000, deadline: '2026-10-29' });
    app.S.goals.push({ id: 'g2', name: 'Done', target: 100, saved: 100, deadline: '2026-10-20' });
    const ev = app.L.calEvents('2026-10-01', '2026-11-30');
    assert.deepEqual([...ev.map((e) => e.label)], ['Salary', 'Laptop', 'Salary']);
    const doc = open(app);
    assert.ok(doc.querySelector('[data-cal-day="2026-10-29"] .mk.goal'));
  });

  test('"Coming up" lists the next 30 days; a row jumps to its day', (t) => {
    const app = makeApp(); t.after(app.close);
    schedule(app);
    const doc = open(app);
    const rows = [...doc.querySelectorAll('.cal-soon .cal-ev')].map((r) => r.textContent.replace(/\s+/g, ' '));
    assert.equal(rows.length, 2);
    assert.match(rows[0], /Salary/); assert.match(rows[1], /Rent/);
    doc.querySelector('.cal-soon [data-cal-go="2026-11-01"]').click();
    assert.match(doc.querySelector('.cal-title').textContent, /November\s*2026/);
    assert.match(doc.querySelector('.cal-sel').textContent, /Rent/);
  });

  test('month summary: logged money up to today, and bills still to pay', (t) => {
    const app = makeApp(); t.after(app.close);
    schedule(app);
    app.add({ type: 'income', amount: 5000, date: '2026-10-02', categoryId: app.incomeCat().id });
    app.add({ type: 'expense', amount: 1250, date: '2026-10-05', categoryId: app.expenseCat('Food').id });
    app.add({ type: 'expense', amount: 999, date: '2026-10-20', categoryId: app.expenseCat('Food').id }); // later this month: not spent yet
    let sum = open(app).querySelector('.cal-sum').textContent.replace(/\s+/g, ' ');
    assert.match(sum, /Income\s?Rs\s?5,000/); assert.match(sum, /Spent\s?Rs\s?1,250/); assert.match(sum, /Bills to pay\s?None/);
    sum = open(app, '2026-11-03').querySelector('.cal-sum').textContent.replace(/\s+/g, ' ');
    assert.match(sum, /Bills to pay\s?1 · Rs\s?15,000/);
  });

  test('past days: ✓ for no-spend days, and over / within the daily share with a weekly limit', (t) => {
    const app = makeApp(); t.after(app.close);
    app.S.settings.weeklyBudget = 7000; // Rs 1,000 a day
    app.add({ type: 'expense', amount: 2500, date: '2026-10-05', categoryId: app.expenseCat('Food').id });
    app.add({ type: 'expense', amount: 300, date: '2026-10-06', categoryId: app.expenseCat('Food').id });
    const marks = app.L.calDayMarks('2026-10-01', '2026-10-31');
    assert.equal(marks['2026-10-05'], 'over');
    assert.equal(marks['2026-10-06'], 'under');
    assert.equal(marks['2026-10-04'], 'none');
    assert.equal(marks['2026-10-07'], undefined, 'today is not over yet');
    assert.equal(marks['2026-10-08'], undefined, 'future days have no mark');
    const doc = open(app);
    assert.equal(doc.querySelector('[data-cal-day="2026-10-04"] small').textContent, '✓');
  });

  test('tapping a day lists it; arrows change the month; Today comes back', (t) => {
    const app = makeApp(); t.after(app.close);
    app.add({ type: 'expense', amount: 300, date: '2026-10-03', categoryId: app.expenseCat('Food').id, note: 'Lunch' });
    const doc = open(app);
    assert.match(doc.querySelector('.cal-sel').textContent, /Nothing on this day/);
    doc.querySelector('[data-cal-day="2026-10-03"]').click();
    assert.match(doc.querySelector('.cal-sel').textContent, /Lunch/);
    doc.querySelector('[data-cal-move="1"]').click();
    assert.match(doc.querySelector('.cal-title').textContent, /November\s*2026/);
    doc.querySelector('#calToday').click();
    assert.match(doc.querySelector('.cal-title').textContent, /October\s*2026/);
    assert.equal(doc.querySelector('#calToday'), null);
  });

  test('legend buttons hide and show a kind of mark', (t) => {
    const app = makeApp(); t.after(app.close);
    schedule(app);
    const doc = open(app);
    assert.ok(doc.querySelector('[data-cal-day="2026-10-25"] .mk.income'));
    doc.querySelector('[data-cal-kind="income"]').click();
    assert.equal(doc.querySelector('[data-cal-day="2026-10-25"] .mk.income'), null);
    doc.querySelector('[data-cal-kind="income"]').click();
    assert.ok(doc.querySelector('[data-cal-day="2026-10-25"] .mk.income'));
  });

  test('weeks start on the day chosen in Settings', (t) => {
    const app = makeApp(); t.after(app.close);
    app.S.settings.weekStart = 0; // Sunday; 1 Oct 2026 is a Thursday, so 4 empty boxes come first
    const doc = open(app);
    assert.equal(doc.querySelector('.cal-names span').title, 'Sunday');
    assert.equal(doc.querySelectorAll('.cal-grid > i').length, 4);
  });

  test('+ Expense on a day opens the form with that date', (t) => {
    const app = makeApp(); t.after(app.close);
    const doc = open(app, '2026-10-01');
    doc.querySelector('[data-cal-add="expense"]').click();
    assert.equal(doc.querySelector('#fDate').value, '2026-10-01');
  });

  test('small amounts for the boxes', (t) => {
    const { L, close } = makeApp(); t.after(close);
    assert.deepEqual([450, 1000, 1250, 12400, 1500000].map(L.calAmt), ['450', '1k', '1.3k', '12k', '1.5M']);
  });
});

/* ------------------------------------------ calendar: balance forecast and payday */
describe('balance forecast and payday', () => {
  // Today is Wed 7 Oct 2026. Rs 20,000 in cash; rent of 15,000 on the 10th of every month, salary of 50,000 on the 25th.
  const setup = () => {
    const app = makeApp();
    const { S, cash, expenseCat, incomeCat } = app;
    cash.initial = 20000;
    S.recurring.push({ id: 'rent', type: 'expense', amount: 15000, note: 'Rent', categoryId: expenseCat('Rent').id,
      frequency: 'monthly', nextDate: '2026-10-10', anchorDay: 10, accountId: cash.id, active: true });
    S.recurring.push({ id: 'pay', type: 'income', amount: 50000, note: 'Salary', categoryId: incomeCat().id,
      frequency: 'monthly', nextDate: '2026-10-25', anchorDay: 25, accountId: cash.id, active: true });
    return app;
  };

  test('the expected balance adds scheduled payments and entries dated later, day by day', (t) => {
    const app = setup(); t.after(app.close);
    app.add({ type: 'expense', amount: 2000, date: '2026-10-12', categoryId: app.expenseCat('Food').id }); // planned
    const fc = app.L.forecast('2026-11-30');
    assert.equal(fc['2026-10-07'], 20000, 'today: the balance without the entry dated later');
    assert.equal(fc['2026-10-09'], 20000);
    assert.equal(fc['2026-10-10'], 5000);
    assert.equal(fc['2026-10-12'], 3000);
    assert.equal(fc['2026-10-25'], 53000);
    assert.equal(fc['2026-11-10'], 38000);
  });

  test('goal transfers and moves between accounts count the right way', (t) => {
    const app = setup(); t.after(app.close);
    const { cash, bank } = app;
    app.add({ type: 'transfer', amount: 1000, date: '2026-10-08', accountId: cash.id, toAccountId: bank.id });
    app.add({ type: 'transfer', amount: 3000, date: '2026-10-09', accountId: cash.id, goalId: 'g1' });
    const fc = app.L.forecast('2026-10-09');
    assert.equal(fc['2026-10-08'], 20000, 'cash to bank: the total stays the same');
    assert.equal(fc['2026-10-09'], 17000, 'into a goal: out of the accounts');
  });

  test('warns about the first day the money runs short', (t) => {
    const app = setup(); t.after(app.close);
    app.cash.initial = 10000;
    const fc = app.L.forecast(app.L.addDays('2026-10-07', 60));
    assert.equal(app.L.firstShortDay(fc), '2026-10-10');
    app.L.openCalendar();
    const warn = app.doc.querySelector('.cal-warn');
    assert.match(warn.textContent, /Money may run short on Sat, 10 Oct/);
    assert.ok(app.doc.querySelector('[data-cal-day="2026-10-10"]').classList.contains('short'));
    warn.click();
    assert.equal(app.L.ui.cal.sel, '2026-10-10');
  });

  test('no warning when the money lasts', (t) => {
    const app = setup(); t.after(app.close);
    app.L.openCalendar();
    assert.equal(app.doc.querySelector('.cal-warn'), null);
    assert.equal(app.doc.querySelector('.cal-day.short'), null);
  });

  test('payday: the biggest scheduled income, days to go, and money a day after the bills before it', (t) => {
    const app = setup(); t.after(app.close);
    app.S.recurring.push({ id: 'side', type: 'income', amount: 2000, note: 'Tutoring', categoryId: app.incomeCat().id,
      frequency: 'weekly', nextDate: '2026-10-09', anchorDay: 9, accountId: app.cash.id, active: true });
    const p = app.L.nextPayday();
    assert.equal(p.label, 'Salary');
    assert.equal(p.date, '2026-10-25');
    assert.equal(p.days, 18);
    // 20,000 - rent 15,000 + tutoring 2,000 x 3 (9, 16, 23 Oct) = 11,000 left on the 24th, over 18 days
    assert.equal(p.before, 11000);
    assert.equal(p.perDay, 611.11);
    app.L.openCalendar();
    assert.match(app.doc.querySelector('.cal-pay').textContent.replace(/\s+/g, ' '), /18\s?days to payday · Salary/);
  });

  test('no payday card without scheduled income', (t) => {
    const app = makeApp(); t.after(app.close);
    assert.equal(app.L.nextPayday(), null);
    app.L.openCalendar();
    assert.equal(app.doc.querySelector('.cal-pay'), null);
  });

  test('a later day shows its expected balance, and with a weekly limit also after everyday spending', (t) => {
    const app = setup(); t.after(app.close);
    app.L.openCalendar('2026-10-12');
    let fc = app.doc.querySelector('.cal-fc').textContent.replace(/\s+/g, ' ');
    assert.match(fc, /Expected balance\s?Rs\s?5,000/);
    assert.doesNotMatch(fc, /everyday spending/);
    app.S.settings.weeklyBudget = 7000; // Rs 1,000 a day, 5 days from today
    app.L.render();
    fc = app.doc.querySelector('.cal-fc').textContent.replace(/\s+/g, ' ');
    assert.match(fc, /about Rs\s?0/);
    app.L.openCalendar();
    assert.match(app.doc.querySelector('.cal-fc').textContent, /Balance now/);
    app.L.openCalendar('2026-10-01');
    assert.equal(app.doc.querySelector('.cal-fc'), null, 'past days have no forecast');
  });
});

/* ------------------------------------------ calendar: reminders */
describe('reminders', () => {
  const rem = (S, o) => { const x = { id: 'm' + S.reminders.length, title: 'School fees', date: '2026-10-14', amount: 3000, dir: 'out', frequency: '', anchorDay: 14, done: false, ...o }; S.reminders.push(x); return x; };

  test('new data and old backups both have a reminders list', (t) => {
    const { L, S, close } = makeApp(); t.after(close);
    assert.deepEqual([...S.reminders], []);
    const old = L.migrate({ settings: {}, transactions: [] });
    assert.ok(Array.isArray(old.reminders));
  });

  test('"+ Reminder" on a day opens the form with that date, and Save adds it', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.openCalendar('2026-10-14');
    doc.querySelector('[data-cal-remind]').click();
    assert.equal(doc.querySelector('#mDate').value, '2026-10-14');
    doc.querySelector('#mTitle').value = 'Insurance renewal';
    doc.querySelector('#mAmt').value = '12000';
    doc.querySelector('#mDir [data-v="out"]').click();
    doc.querySelector('#mSave').click();
    assert.equal(S.reminders.length, 1);
    assert.equal(S.reminders[0].title, 'Insurance renewal');
    assert.equal(S.reminders[0].amount, 12000);
    assert.ok(doc.querySelector('[data-cal-day="2026-10-14"] .mk.remind'));
    assert.match(doc.querySelector('.cal-sel').textContent, /Insurance renewal/);
  });

  test('a reminder needs a title', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.reminderForm({ date: '2026-10-14' });
    doc.querySelector('#mSave').click();
    assert.equal(S.reminders.length, 0);
    assert.ok(doc.querySelector('#mTitle'), 'the form stays open');
  });

  test('repeating reminders show on every date; amounts count in the expected balance', (t) => {
    const { L, S, cash, close } = makeApp(); t.after(close);
    cash.initial = 10000;
    rem(S, { title: 'Gym', amount: 2000, frequency: 'monthly', date: '2026-10-14' });
    rem(S, { title: 'Call the bank', amount: 0, date: '2026-10-09' });
    rem(S, { title: 'Refund', amount: 500, dir: 'in', date: '2026-10-12' });
    const ev = L.calEvents('2026-10-01', '2026-12-31').filter((e) => e.kind === 'remind').map((e) => `${e.date} ${e.label} ${e.amount}`);
    assert.deepEqual([...ev], ['2026-10-09 Call the bank 0', '2026-10-12 Refund 500', '2026-10-14 Gym -2000', '2026-11-14 Gym -2000', '2026-12-14 Gym -2000']);
    const fc = L.forecast('2026-11-30');
    assert.equal(fc['2026-10-13'], 10500);
    assert.equal(fc['2026-10-14'], 8500);
    assert.equal(fc['2026-11-14'], 6500);
  });

  test('Done: a one-off one is finished, a repeating one moves to its next date', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    const once = rem(S, { title: 'Pay Amal back' });
    const monthly = rem(S, { title: 'Gym', frequency: 'monthly', date: '2026-10-31', anchorDay: 31 });
    L.reminderForm(once); doc.querySelector('#mDone').click();
    assert.equal(once.done, true);
    assert.equal(L.calEvents('2026-10-01', '2026-12-31').some((e) => e.remId === once.id), false, 'done ones leave the calendar');
    L.reminderForm(monthly); doc.querySelector('#mDone').click();
    assert.equal(monthly.date, '2026-11-30');
    assert.equal(monthly.done, false);
  });

  test('a passed reminder not marked done is listed first in Coming up as overdue', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    rem(S, { title: 'Electricity bill', date: '2026-10-03' });
    rem(S, { title: 'School fees', date: '2026-10-14' });
    L.openCalendar();
    const rows = [...doc.querySelectorAll('.cal-soon .cal-ev')].map((r) => r.textContent.replace(/\s+/g, ' '));
    assert.match(rows[0], /Electricity bill.*Overdue/);
    assert.match(rows[1], /School fees/);
  });

  test('delete has Undo', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    const x = rem(S, {});
    L.reminderForm(x); doc.querySelector('#mDel').click();
    assert.equal(S.reminders.length, 0);
    doc.querySelector('.toast button').click();
    assert.equal(S.reminders.length, 1);
  });

  test('the phone reminds at 9:00 on the day, if the Reminders switch is on', (t) => {
    const { L, S, close } = makeApp(); t.after(close);
    S.settings.notify = { ...S.settings.notify, daily: false, bills: false, limit: false, summary: false, reminders: true };
    rem(S, { title: 'School fees', date: '2026-10-09', amount: 3000 });
    rem(S, { title: 'Far away', date: '2026-10-30' });
    let plan = L.planNotifications();
    assert.equal(plan.length, 1);
    assert.equal(plan[0].title, '🔔 School fees');
    assert.match(plan[0].body, /Today: Rs\s?3,000/);
    assert.equal(plan[0].at.getHours(), 9);
    assert.equal(plan[0].at.getDate(), 9);
    S.settings.notify.reminders = false;
    plan = L.planNotifications();
    assert.equal(plan.length, 0);
  });

  test('merging a backup adds its reminders once; done on either side stays done', (t) => {
    const { L, S, close } = makeApp(); t.after(close);
    rem(S, { id: 'a', title: 'Mine' });
    const theirs = JSON.parse(JSON.stringify(S));
    theirs.reminders[0].done = true;
    theirs.reminders.push({ id: 'b', title: 'Theirs', date: '2026-10-20', amount: 0, dir: 'out', frequency: '', anchorDay: 20, done: false });
    const r = L.mergeStates(S, theirs);
    assert.deepEqual([...r.state.reminders.map((x) => x.id)], ['a', 'b']);
    assert.equal(r.state.reminders[0].done, true);
    assert.equal(r.added.reminders, 1);
    assert.match(L.mergeSummary(r.added), /1 reminder/);
  });
});

/* ------------------------------------------ Aesthetic look */
describe('style: Professional or Aesthetic', () => {
  test('new data starts Professional; the page has no style mark', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    assert.equal(S.settings.style, 'professional');
    L.render();
    assert.equal(doc.documentElement.getAttribute('data-style'), null);
    assert.equal(doc.querySelector('.wdots'), null, 'the week is bars');
  });

  test('the welcome form has no style picker; after Start tracking a popup asks for one (Professional recommended)', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.settings.onboarded = false; L.render();
    assert.equal(doc.querySelector('.welcome [data-style-pick]'), null, 'not on the form');
    doc.querySelector('#wName').value = 'Kezara';
    doc.querySelector('#wGo').click();
    const cards = doc.querySelectorAll('.modal [data-style-pick]');
    assert.equal(cards.length, 2);
    assert.match(cards[0].textContent, /Professional\s*Recommended/);
    assert.match(cards[1].textContent, /soft, pretty look, like a planner/);
    assert.equal(doc.querySelector('[data-style-pick="professional"]').getAttribute('aria-checked'), 'true', 'Professional is picked to start with');
    doc.querySelector('[data-style-pick="aesthetic"]').click();
    assert.equal(S.settings.style, 'aesthetic');
    assert.equal(S.settings.palette, 'pearl', 'its own colours');
    assert.equal(doc.documentElement.getAttribute('data-style'), 'aesthetic');
    assert.equal(doc.querySelector('.modal'), null, 'the popup closed');
    assert.equal(S.settings.name, 'Kezara', 'the form was saved');
  });

  test('closing the style popup keeps Professional', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.settings.onboarded = false; L.render();
    doc.querySelector('#wGo').click();
    doc.querySelector('.modal [data-close]').click();
    assert.equal(S.settings.style, 'professional');
    assert.equal(S.settings.onboarded, true);
  });

  test('Settings switches the look; a colour theme the person chose is kept', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.ui.view = 'settings'; L.render();
    doc.querySelector('[data-look="aesthetic"]').click();
    assert.equal(S.settings.style, 'aesthetic');
    assert.equal(S.settings.palette, 'pearl');
    doc.querySelector('[data-look="professional"]').click();
    assert.equal(S.settings.palette, 'forest', 'Pearl came with Aesthetic, so it goes with it');
    S.settings.palette = 'navy';
    doc.querySelector('[data-look="aesthetic"]').click();
    assert.equal(S.settings.palette, 'navy', 'a theme chosen on purpose stays');
  });

  test('Aesthetic Home: the week as dots with a plain sentence, quick-action labels', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close); // Wed 7 Oct; week Mon 5 - Sun 11
    S.settings.weeklyBudget = 7000; // Rs 1,000 a day
    add({ type: 'expense', amount: 300, date: '2026-10-05', categoryId: expenseCat('Food').id });
    add({ type: 'expense', amount: 2500, date: '2026-10-06', categoryId: expenseCat('Food').id });
    L.setStyle('aesthetic'); L.ui.view = 'dashboard'; L.render();
    const dots = [...doc.querySelectorAll('.wdot')].map((d) => d.className.replace('wdot', '').trim());
    assert.deepEqual(dots, ['ok', 'over', 'today', 'future', 'future', 'future', 'future']);
    assert.match(doc.querySelector('.wdot.over').textContent, /2\.5k/);
    assert.match(doc.querySelector('.wdots-note').textContent, /1 of 2 days so far stayed within your limit/);
    assert.equal(doc.querySelector('.days'), null, 'no bars');
  });

  test('Aesthetic Home as designed: dark card, your week, three quick tiles, recently', (t) => {
    const { L, S, doc, add, expenseCat, close } = makeApp(); t.after(close); // Wed 7 Oct; week Mon 5 - Sun 11
    S.settings.weeklyBudget = 7000;
    add({ type: 'expense', amount: 1500, date: '2026-10-05', categoryId: expenseCat('Food').id, note: 'Groceries' });
    L.setStyle('aesthetic'); L.ui.view = 'dashboard'; L.render();
    const hero = doc.querySelector('.hero').textContent.replace(/\s+/g, ' ');
    // Rs 5,500 left over 5 days (today included) = Rs 1,100 today; the other Rs 4,400 is for the rest of the week
    assert.match(hero, /You can spend today\s?Rs\s?1,100\.00/);
    assert.match(hero, /Rs\s?4,400 left for the rest of this week/);
    assert.match(hero, /Rs\s?1,500 spent\s?Limit Rs\s?7,000/);
    assert.match(doc.querySelector('.home-aes').textContent, /Your week/);
    assert.deepEqual([...doc.querySelectorAll('.qa-tile')].map((b) => b.textContent.trim()), ['Expense', 'Income', 'Move money']);
    assert.match(doc.querySelector('.home-aes').textContent, /Recently[\s\S]*Groceries/);
    assert.equal(doc.querySelector('.stats'), null, 'no Professional stat boxes');
    doc.querySelector('.qa-tile[data-fab="expense"]').click();
    assert.equal(doc.querySelector('.modal-head h2').textContent, 'New expense');
    doc.querySelector('#typeSeg [data-v="income"]').click();
    assert.equal(doc.querySelector('.modal-head h2').textContent, 'Money in');
  });

  test('Home: the name on its own line under the greeting, and the light/dark switch, in both looks', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.settings.name = 'kezara';
    for (const look of ['professional', 'aesthetic']) {
      L.setStyle(look); L.ui.view = 'dashboard'; L.render();
      assert.equal(doc.querySelector('.home-head h1 .greet-name').textContent, 'Kezara', look);
      assert.ok(doc.querySelector('.home-head .theme-toggle'), look + ' has the switch');
    }
  });

  test('Home has a Settings button in both looks', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    for (const look of ['professional', 'aesthetic']) {
      L.setStyle(look); L.ui.view = 'dashboard'; L.render();
      doc.querySelector('.home-head [data-go="settings"]').click();
      assert.equal(L.ui.view, 'settings', look);
    }
  });

  test('the menu button on the Aesthetic Home opens every other page, Settings too', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.setStyle('aesthetic'); L.render();
    doc.querySelector('#homeMenu').click();
    const more = [...doc.querySelectorAll('.more-list [data-nav]')].map((b) => b.dataset.nav);
    for (const k of ['transactions', 'budgets', 'recurring', 'accounts', 'tools', 'settings']) assert.ok(more.includes(k), k);
    for (const k of ['calendar', 'reports', 'goals']) assert.ok(more.includes(k), k + ' too: on a computer there is no bottom bar');
    assert.ok(!more.includes('dashboard'), 'not Home, you are on it');
  });

  test('category icons: by name in the add form and the lists, three dots for unknown names', (t) => {
    const { L, close } = makeApp(); t.after(close);
    assert.match(L.catIcon('Food & groceries'), /M3 10h18/);
    assert.match(L.catIcon('Rent & housing'), /M3 10\.5 12 3/);
    assert.match(L.catIcon('My own thing'), /M5 12h\.01/);
  });

  test('Aesthetic Home without a limit counts no-spend days', (t) => {
    const { L, doc, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 300, date: '2026-10-05', categoryId: expenseCat('Food').id });
    L.setStyle('aesthetic'); L.render();
    assert.match(doc.querySelector('.wdots-note').textContent, /1 no-spend day so far/);
  });

  test('Aesthetic Reports: no charts, a plain sentence instead', (t) => {
    const { L, doc, add, expenseCat, incomeCat, close } = makeApp(); t.after(close);
    add({ type: 'income', amount: 10000, date: '2026-10-01', categoryId: incomeCat().id });
    add({ type: 'expense', amount: 3000, date: '2026-10-02', categoryId: expenseCat('Food').id });
    add({ type: 'expense', amount: 1000, date: '2026-10-03', categoryId: expenseCat('Transport').id });
    L.ui.view = 'reports'; L.ui.reportPeriod = 'month'; L.render();
    assert.ok(doc.querySelectorAll('.chart, svg.bars, .bar-chart').length || /Income and expenses by month/.test(doc.body.textContent), 'Professional has its charts');
    L.setStyle('aesthetic'); L.render();
    const text = doc.querySelector('.page').textContent.replace(/\s+/g, ' ');
    assert.doesNotMatch(text, /Income and expenses by month|Spending by day|Which days cost you most/);
    assert.match(doc.querySelector('.hero').textContent.replace(/\s+/g, ' '), /You spent\s?Rs\s?4,000\.00\s?Most of it went on Food & groceries \(75%\)\.\s*$/);
    assert.match(doc.querySelector('.kept').textContent, /You kept Rs\s?6,000\.00/);
    assert.match(text, /Where it went/);
    assert.ok(doc.querySelector('.donut'));
    doc.querySelector('#rp [data-v="year"]').click();
    assert.equal(L.ui.reportPeriod, 'year');
  });

  test('the look is per device: it never syncs', (t) => {
    const { close } = makeApp(); t.after(close);
    const core = fs.readFileSync(new URL('../web/sync-core.js', import.meta.url), 'utf8');
    assert.match(core, /LOCAL_SETTINGS = \[[^\]]*'style'/);
  });
});

describe('Aesthetic look: the tab bar and the ring chart', () => {
  test('the phone bar holds Home, Calendar, +, Spending and Goals (styles.css shows them in that order)', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.setStyle('aesthetic'); L.render();
    const shown = [...doc.querySelectorAll('.nav > button:not(.phone-hide):not(.more-btn)')].map((b) => b.id === 'navAdd' ? '+' : b.textContent.trim());
    assert.deepEqual(shown.sort(), ['+', 'Calendar', 'Goals', 'Home', 'Spending']);
    const css = fs.readFileSync(new URL('../web/styles.css', import.meta.url), 'utf8');
    assert.match(css, /\.nav \.more-btn \{ display: none; \}/, 'More is hidden on the Aesthetic bar');
  });

  test('Aesthetic Goals: big cards with a % and a friendly tip, and a dashed "Start a new goal"', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    S.goals.push({ id: 'g1', name: 'New laptop', target: 90000, saved: 20000, deadline: '2026-12-30' });
    S.goals.push({ id: 'g2', name: 'Trip', target: 10000, saved: 8000 });
    L.setStyle('aesthetic'); L.ui.view = 'goals'; L.render();
    const cards = [...doc.querySelectorAll('.goal-card')].map((c) => c.textContent.replace(/\s+/g, ' '));
    assert.match(cards[0], /New laptop.*22%.*Rs\s?20,000 saved.*of Rs\s?90,000.*Put aside Rs\s?5,833 a week/);
    assert.match(cards[1], /80%.*Almost there! Only Rs\s?2,000 to go/);
    doc.querySelector('#addGoal').click();
    assert.ok(doc.querySelector('.modal'), 'the new-goal form opens');
  });

  test('Aesthetic Settings: Style as two big rows', (t) => {
    const { L, S, doc, close } = makeApp(); t.after(close);
    L.setStyle('aesthetic'); L.ui.view = 'settings'; L.render();
    const rows = doc.querySelectorAll('.look-row');
    assert.equal(rows.length, 2);
    assert.equal(doc.querySelector('.look-row.on').dataset.look, 'aesthetic');
    doc.querySelector('.look-row[data-look="professional"]').click();
    assert.equal(S.settings.style, 'professional');
    assert.equal(doc.querySelectorAll('.look-row').length, 2, 'the same two rows in Professional');
    assert.match(doc.querySelector('.look-row[data-look="professional"]').textContent, /Recommended[\s\S]*simple, professional look/);
    assert.doesNotMatch(doc.querySelector('.look-row[data-look="aesthetic"]').textContent, /Recommended/);
  });

  test('the + in the bar opens the quick actions and closes them again', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.setStyle('aesthetic'); L.render();
    const add = doc.querySelector('#navAdd');
    add.click();
    assert.ok(doc.querySelector('#fabWrap').classList.contains('open'));
    assert.equal(add.getAttribute('aria-expanded'), 'true');
    add.click();
    assert.ok(!doc.querySelector('#fabWrap').classList.contains('open'));
  });

  test('Professional keeps its own bar and has no + in it', (t) => {
    const { L, doc, close } = makeApp(); t.after(close);
    L.render();
    assert.equal(doc.querySelector('#navAdd'), null);
    const shown = [...doc.querySelectorAll('.nav > button:not(.phone-hide)')].map((b) => b.textContent.trim());
    assert.deepEqual(shown, ['This week', 'Transactions', 'Budgets', 'Reports', 'More']);
  });

  test('Spending shows a ring: 5 biggest categories plus "Everything else", each a different colour', (t) => {
    const { L, S, doc, add, close } = makeApp(); t.after(close);
    const cats = S.categories.filter((c) => c.type === 'expense');
    [5000, 3000, 2000, 1000, 600, 300, 100].forEach((v, i) => add({ type: 'expense', amount: v, date: '2026-10-02', categoryId: cats[i].id }));
    L.setStyle('aesthetic'); L.ui.view = 'reports'; L.ui.reportPeriod = 'month'; L.render();
    assert.match(doc.querySelector('.head h1').textContent, /Your spending/);
    const arcs = [...doc.querySelectorAll('.donut circle')];
    assert.equal(arcs.length, 6);
    assert.equal(new Set(arcs.map((c) => c.getAttribute('stroke'))).size, 6);
    const legend = [...doc.querySelectorAll('.dl')].map((x) => x.textContent.replace(/\s+/g, ' ').trim());
    assert.match(legend[5], /Everything else\s?Rs\s?400\s?3%/);
    assert.match(doc.querySelector('.donut-mid').textContent, /Rs\s?12,000/);
  });

  test('one category fills the whole ring', (t) => {
    const { L, doc, add, expenseCat, close } = makeApp(); t.after(close);
    add({ type: 'expense', amount: 500, date: '2026-10-02', categoryId: expenseCat('Rent').id });
    L.setStyle('aesthetic'); L.ui.view = 'reports'; L.ui.reportPeriod = 'month'; L.render();
    const arc = doc.querySelector('.donut circle');
    const [len] = arc.getAttribute('stroke-dasharray').split(' ').map(Number);
    assert.ok(Math.abs(len - 2 * Math.PI * 70) < 0.1);
  });
});

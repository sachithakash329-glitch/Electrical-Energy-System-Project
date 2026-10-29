import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyEnergy, monthlyEnergy, calculateTotals } from '../src/utils/energy.js';

const fan = { powerWatts: 75, quantity: 2, hoursPerDay: 8, daysPerMonth: 30 };

test('two 75 W fans use 1.2 kWh per operating day and 36 kWh per month', () => {
  assert.equal(dailyEnergy(fan), 1.2);
  assert.equal(monthlyEnergy(fan), 36);
});

test('monthly total uses each appliance usage period and adds fixed charge once', () => {
  const kettle = { powerWatts: 1500, quantity: 1, hoursPerDay: 0.25, daysPerMonth: 20 };
  const total = calculateTotals([fan, kettle], { unitRate: 30, fixedCharge: 100 });
  assert.equal(total.monthlyKwh, 43.5);
  assert.equal(total.monthlyCost, 1405);
});

test('zero operating hours use no energy', () => {
  assert.equal(monthlyEnergy({ ...fan, hoursPerDay: 0 }), 0);
});

test('empty inventory keeps the configured monthly fixed charge', () => {
  assert.deepEqual(calculateTotals([], { unitRate: 30, fixedCharge: 100 }), {
    dailyKwh: 0, monthlyKwh: 0, monthlyCost: 100
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Appliance from '../models/Appliance.js';
import Setting from '../models/Setting.js';

// These tests validate documents without needing database credentials.
const valid = {
  userId: new mongoose.Types.ObjectId(),
  name: 'Ceiling fan', roomId: new mongoose.Types.ObjectId(),
  powerWatts: 75, quantity: 2, hoursPerDay: 8, daysPerMonth: 30
};

test('valid appliance data passes and trims its name', async () => {
  const record = new Appliance({ ...valid, name: '  Ceiling fan  ' });
  await record.validate();
  assert.equal(record.name, 'Ceiling fan');
});

test('invalid ranges and fractional counts are rejected', async () => {
  for (const change of [
    { powerWatts: 0 }, { powerWatts: -10 }, { quantity: 1.5 },
    { hoursPerDay: 25 }, { hoursPerDay: -1 }, { daysPerMonth: 32 },
    { daysPerMonth: 1.5 }
  ]) {
    await assert.rejects(new Appliance({ ...valid, ...change }).validate(), {
      name: 'ValidationError'
    });
  }
});

test('missing room and blank names are rejected', async () => {
  await assert.rejects(new Appliance({ ...valid, roomId: undefined }).validate());
  await assert.rejects(new Appliance({ ...valid, name: '  ' }).validate());
});

test('zero hours and decimal daily hours are valid', async () => {
  await new Appliance({ ...valid, hoursPerDay: 0 }).validate();
  await new Appliance({ ...valid, hoursPerDay: 0.25 }).validate();
});

test('tariff values must be nonnegative', async () => {
  const owner = new mongoose.Types.ObjectId();
  const identity = { _id: owner.toString(), userId: owner };
  await new Setting({ ...identity, unitRate: 30, fixedCharge: 100 }).validate();
  await assert.rejects(new Setting({ ...identity, unitRate: -1, fixedCharge: 100 }).validate());
  await assert.rejects(new Setting({ ...identity, unitRate: 30, fixedCharge: -1 }).validate());
});

test('new appliance and tariff records require an account owner', async () => {
  await assert.rejects(new Appliance({ ...valid, userId: undefined }).validate());
  await assert.rejects(new Setting({ _id: 'missing-owner', unitRate: 30, fixedCharge: 0 }).validate());
});

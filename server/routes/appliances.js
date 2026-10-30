import { Router } from 'express';
import mongoose from 'mongoose';
import Appliance from '../models/Appliance.js';
import Room from '../models/Room.js';

const router = Router();

function inputError(message) {
  return Object.assign(new Error(message), { status: 400 });
}

async function getInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw inputError('Please send a valid appliance record.');
  }
  const { name, roomId, powerWatts, quantity, hoursPerDay, daysPerMonth } = body;
  if (typeof name !== 'string') throw inputError('Appliance name is required.');
  const numbers = [powerWatts, quantity, hoursPerDay, daysPerMonth];
  if (!numbers.every(value => typeof value === 'number' && Number.isFinite(value))) {
    throw inputError('Power, quantity, hours and days must be valid numbers.');
  }
  if (!mongoose.isObjectIdOrHexString(roomId) || !await Room.exists({ _id: roomId })) {
    throw inputError('Please select an existing room.');
  }
  // Only accept the fields the form is allowed to change.
  return { name, roomId, powerWatts, quantity, hoursPerDay, daysPerMonth };
}

router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return next(inputError('Invalid appliance ID.'));
  }
  next();
});

router.get('/', async (req, res) => {
  const appliances = await Appliance.find({ userId: req.user._id }).populate('roomId', 'name').sort({ createdAt: -1 });
  res.json(appliances);
});

router.get('/:id', async (req, res) => {
  const appliance = await Appliance.findOne({ _id: req.params.id, userId: req.user._id }).populate('roomId', 'name');
  if (!appliance) return res.status(404).json({ message: 'Appliance not found.' });
  res.json(appliance);
});

router.post('/', async (req, res) => {
  const input = await getInput(req.body);
  const appliance = await Appliance.create({ ...input, userId: req.user._id });
  await appliance.populate('roomId', 'name');
  res.status(201).json(appliance);
});

router.put('/:id', async (req, res) => {
  const appliance = await Appliance.findOne({ _id: req.params.id, userId: req.user._id });
  if (!appliance) return res.status(404).json({ message: 'Appliance not found.' });
  Object.assign(appliance, await getInput(req.body));
  await appliance.save(); // Runs all schema validators on updates too.
  await appliance.populate('roomId', 'name');
  res.json(appliance);
});

router.delete('/:id', async (req, res) => {
  const appliance = await Appliance.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!appliance) return res.status(404).json({ message: 'Appliance not found.' });
  res.json({ message: 'Appliance deleted.' });
});

export default router;

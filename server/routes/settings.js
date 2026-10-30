import { Router } from 'express';
import Setting from '../models/Setting.js';

const router = Router();

async function ownSettings(userId) {
  try {
    return await Setting.findOneAndUpdate(
      { userId },
      { $setOnInsert: { _id: userId.toString(), userId, unitRate: 30, fixedCharge: 0 } },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    // Two browser tabs may request this user's first setting at the same time.
    if (error.code === 11000) return Setting.findOne({ userId });
    throw error;
  }
}

router.get('/', async (req, res) => {
  res.json(await ownSettings(req.user._id));
});

router.put('/', async (req, res) => {
  const { unitRate, fixedCharge } = req.body || {};
  if (![unitRate, fixedCharge].every(value => typeof value === 'number' && Number.isFinite(value))) {
    return res.status(400).json({ message: 'Rate and fixed charge must be valid numbers.' });
  }
  const setting = await ownSettings(req.user._id);
  setting.unitRate = unitRate;
  setting.fixedCharge = fixedCharge;
  await setting.save();
  res.json(setting);
});

export default router;

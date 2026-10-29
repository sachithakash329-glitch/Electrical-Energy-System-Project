import { Router } from 'express';
import Setting from '../models/Setting.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(await Setting.findById('main'));
});

router.put('/', async (req, res) => {
  const { unitRate, fixedCharge } = req.body || {};
  if (![unitRate, fixedCharge].every(value => typeof value === 'number' && Number.isFinite(value))) {
    return res.status(400).json({ message: 'Rate and fixed charge must be valid numbers.' });
  }
  const setting = await Setting.findById('main');
  setting.unitRate = unitRate;
  setting.fixedCharge = fixedCharge;
  await setting.save();
  res.json(setting);
});

export default router;

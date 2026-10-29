import mongoose from 'mongoose';
import Room from './models/Room.js';
import Setting from './models/Setting.js';

export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is missing.');

  // One connection for this local Express server; use the driver's pool defaults.
  // Do not reconnect inside each route.
  await mongoose.connect(uri);
  await Room.init();
  for (const name of ['Living Room', 'Bedroom', 'Kitchen', 'Other']) {
    await Room.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
  await Setting.updateOne(
    { _id: 'main' },
    { $setOnInsert: { unitRate: 30, fixedCharge: 0 } },
    { upsert: true }
  );
}

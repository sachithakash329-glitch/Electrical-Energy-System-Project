import mongoose from 'mongoose';
import Room from './models/Room.js';
import Setting from './models/Setting.js';
import User from './models/User.js';
import Session from './models/Session.js';
import Appliance from './models/Appliance.js';

export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is missing.');

  // One connection for this local Express server; use the driver's pool defaults.
  // Do not reconnect inside each route.
  await mongoose.connect(uri);
  await Promise.all([Room.init(), User.init(), Session.init(), Appliance.init(), Setting.init()]);
  for (const name of ['Living Room', 'Bedroom', 'Kitchen', 'Other']) {
    await Room.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
  // Each user's tariff is created when that user first opens the dashboard.
}

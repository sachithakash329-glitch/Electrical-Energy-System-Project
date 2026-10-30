import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { connectDatabase } from '../database.js';
import User from '../models/User.js';
import Appliance from '../models/Appliance.js';

// Explicit opt-in migration for the original, single-user version of this project.
// Dry run by default. Never assigns records that already belong to an account.
const email = process.argv[2]?.trim().toLowerCase();
const apply = process.argv[3] === '--apply';
// Same per-process DNS workaround used in this project's Windows server setup.
dns.setServers(['8.8.8.8', '8.8.4.4']);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/assign-existing-data.js "your-account-email" [--apply]');
  process.exit(1);
}
try {
  await connectDatabase(process.env.MONGODB_URI);
  const user = await User.findOne({ email });
  if (!user) throw new Error('Create this account in the website before running the migration.');
  const count = await Appliance.countDocuments({ userId: null });
  console.log(`Account: ${email}. Unassigned appliance records: ${count}.`);
  if (apply) {
    const result = await Appliance.updateMany({ userId: null }, { $set: { userId: user._id } });
    console.log(`Assigned ${result.modifiedCount} records. Refresh your dashboard.`);
  } else {
    console.log('Dry run only. Add --apply to assign these unowned records to this account.');
  }
} catch (error) {
  const message = String(error.message).replace(/mongodb(?:\+srv)?:\/\/\S+/gi, '[connection string hidden]');
  console.error(message);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }

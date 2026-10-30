import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  unitRate: { type: Number, required: true, min: 0, max: 10000 },
  fixedCharge: { type: Number, required: true, min: 0, max: 1000000 }
});

// The old shared setting has no userId; the sparse index leaves it untouched.
settingSchema.index({ userId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Setting', settingSchema);

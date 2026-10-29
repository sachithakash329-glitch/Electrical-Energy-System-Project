import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  _id: { type: String, default: 'main' },
  unitRate: { type: Number, required: true, min: 0, max: 10000 },
  fixedCharge: { type: Number, required: true, min: 0, max: 1000000 }
});

export default mongoose.model('Setting', settingSchema);

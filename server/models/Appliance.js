import mongoose from 'mongoose';

const applianceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: {
    type: String, required: true, trim: true, minlength: 2, maxlength: 60
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true
  },
  powerWatts: { type: Number, required: true, min: 0.1, max: 100000 },
  quantity: {
    type: Number, required: true, min: 1, max: 1000,
    validate: { validator: Number.isInteger, message: 'Quantity must be a whole number.' }
  },
  hoursPerDay: { type: Number, required: true, min: 0, max: 24 },
  daysPerMonth: {
    type: Number, required: true, min: 1, max: 31,
    validate: { validator: Number.isInteger, message: 'Days must be a whole number.' }
  }
}, { timestamps: true });

applianceSchema.index({ userId: 1, createdAt: -1 });

// Energy is calculated from these inputs, so it cannot become stale after an edit.
export default mongoose.model('Appliance', applianceSchema);

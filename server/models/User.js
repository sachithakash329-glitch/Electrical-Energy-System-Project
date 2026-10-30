import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true },
  passwordHash: { type: String, required: true, select: false },
  householdName: { type: String, trim: true, maxlength: 60, default: '' },
  city: { type: String, trim: true, maxlength: 80, default: '' },
  householdSize: {
    type: Number, min: 1, max: 50, default: null,
    validate: { validator: value => value == null || Number.isInteger(value), message: 'Household members must be a whole number.' }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);

import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  // Store a SHA-256 digest of the random cookie, never the cookie itself.
  _id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model('Session', sessionSchema);

import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true }
});

export default mongoose.model('Room', roomSchema);

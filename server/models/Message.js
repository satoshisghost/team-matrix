import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  team:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, default: '' },
  fileUrl: { type: String },
  fileType: { type: String },
  pinned:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema);

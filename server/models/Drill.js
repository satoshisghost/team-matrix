import mongoose from 'mongoose';

const drillSchema = new mongoose.Schema({
  team:        { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  name:        { type: String, required: true },
  category:    {
    type: String,
    enum: ['offense', 'defense', 'special_teams', 'conditioning', 'skills', 'other'],
    default: 'other'
  },
  duration:    { type: Number, default: 10 }, // minutes
  description: { type: String, default: '' },
  playerCount: { type: String, default: '' },
  equipment:   [String],
  isDefault:   { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:   { type: Date, default: Date.now }
});

export default mongoose.model('Drill', drillSchema);

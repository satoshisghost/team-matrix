import mongoose from 'mongoose';

const practiceDrillSchema = new mongoose.Schema({
  drillId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Drill' },
  name:      { type: String }, // fallback name if no drillId
  duration:  { type: Number, default: 10 },
  order:     { type: Number, default: 0 },
  notes:     { type: String, default: '' }
});

const practiceSchema = new mongoose.Schema({
  team:          { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  title:         { type: String, required: true },
  date:          { type: Date },
  goals:         [String],
  drills:        [practiceDrillSchema],
  totalDuration: { type: Number, default: 0 },
  notes:         { type: String, default: '' },
  event:         { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:     { type: Date, default: Date.now }
});

practiceSchema.pre('save', function(next) {
  this.totalDuration = this.drills.reduce((sum, d) => sum + (d.duration || 0), 0);
  next();
});

export default mongoose.model('Practice', practiceSchema);

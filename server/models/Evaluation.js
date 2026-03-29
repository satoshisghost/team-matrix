import mongoose from 'mongoose';

const criterionSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  score: { type: Number, min: 1, max: 10, required: true }
});

const evaluationSchema = new mongoose.Schema({
  team:        { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  player:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  criteria:    [criterionSchema],
  overallScore: { type: Number, min: 1, max: 10 },
  notes:       { type: String, default: '' },
  season:      { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now }
});

// Auto-calculate overall score as average of criteria
evaluationSchema.pre('save', function(next) {
  if (this.criteria && this.criteria.length > 0) {
    const total = this.criteria.reduce((sum, c) => sum + c.score, 0);
    this.overallScore = Math.round((total / this.criteria.length) * 10) / 10;
  }
  next();
});

export default mongoose.model('Evaluation', evaluationSchema);

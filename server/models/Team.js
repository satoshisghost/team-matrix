import mongoose from 'mongoose';

const playbookSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  fileUrl:     { type: String },
  fileType:    { type: String, enum: ['video', 'pdf', 'image'], default: 'pdf' },
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt:  { type: Date, default: Date.now }
});

const depthEntrySchema = new mongoose.Schema({
  position: { type: String, required: true },
  players:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const teamSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  sport:      { type: String, enum: ['football', 'basketball', 'baseball', 'soccer', 'volleyball', 'lacrosse', 'other'], default: 'football' },
  season:     { type: String, default: '' },
  level:      { type: String, enum: ['youth', 'middle_school', 'high_school', 'college', 'adult', 'pro'], default: 'high_school' },
  coach:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staff:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  players:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  playbooks:  [playbookSchema],
  depthChart: [depthEntrySchema],
  formation:  { type: String, default: '4-3' },
  inviteCode: { type: String, unique: true },
  createdAt:  { type: Date, default: Date.now }
});

teamSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

export default mongoose.model('Team', teamSchema);

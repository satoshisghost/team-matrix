import mongoose from 'mongoose';

const attendeeSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['attending', 'absent', 'pending'], default: 'pending' },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date }
});

const eventSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  type:     { type: String, enum: ['game', 'practice', 'travel', 'meeting', 'tryout', 'other'], default: 'practice' },
  date:     { type: Date, required: true },
  endDate:  { type: Date },
  location: { type: String, default: '' },
  address:  { type: String, default: '' },
  team:     { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  attendees: [attendeeSchema],
  notes:    { type: String, default: '' },
  travelInfo: {
    departure:   String,
    destination: String,
    hotel:       String,
    busTime:     String,
    flightInfo:  String
  },
  opponent:   { type: String, default: '' },
  homeAway:   { type: String, enum: ['home', 'away', 'neutral', ''], default: '' },
  scoreUs:    { type: Number },
  scoreThem:  { type: Number },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:  { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);

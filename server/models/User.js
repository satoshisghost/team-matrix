import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, default: '' }, // optional for OAuth users
  name:     { type: String, required: true },
  phone:    { type: String, default: '' },
  role:     {
    type: String,
    enum: ['admin', 'director', 'coach', 'team_manager', 'player', 'parent', 'staff'],
    default: 'player'
  },
  position:       { type: String, default: '' },
  number:         { type: Number },
  avatar:         { type: String, default: '' },
  team:           { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  graduationYear: { type: Number },
  bio:            { type: String, default: '' },
  // OAuth
  googleId:     { type: String, default: '' },
  appleId:      { type: String, default: '' },
  authProvider: { type: String, enum: ['local', 'google', 'apple'], default: 'local' },
  createdAt:    { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);

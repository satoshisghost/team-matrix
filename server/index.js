import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import session from 'express-session';
import passport from 'passport';
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/team.js';
import rosterRoutes from './routes/roster.js';
import scheduleRoutes from './routes/schedule.js';
import mediaRoutes from './routes/media.js';
import messageRoutes from './routes/messages.js';
import evaluationRoutes from './routes/evaluations.js';
import drillRoutes from './routes/drills.js';
import practiceRoutes from './routes/practices.js';
import oauthRoutes from './routes/oauth.js';
import Drill from './models/Drill.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // needed for Apple's POST callback
app.use(session({
  secret: process.env.SESSION_SECRET || 'tm-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 } // 10 min, just for OAuth flow
}));
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/app', express.static(path.join(__dirname, '../client')));

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/roster', rosterRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/drills', drillRoutes);
app.use('/api/practices', practiceRoutes);
app.use('/api/oauth', oauthRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ status: 'ok', app: 'Team Matrix', db: states[dbState], time: new Date() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ===== Socket.io =====
io.on('connection', (socket) => {
  socket.on('join-team', (teamId) => socket.join(teamId));
  socket.on('team-message', (data) => io.to(data.teamId).emit('new-message', data));
  socket.on('disconnect', () => {});
});

// ===== Seed Default Drills =====
const DEFAULT_DRILLS = [
  // Offense
  { name: 'Route Running - 7 Routes', category: 'offense', duration: 15, description: 'WRs run all 7 fundamental routes against air, focusing on crisp breaks and proper technique.', playerCount: '4-8 players', equipment: ['Cones'] },
  { name: 'QB Footwork Drops', category: 'offense', duration: 10, description: '3, 5, and 7 step drops with proper footwork mechanics and weight transfer.', playerCount: '1-3 QBs', equipment: ['Football'] },
  { name: 'Hand-Off Exchange', category: 'offense', duration: 10, description: 'QB-RB mesh point drill focusing on ball security and clean handoff mechanics.', playerCount: '4-6 players', equipment: ['Football'] },
  { name: 'Pass Blocking Fundamentals', category: 'offense', duration: 15, description: 'OL punch, kick-slide, and anchor techniques against a pass rush dummy.', playerCount: '5-10 players', equipment: ['Blocking sled', 'Pads'] },
  { name: 'Run Blocking Angles', category: 'offense', duration: 15, description: 'OL angle blocks, down blocks, and combo blocks in a circuit format.', playerCount: '5-10 players', equipment: ['Blocking sled', 'Cones'] },
  { name: 'Red Zone Passing', category: 'offense', duration: 15, description: 'Short-area passing concepts inside the 20 — slants, fades, back-shoulder throws.', playerCount: '6-10 players', equipment: ['Football', 'Cones'] },
  // Defense
  { name: 'Press Coverage 1-on-1', category: 'defense', duration: 15, description: 'DBs engage WRs at the line of scrimmage, practicing jam technique and hip-flipping into phase.', playerCount: '4-8 players', equipment: ['Cones'] },
  { name: 'Zone Drop Drill', category: 'defense', duration: 10, description: 'LBs and DBs drop to their zone keys, reading QB eyes and breaking on the ball.', playerCount: '5-8 players', equipment: ['Cones', 'Football'] },
  { name: 'Pass Rush Moves Circuit', category: 'defense', duration: 15, description: 'Bull rush, speed rush, swim move, and spin move against an OL partner.', playerCount: '4-8 players', equipment: ['Pads', 'Blocking dummy'] },
  { name: 'Tackling Circuit', category: 'defense', duration: 15, description: 'Angle tackles, open-field tackling, and form tackling stations in a circuit.', playerCount: '6-12 players', equipment: ['Pads', 'Cones'] },
  { name: 'Strip Ball Drill', category: 'defense', duration: 10, description: 'Defenders practice punch-and-rip technique to strip the ball from a carrier.', playerCount: '4-8 players', equipment: ['Football', 'Pads'] },
  { name: 'Cover-2 Zone Defense', category: 'defense', duration: 15, description: 'Full secondary runs Cover-2 assignments vs. various route combinations.', playerCount: '7-11 players', equipment: ['Cones', 'Football'] },
  // Special Teams
  { name: 'Punt Return Setup', category: 'special_teams', duration: 10, description: 'Return unit practices alignment, blocking assignments, and return lanes.', playerCount: '11 players', equipment: ['Cones', 'Football'] },
  { name: 'Kickoff Coverage Lanes', category: 'special_teams', duration: 10, description: 'Coverage unit runs lanes, practices breakdown tackling in space.', playerCount: '11 players', equipment: ['Cones'] },
  { name: 'Field Goal Block Drill', category: 'special_teams', duration: 10, description: 'Hands team practices timing, jump technique, and penetration gaps for FG block.', playerCount: '6-11 players', equipment: ['Kicking net', 'Football'] },
  // Conditioning
  { name: '40-Yard Dash', category: 'conditioning', duration: 15, description: 'Players run timed 40-yard dashes from a 3-point stance, focusing on start and acceleration.', playerCount: 'Full team', equipment: ['Stopwatch', 'Cones'] },
  { name: 'Agility Ladder', category: 'conditioning', duration: 15, description: 'Six agility ladder patterns: in-out, lateral shuffle, Ickey shuffle, Ali shuffle, and more.', playerCount: 'Full team', equipment: ['Agility ladder'] },
  { name: 'Cone Drills Circuit', category: 'conditioning', duration: 15, description: '5-10-5 shuttle, L-drill, and T-drill for change-of-direction speed.', playerCount: 'Full team', equipment: ['Cones', 'Stopwatch'] },
  { name: 'Bear Crawl & Sprint Circuit', category: 'conditioning', duration: 20, description: 'Bear crawl 10 yards, sprint back, explosive lateral movements.', playerCount: 'Full team', equipment: ['Cones'] },
  // Skills
  { name: 'Ball Security Drill', category: 'skills', duration: 10, description: 'Carriers run a gauntlet of defenders trying to punch the ball out — 4 points of pressure.', playerCount: '4-8 players', equipment: ['Football', 'Pads'] },
  { name: 'Concentration Catching', category: 'skills', duration: 15, description: 'Receivers catch tennis balls, then footballs with varying speeds and locations to improve focus.', playerCount: '4-8 players', equipment: ['Football', 'Tennis balls'] },
  { name: 'Reaction Time Drill', category: 'skills', duration: 10, description: 'Players react to visual and audio cues to fire out, change direction, or catch.', playerCount: 'Full team', equipment: ['Cones', 'Whistle'] },
];

async function seedDefaultDrills() {
  try {
    const count = await Drill.countDocuments({ isDefault: true });
    if (count > 0) return;
    const drills = DEFAULT_DRILLS.map(d => ({ ...d, isDefault: true }));
    await Drill.insertMany(drills);
    console.log(`✅ Seeded ${drills.length} default drills`);
  } catch (err) {
    console.error('⚠️ Drill seeding error:', err.message);
  }
}

// ===== DB Connection =====
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set');
    return;
  }
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected');
    await seedDefaultDrills();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('🔄 Retrying in 10 seconds...');
    setTimeout(connectDB, 10000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected — retrying...');
  setTimeout(connectDB, 10000);
});
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏆 Team Matrix running on port ${PORT}`);
  connectDB();
});

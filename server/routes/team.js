import express from 'express';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { auth, coachOnly } from '../middleware/auth.js';

const router = express.Router();

// Create team
router.post('/create', auth, async (req, res) => {
  try {
    const { name, sport, season, level } = req.body;
    const team = new Team({ name, sport, season, level, coach: req.userId });
    await team.save();
    await User.findByIdAndUpdate(req.userId, { team: team._id, role: 'coach' });
    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Join team by invite code
router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!team) return res.status(404).json({ error: 'Invalid invite code' });
    if (team.players.includes(req.userId) || team.coach?.toString() === req.userId) {
      return res.status(400).json({ error: 'Already on this team' });
    }
    team.players.push(req.userId);
    await team.save();
    await User.findByIdAndUpdate(req.userId, { team: team._id });
    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get team details
router.get('/:teamId', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('coach', 'name email phone role')
      .populate('players', 'name email phone position number avatar role graduationYear')
      .populate('staff', 'name email phone role')
      .populate('depthChart.players', 'name number position');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get my teams
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [{ coach: req.userId }, { players: req.userId }, { staff: req.userId }]
    }).populate('coach', 'name');
    res.json(teams);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove player from team
router.delete('/:teamId/players/:playerId', auth, coachOnly, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    team.players = team.players.filter(p => p.toString() !== req.params.playerId);
    await team.save();
    await User.findByIdAndUpdate(req.params.playerId, { team: null });
    res.json({ message: 'Player removed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update depth chart
router.put('/:teamId/depth-chart', auth, coachOnly, async (req, res) => {
  try {
    const { depthChart, formation } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.teamId,
      { depthChart, formation },
      { new: true }
    ).populate('depthChart.players', 'name number position');
    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update team settings
router.put('/:teamId', auth, coachOnly, async (req, res) => {
  try {
    const { name, season, level, formation } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.teamId,
      { name, season, level, formation },
      { new: true }
    );
    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

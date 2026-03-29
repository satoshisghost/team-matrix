import express from 'express';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get full roster
router.get('/:teamId', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('players', 'name email phone position number avatar role graduationYear bio')
      .populate('coach', 'name email phone role')
      .populate('staff', 'name email phone role');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({
      players: team.players,
      coach: team.coach,
      staff: team.staff
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update player info (coach or self)
router.put('/:teamId/player/:playerId', auth, async (req, res) => {
  try {
    const { position, number, name, phone, bio, graduationYear } = req.body;
    const update = {};
    if (position !== undefined) update.position = position;
    if (number !== undefined) update.number = number;
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (bio !== undefined) update.bio = bio;
    if (graduationYear !== undefined) update.graduationYear = graduationYear;
    const user = await User.findByIdAndUpdate(req.params.playerId, update, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

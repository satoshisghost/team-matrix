import express from 'express';
import Drill from '../models/Drill.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all drills (default + team-specific)
router.get('/:teamId', auth, async (req, res) => {
  try {
    const drills = await Drill.find({
      $or: [{ isDefault: true }, { team: req.params.teamId }]
    }).sort({ isDefault: -1, category: 1, name: 1 });
    res.json(drills);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create custom drill for team
router.post('/:teamId', auth, async (req, res) => {
  try {
    const { name, category, duration, description, playerCount, equipment } = req.body;
    const drill = new Drill({
      team: req.params.teamId,
      name, category, duration, description, playerCount,
      equipment: equipment || [],
      isDefault: false,
      createdBy: req.userId
    });
    await drill.save();
    res.json(drill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete custom drill
router.delete('/:drillId', auth, async (req, res) => {
  try {
    await Drill.findByIdAndDelete(req.params.drillId);
    res.json({ message: 'Drill deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

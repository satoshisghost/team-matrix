import express from 'express';
import Practice from '../models/Practice.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all practice plans for team
router.get('/:teamId', auth, async (req, res) => {
  try {
    const practices = await Practice.find({ team: req.params.teamId })
      .populate('drills.drillId', 'name category duration')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(practices);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create practice plan
router.post('/:teamId', auth, async (req, res) => {
  try {
    const { title, date, goals, drills, notes } = req.body;
    const practice = new Practice({
      team: req.params.teamId,
      title, date, goals, drills, notes,
      createdBy: req.userId
    });
    await practice.save();
    res.json(practice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update practice plan
router.put('/:practiceId', auth, async (req, res) => {
  try {
    const { title, date, goals, drills, notes } = req.body;
    const practice = await Practice.findById(req.params.practiceId);
    if (!practice) return res.status(404).json({ error: 'Practice plan not found' });
    practice.title = title ?? practice.title;
    practice.date = date ?? practice.date;
    practice.goals = goals ?? practice.goals;
    practice.drills = drills ?? practice.drills;
    practice.notes = notes ?? practice.notes;
    await practice.save();
    res.json(practice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete practice plan
router.delete('/:practiceId', auth, async (req, res) => {
  try {
    await Practice.findByIdAndDelete(req.params.practiceId);
    res.json({ message: 'Practice plan deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

import express from 'express';
import Evaluation from '../models/Evaluation.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all evaluations for team
router.get('/:teamId', auth, async (req, res) => {
  try {
    const evals = await Evaluation.find({ team: req.params.teamId })
      .populate('player', 'name number position')
      .populate('evaluatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(evals);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get evaluations for a specific player
router.get('/:teamId/player/:playerId', auth, async (req, res) => {
  try {
    const evals = await Evaluation.find({ team: req.params.teamId, player: req.params.playerId })
      .populate('evaluatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(evals);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create evaluation
router.post('/:teamId', auth, async (req, res) => {
  try {
    const { player, criteria, notes, season } = req.body;
    const evaluation = new Evaluation({
      team: req.params.teamId,
      player,
      evaluatedBy: req.userId,
      criteria,
      notes,
      season
    });
    await evaluation.save();
    const populated = await Evaluation.findById(evaluation._id)
      .populate('player', 'name number position')
      .populate('evaluatedBy', 'name');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete evaluation
router.delete('/:evalId', auth, async (req, res) => {
  try {
    await Evaluation.findByIdAndDelete(req.params.evalId);
    res.json({ message: 'Evaluation deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
